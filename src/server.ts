import express from 'express'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

const app = express()
app.use(express.json())

// Allow requests from your Vue frontend (for dev)
app.use((req, res, next) => {
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
      service: 'gmail', // or your own SMTP server
      auth: {
        user: import.meta.env.MAIL_USER,
        pass: import.meta.env.MAIL_PASS,
      },
    })

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: import.meta.env.MAIL_TO || import.meta.env.MAIL_USER,
      subject: subject || 'New message from your portfolio',
      text: message,
    })

    res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`))