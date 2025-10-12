import express from 'express'
import nodemailer from 'nodemailer'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv'
dotenv.config({
  path: '.env.server'
})

const DEBUG = Number(process.env.DEBUG)

let app = express()
app.use(express.json());

if (!DEBUG) {
  app.use(express.static(path.join(__dirname, 'app')));
}

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
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

if (!DEBUG) {
  app.get(/.*/, (_, res) => {
    res.sendFile(path.join(__dirname, 'app', 'index.html'));
  });
}

const PORT = process.env.SERVER_PORT || 3000
app.listen(PORT, () => console.log(` --> Server running on http://localhost:${PORT} [${DEBUG ? 'DEBUG MODE' : 'PRODUCTION'}]`))