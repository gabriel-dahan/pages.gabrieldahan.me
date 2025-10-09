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
      host: 'pro3.mail.ovh.net', // Votre serveur SMTP OVH
      port: 587, // Port SMTP avec TLS
      secure: false, // false pour le port 587, true pour le port 465
      auth: {
        user: import.meta.env.VITE_APP_MAIL_USER, // Votre email complet OVH
        pass: import.meta.env.VITE_APP_MAIL_PASS, // Votre mot de passe OVH
      },
      tls: {
        rejectUnauthorized: false // Souvent nécessaire avec OVH
      }
    })

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: import.meta.env.VITE_APP_MAIL_USER, // Votre adresse OVH qui recevra les messages
      replyTo: email, // Permet de répondre directement au visiteur
      subject: "[PAGES CONTACT] " + (subject || 'Nouveau message depuis votre portfolio'),
      text: message,
      html: `
        <h3>Nouveau message de contact</h3>
        <p><strong>Nom:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Sujet:</strong> ${subject || 'Non spécifié'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    })

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Erreur email:', err)
    res.status(500).json({ error: 'Échec de l\'envoi du message' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`))