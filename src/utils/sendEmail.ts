import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PSWD,
  },
});

export default async function sendEmail(
  to: string,
  subject: string,
  /* html */ html: string
) {
  const from = `VLAD No-Reply <${process.env.EMAIL_USER}>`;
  const text = html.replace(/<[^>]+>/g, "");

  const res = await transporter.sendMail({ from, to, subject, html, text });
  return res.accepted.length > 0;
}
