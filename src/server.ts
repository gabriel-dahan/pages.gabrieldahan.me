import express from 'express'
import nodemailer from 'nodemailer'
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isTsNode = __filename.endsWith('.ts');
const projectRoot = isTsNode ? path.resolve(__dirname, '..') : __dirname;

import dotenv from 'dotenv'
dotenv.config({
  path: path.join(projectRoot, '.env.server')
})

const DEBUG = Number(process.env.DEBUG)

let app = express()
app.use(express.json());

const sessions = new Map<string, { username: string; expiresAt: number }>();
const SESSION_DURATION = 1000 * 60 * 60 * 24; // 24 hours

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1] || req.query.token as string;

  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  const session = sessions.get(token);
  if (!session) return res.status(401).json({ error: 'Unauthorized: Invalid token' });

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Unauthorized: Token expired' });
  }

  // Extend session on activity
  session.expiresAt = Date.now() + SESSION_DURATION;
  
  // Attach username to request
  (req as any).username = session.username;
  next();
};

if (!DEBUG) {
  app.use(express.static(path.join(projectRoot, 'static_app')));
}

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
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
      `
    })

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Email error:', err)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

app.get('/api', (_, res) => {
  res.json({ message: 'API served!' });
});

// --- Private Directory Endpoints ---

app.post('/api/private/auth', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  let users: Record<string, string> = {};
  try {
    users = JSON.parse(process.env.PRIVATE_USERS || '{}');
  } catch (err) {
    console.error('Failed to parse PRIVATE_USERS from environment', err);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (users[username] === password) {
    const token = uuidv4();
    sessions.set(token, { username, expiresAt: Date.now() + SESSION_DURATION });
    res.json({ token, username });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/private/files', requireAuth, (req, res) => {
  const username = (req as any).username;
  const baseDir = path.join(projectRoot, 'private_files');
  const userDir = path.join(baseDir, username);

  let filesList: { name: string; size: number; path: string; virtualPath: string; metadata?: any }[] = [];

  // Helper to read directory recursively
  const readDirSafe = (dir: string, prefix: string, virtualPrefix: string) => {
    if (fs.existsSync(dir)) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const newPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
          const newVirtualPrefix = virtualPrefix ? `${virtualPrefix}/${entry.name}` : entry.name;
          readDirSafe(path.join(dir, entry.name), newPrefix, newVirtualPrefix);
        } else if (entry.isFile()) {
           // Skip metadata files themselves
           if (entry.name.startsWith('_') && entry.name.endsWith('.json')) {
               continue;
           }

           let metadata = undefined;
           const metaPath = path.join(dir, `_${entry.name}.json`);
           if (fs.existsSync(metaPath)) {
               try {
                   metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
               } catch (e) {
                   console.error(`Failed to parse metadata for ${entry.name}`, e);
               }
           }

           filesList.push({
             name: entry.name,
             size: fs.statSync(path.join(dir, entry.name)).size,
             path: prefix ? `${prefix}/${entry.name}` : entry.name,
             virtualPath: virtualPrefix ? `${virtualPrefix}/${entry.name}` : entry.name,
             metadata
           });
        }
      }
    }
  };

  try {
    // Read global files (in private_files/global)
    const globalDir = path.join(baseDir, 'global');
    readDirSafe(globalDir, 'global', '');
    
    // Read user specific files (in private_files/username/)
    readDirSafe(userDir, username, '');

    res.json({ files: filesList });
  } catch (err) {
    console.error('Error reading directories:', err);
    res.status(500).json({ error: 'Failed to read directory' });
  }
});

app.get('/api/private/file', requireAuth, (req, res) => {
  const username = (req as any).username;
  const filepath = req.query.path as string;

  if (!filepath) {
    return res.status(400).json({ error: 'Missing file path' });
  }
  
  // Prevent path traversal
  if (filepath.includes('..') || filepath.includes('\\')) {
    return res.status(400).json({ error: 'Invalid file path' });
  }

  const baseDir = path.join(projectRoot, 'private_files');
  const targetPath = path.join(baseDir, filepath);

  // Security check: ensure the resolved path stays within the baseDir
  if (!targetPath.startsWith(baseDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Security check: if the path implies a user directory, ensure it is THEIR directory or 'global'
  // e.g., if filepath is "family/example.txt", ensure username is "family"
  const filepathSegments = filepath.split('/');
  if (filepathSegments.length > 1) {
      const targetUser = filepathSegments[0];
      if (targetUser !== username && targetUser !== 'global') {
          return res.status(403).json({ error: 'Access denied to other user directories' });
      }
  }

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    res.sendFile(targetPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to send file' });
        }
      }
    });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// --- End Private Directory Endpoints ---

if (!DEBUG) {
  app.get(/.*/, (_, res) => {
    res.sendFile(path.join(projectRoot, 'static_app', 'index.html'), (err) => {
      if (err) {
        console.error('Failed to send index.html. Is the frontend built?', err);
        res.status(404).send('Frontend not built. Please run npm run build first.');
      }
    });
  });
}

const PORT = process.env.SERVER_PORT || 3000
app.listen(PORT, () => console.log(` --> Server running on http://localhost:${PORT} [${DEBUG ? 'DEBUG MODE' : 'PRODUCTION'}]`))