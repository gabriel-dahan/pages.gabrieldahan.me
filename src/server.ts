import express from 'express'
import nodemailer from 'nodemailer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import {
  initDb,
  listProjects,
  listApprovedComments,
  listPendingComments,
  createComment,
  approveComment,
  rejectComment,
  syncPrivateFiles,
  listPrivateFilesForUser,
  updatePrivateFileMeta,
  authenticateUser,
} from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// src/server.ts or dist-server/server.js → project root is one level up
const projectRoot = path.resolve(__dirname, '..')

dotenv.config({
  path: path.join(projectRoot, '.env.server'),
})

const DEBUG = Number(process.env.DEBUG)
const db = initDb(projectRoot)
syncPrivateFiles(db, projectRoot)

const app = express()
app.use(express.json())

const sessions = new Map<string, { username: string; expiresAt: number }>()
const SESSION_DURATION = 1000 * 60 * 60 * 24 // 24 hours

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization
  const token = (authHeader && authHeader.split(' ')[1]) || (req.query.token as string)

  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' })

  const session = sessions.get(token)
  if (!session) return res.status(401).json({ error: 'Unauthorized: Invalid token' })

  if (Date.now() > session.expiresAt) {
    sessions.delete(token)
    return res.status(401).json({ error: 'Unauthorized: Token expired' })
  }

  session.expiresAt = Date.now() + SESSION_DURATION
  ;(req as express.Request & { username?: string }).username = session.username
  next()
}

if (!DEBUG) {
  app.use(express.static(path.join(projectRoot, 'static_app')))
}

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
})

