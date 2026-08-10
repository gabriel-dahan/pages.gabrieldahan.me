import express from 'express'
import nodemailer from 'nodemailer'
import path from 'path'
import fs from 'fs'
import multer from 'multer'
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
  listPhotographyCategories,
  createPhotographyCategory,
  deletePhotographyCategory,
  getPhotographyCategoryById,
  listPhotographyImages,
  getPhotographyImageById,
  createPhotographyImage,
  updatePhotographyImage,
  deletePhotographyImage,
  listPhotographyImageFilenamesByCategory,
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
})

const photographyDir = path.join(projectRoot, 'data', 'photography')
if (!fs.existsSync(photographyDir)) {
  fs.mkdirSync(photographyDir, { recursive: true })
}

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
])

const photographyUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, photographyDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.jpg'
      cb(null, `${uuidv4()}${ext}`)
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only image uploads are allowed'))
    }
  },
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

// --- Photography ---

app.get('/api/photography/categories', (_req, res) => {
  try {
    res.json({ categories: listPhotographyCategories(db) })
  } catch (err) {
    console.error('Photography categories error:', err)
    res.status(500).json({ error: 'Failed to load categories' })
  }
})

app.post('/api/photography/categories', requireAuth, (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    const slug = typeof req.body.slug === 'string' ? req.body.slug.trim() : undefined
    if (!name) return res.status(400).json({ error: 'Category name is required' })
    if (name.length > 64) return res.status(400).json({ error: 'Name must be 64 characters or fewer' })

    const category = createPhotographyCategory(db, name, slug)
    res.status(201).json({ success: true, category })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create category'
    if (String(message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'A category with that name already exists' })
    }
    console.error('Create photography category error:', err)
    res.status(500).json({ error: 'Failed to create category' })
  }
})

app.delete('/api/photography/categories/:id', requireAuth, (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid category id' })
    }

    const category = getPhotographyCategoryById(db, id)
    if (!category) return res.status(404).json({ error: 'Category not found' })

    const imageRows = listPhotographyImageFilenamesByCategory(db, id)

    const deleted = deletePhotographyCategory(db, id)
    if (!deleted) return res.status(404).json({ error: 'Category not found' })

    for (const filename of imageRows) {
      const filePath = path.join(photographyDir, filename)
      if (filePath.startsWith(photographyDir) && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Delete photography category error:', err)
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

app.get('/api/photography/images', (req, res) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : null
    res.json({ images: listPhotographyImages(db, category) })
  } catch (err) {
    console.error('Photography images error:', err)
    res.status(500).json({ error: 'Failed to load images' })
  }
})

app.get('/api/photography/images/:id/file', (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid image id' })
    }
    const image = getPhotographyImageById(db, id)
    if (!image) return res.status(404).json({ error: 'Image not found' })

    const filePath = path.join(photographyDir, image.filename)
    if (!filePath.startsWith(photographyDir) || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }
    res.sendFile(filePath)
  } catch (err) {
    console.error('Photography file error:', err)
    res.status(500).json({ error: 'Failed to send image' })
  }
})

app.post('/api/photography/images', requireAuth, (req, res) => {
  photographyUpload.single('image')(req, res, (uploadErr) => {
    if (uploadErr) {
      const message = uploadErr instanceof Error ? uploadErr.message : 'Upload failed'
      return res.status(400).json({ error: message })
    }

    try {
      const file = req.file
      if (!file) return res.status(400).json({ error: 'Image file is required' })

      const categoryId = Number(req.body.categoryId)
      if (!Number.isInteger(categoryId) || categoryId < 1) {
        fs.unlinkSync(file.path)
        return res.status(400).json({ error: 'Valid categoryId is required' })
      }

      const category = getPhotographyCategoryById(db, categoryId)
      if (!category) {
        fs.unlinkSync(file.path)
        return res.status(404).json({ error: 'Category not found' })
      }

      const name = typeof req.body.name === 'string' && req.body.name.trim()
        ? req.body.name.trim()
        : path.parse(file.originalname).name

      const camera = typeof req.body.camera === 'string' ? req.body.camera : null
      const obturation = typeof req.body.obturation === 'string' ? req.body.obturation : null
      const capturedAt = typeof req.body.timestamp === 'string' ? req.body.timestamp : null
      const isoRaw = typeof req.body.iso === 'string' ? req.body.iso.trim() : ''
      const iso = isoRaw ? Number(isoRaw) : null
      if (iso !== null && (!Number.isFinite(iso) || iso < 0)) {
        fs.unlinkSync(file.path)
        return res.status(400).json({ error: 'Invalid ISO value' })
      }

      const image = createPhotographyImage(db, {
        categoryId,
        name: name.slice(0, 120),
        filename: file.filename,
        size: file.size,
        camera,
        iso,
        obturation,
        capturedAt,
      })

      res.status(201).json({ success: true, image })
    } catch (err) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      console.error('Create photography image error:', err)
      res.status(500).json({ error: 'Failed to save image' })
    }
  })
})

app.patch('/api/photography/images/:id', requireAuth, (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid image id' })
    }

    const categoryId = req.body.categoryId !== undefined ? Number(req.body.categoryId) : undefined
    if (categoryId !== undefined) {
      if (!Number.isInteger(categoryId) || categoryId < 1) {
        return res.status(400).json({ error: 'Invalid categoryId' })
      }
      if (!getPhotographyCategoryById(db, categoryId)) {
        return res.status(404).json({ error: 'Category not found' })
      }
    }

    const iso = req.body.iso !== undefined
      ? (req.body.iso === null || req.body.iso === '' ? null : Number(req.body.iso))
      : undefined
    if (iso !== undefined && iso !== null && (!Number.isFinite(iso) || iso < 0)) {
      return res.status(400).json({ error: 'Invalid ISO value' })
    }

    const image = updatePhotographyImage(db, id, {
      categoryId,
      name: typeof req.body.name === 'string' ? req.body.name : undefined,
      camera: req.body.camera !== undefined ? String(req.body.camera || '') : undefined,
      iso,
      obturation: req.body.obturation !== undefined ? String(req.body.obturation || '') : undefined,
      capturedAt: req.body.timestamp !== undefined ? String(req.body.timestamp || '') : undefined,
    })

    if (!image) return res.status(404).json({ error: 'Image not found' })
    res.json({ success: true, image })
  } catch (err) {
    console.error('Update photography image error:', err)
    res.status(500).json({ error: 'Failed to update image' })
  }
})

app.delete('/api/photography/images/:id', requireAuth, (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid image id' })
    }

    const deleted = deletePhotographyImage(db, id)
    if (!deleted) return res.status(404).json({ error: 'Image not found' })

    const filePath = path.join(photographyDir, deleted.filename)
    if (filePath.startsWith(photographyDir) && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Delete photography image error:', err)
    res.status(500).json({ error: 'Failed to delete image' })
  }
})

// --- End Photography ---

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
