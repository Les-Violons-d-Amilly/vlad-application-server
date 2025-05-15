import { Router, Request, Response } from "express";
import sendEmail from "../utils/sendEmail";
import { validateBody } from "../utils/joiValidation";
import { contactSchema } from "../validation/contactSchemas";

const router = Router();

router.post(
  /**
   * @openapi
   * /api/contact:
   *   post:
   *     tags:
   *       - Contact
   *     summary: Send a contact request
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - message
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               message:
   *                 type: string
   *     responses:
   *       200:
   *         description: Successfully sent  request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Request successfully sent
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  "/",
  validateBody(contactSchema),
  async (req: Request, res: Response): Promise<any> => {
    const { name, email, message } = req.body;

    try {
      /*await sendEmail(
        "orchestre.vlad@gmail.com",
        ` ${name}`,
        `
        <h1>Nouveau formulaire rempli</h1>
        <p><strong>Nom:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `
      );*/

      await sendEmail(
        email,
        "Votre demande pour VLAD a été reçue",
        `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
            <h2>Merci pour votre demande</h2>
            <p>Bonjour ${name},</p>
            <p>Nous avons bien reçu votre message :</p>
            <blockquote style="background: #f4f4f4; border-left: 4px solid #0078D7; margin: 1em 0; padding: 0.5em 1em; white-space: pre-wrap;">
            ${message}
            </blockquote>
            <p>Nous vous répondrons dans les plus brefs délais.</p>
            <p>– L'équipe VLAD</p>
        </div>
        `
      );

      res.status(200).json({
        message: "Request successfully sent",
      });
    } catch (error) {
      console.error("Error sending Request :", error);
      res.status(500).json({
        message: "An error occurred while sending the Request ",
      });
    }
  }
);

export default router;