app.options(/.*/, (_req, res) => {
  res.sendStatus(204)
})

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body

  if (!name || !email || !message)
    return res.status(400).json({ error: 'Missing required fields' })

  try {
    const transporter = nodemailer.createTransport({
      host: 'pro3.mail.ovh.net',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    })

    await transporter.sendMail({
      from: `"${name}" <${process.env.MAIL_USER}>`,
      sender: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      replyTo: email,
      subject: `[PAGES CONTACT] ${subject || 'New message from your portfolio'}`,
      text: message,
      html: `
        <h3>New contact message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || 'Not specified'}</p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    })

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Email error:', err)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

app.get('/api', (_, res) => {
  res.json({ message: 'API served!' })
})

// --- Projects ---

app.get('/api/projects', (req, res) => {
  try {
    const featuredOnly = req.query.featured === '1' || req.query.featured === 'true'
    res.json({ projects: listProjects(db, featuredOnly) })
  } catch (err) {
    console.error('Projects error:', err)
    res.status(500).json({ error: 'Failed to load projects' })
  }
})

// --- Comments ---

app.get('/api/comments', (_req, res) => {
  try {
    res.json({ comments: listApprovedComments(db) })
  } catch (err) {
    console.error('Comments list error:', err)
    res.status(500).json({ error: 'Failed to load comments' })
  }
})

app.post('/api/comments', (req, res) => {
  try {
    const author = typeof req.body.author === 'string' ? req.body.author.trim() : ''
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : ''

    if (!author || !message) {
      return res.status(400).json({ error: 'Author and message are required' })
    }
    if (author.length > 64) {
      return res.status(400).json({ error: 'Author must be 64 characters or fewer' })
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message must be 1000 characters or fewer' })
    }

    const comment = createComment(db, author, message)
    res.status(201).json({
      success: true,
      message: 'Comment queued for review',
      comment: { id: comment.id, author: comment.author, created_at: comment.created_at },
    })
  } catch (err) {
    console.error('Comment create error:', err)
    res.status(500).json({ error: 'Failed to create comment' })
  }
})

app.get('/api/comments/pending', requireAuth, (_req, res) => {
  try {
    res.json({ comments: listPendingComments(db) })
  } catch (err) {
    console.error('Pending comments error:', err)
    res.status(500).json({ error: 'Failed to load pending comments' })
  }
})

app.post('/api/comments/:id/approve', requireAuth, (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid comment id' })
    }
    const username = (req as express.Request & { username?: string }).username || 'admin'
    const comment = approveComment(db, id, username)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })
    res.json({ success: true, comment })
  } catch (err) {
    console.error('Approve comment error:', err)
    res.status(500).json({ error: 'Failed to approve comment' })
  }
})

app.post('/api/comments/:id/reject', requireAuth, (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid comment id' })
    }
    const ok = rejectComment(db, id)
    if (!ok) return res.status(404).json({ error: 'Comment not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('Reject comment error:', err)
    res.status(500).json({ error: 'Failed to reject comment' })
  }
})

// --- Cute public API proxies (avoid browser CORS issues) ---

app.get('/api/toys/cat', async (_req, res) => {
  try {
    const r = await fetch('https://catfact.ninja/fact')
    if (!r.ok) throw new Error('upstream')
    const data = (await r.json()) as { fact?: string }
    res.json({ text: data.fact ?? '', meta: 'catfact.ninja' })
  } catch {
    res.status(502).json({ error: 'Failed to fetch cat fact' })
  }
})

app.get('/api/toys/joke', async (_req, res) => {
  try {
    const r = await fetch('https://official-joke-api.appspot.com/random_joke')
    if (!r.ok) throw new Error('upstream')
    const data = (await r.json()) as { setup?: string; punchline?: string; type?: string }
    res.json({
      text: `${data.setup} — ${data.punchline}`,
      meta: data.type ? `${data.type} joke` : 'random joke',
    })
  } catch {
    res.status(502).json({ error: 'Failed to fetch joke' })
  }
})

// --- Private Directory Endpoints ---

app.post('/api/private/auth', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' })
  }

  try {
    const user = authenticateUser(db, String(username), String(password))
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = uuidv4()
    sessions.set(token, { username: user.username, expiresAt: Date.now() + SESSION_DURATION })
    res.json({ token, username: user.username })
  } catch (err) {
    console.error('Auth error:', err)
    res.status(500).json({ error: 'Authentication failed' })
  }
})

app.get('/api/private/files', requireAuth, (req, res) => {
  const username = (req as express.Request & { username?: string }).username
  if (!username) return res.status(401).json({ error: 'Unauthorized' })

  try {
    syncPrivateFiles(db, projectRoot)
    const rows = listPrivateFilesForUser(db, username)
    const files = rows.map((row) => ({
      name: row.name,
      size: row.size,
      path: row.storage_path,
      virtualPath: row.virtual_path,
      metadata: {
        alias: row.alias || undefined,
        description: row.description || undefined,
      },
    }))
    res.json({ files })
  } catch (err) {
    console.error('Error reading directories:', err)
    res.status(500).json({ error: 'Failed to read directory' })
  }
})

app.patch('/api/private/files/meta', requireAuth, (req, res) => {
  const username = (req as express.Request & { username?: string }).username
  if (!username) return res.status(401).json({ error: 'Unauthorized' })

  const storagePath = typeof req.body.path === 'string' ? req.body.path : ''
  const alias = typeof req.body.alias === 'string' ? req.body.alias.trim() : null
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : null

  if (!storagePath || storagePath.includes('..') || storagePath.includes('\\')) {
    return res.status(400).json({ error: 'Invalid file path' })
  }

  const segments = storagePath.split('/')
  const owner = segments[0]
  if (owner !== username && owner !== 'global') {
    return res.status(403).json({ error: 'Access denied to other user directories' })
  }

  try {
    const row = updatePrivateFileMeta(
      db,
      storagePath,
      alias === '' ? null : alias,
      description === '' ? null : description,
    )
    if (!row) return res.status(404).json({ error: 'File not found in index' })
    res.json({
      success: true,
      file: {
        name: row.name,
        size: row.size,
        path: row.storage_path,
        virtualPath: row.virtual_path,
        metadata: {
          alias: row.alias || undefined,
          description: row.description || undefined,
        },
      },
    })
  } catch (err) {
    console.error('Update meta error:', err)
    res.status(500).json({ error: 'Failed to update metadata' })
  }
})

app.get('/api/private/file', requireAuth, (req, res) => {
  const username = (req as express.Request & { username?: string }).username
  const filepath = req.query.path as string

  if (!filepath) {
    return res.status(400).json({ error: 'Missing file path' })
  }

  if (filepath.includes('..') || filepath.includes('\\')) {
    return res.status(400).json({ error: 'Invalid file path' })
  }

  const baseDir = path.join(projectRoot, 'private_files')
  const targetPath = path.join(baseDir, filepath)

  if (!targetPath.startsWith(baseDir)) {
    return res.status(403).json({ error: 'Access denied' })
  }

  const filepathSegments = filepath.split('/')
  if (filepathSegments.length > 1) {
    const targetUser = filepathSegments[0]
    if (targetUser !== username && targetUser !== 'global') {
      return res.status(403).json({ error: 'Access denied to other user directories' })
    }
  }

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    res.sendFile(targetPath, (err) => {
      if (err) {
        console.error('Error sending file:', err)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to send file' })
        }
      }
    })
  } else {
    res.status(404).json({ error: 'File not found' })
  }
})

// --- End Private Directory Endpoints ---

if (!DEBUG) {
  app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' })
    }
    res.sendFile(path.join(projectRoot, 'static_app', 'index.html'), (err) => {
      if (err) {
        console.error('Failed to send index.html. Is the frontend built?', err)
        res.status(404).send('Frontend not built. Please run npm run build first.')
      }
    })
  })
}

const PORT = process.env.SERVER_PORT || 3000
app.listen(PORT, () =>
  console.log(` --> Server running on http://localhost:${PORT} [${DEBUG ? 'DEBUG MODE' : 'PRODUCTION'}]`),
)
