import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

async function testEmail() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PSWD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Test Mailer" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // t'envoie à toi-même pour tester
      subject: "Test de Nodemailer 🎯",
      text: "Ceci est un test d'envoi d'e-mail avec Nodemailer",
      html: "<p>Ceci est un <b>test</b> d'envoi d'e-mail avec Nodemailer</p>",
    });

    console.log("✅ Email envoyé :", info.messageId);
  } catch (err) {
    console.error("❌ Erreur lors de l'envoi :", err);
  }
}

testEmail();
