import express from 'express'
import nodemailer from 'nodemailer'

import dotenv from 'dotenv'
dotenv.config({
  path: 'src/.env.server'
})

const app = express()
app.use(express.json())

// Allow requests from your Vue frontend (for dev)
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

const PORT = process.env.SERVER_PORT || 3000
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`))