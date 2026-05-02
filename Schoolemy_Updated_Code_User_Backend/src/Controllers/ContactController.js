import logger from "../Utils/logger.js";

import transporter from "../Notification/EmailTransport.js"; // SECURITY FIX 3.26.1: Use canonical EmailTransport location

// SECURITY FIX 3.31.2: Import sanitization functions
import { sanitizeText, sanitizeEmail } from "../Utils/sanitizationUtils.js";

export const sendContactEmail = async (req, res) => {
  try {
    // SECURITY FIX 3.31.2: Sanitize all input
    let { name, email, subject, message } = req.body;

    // Sanitize inputs
    name = sanitizeText(name);
    email = sanitizeEmail(email);
    subject = sanitizeText(subject || "");
    message = sanitizeText(message);

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Name, email and message are required." });
    }

    const adminEmail = process.env.EMAIL_ADMIN;

    // SECURITY FIX 3.31.2: Text is already sanitized, just add back <br/> for newlines
    const safeName = name;
    const safeEmail = email;
    const safeSubject = subject;
    const safeMessage = message.replace(/\n/g, "<br/>"); // Add back <br/> for formatting

    // Email to site admin
    const mailOptionsToAdmin = {
      from: adminEmail,
      to: adminEmail,
      subject: `Contact form: ${safeSubject || "New message from website"}`,
      html: `
        <h3>New contact form submission</h3>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p><strong>Message:</strong><br/>${safeMessage}</p>
      `,
    };

    // Acknowledge to user
    const mailOptionsToUser = {
      from: adminEmail,
      to: email,
      subject: `Thanks for contacting Schoolemy${safeSubject ? ` — ${safeSubject}` : ""}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h3>Hi ${safeName},</h3>
          <p>Thanks for reaching out to Schoolemy. We have received your message and will get back to you shortly.</p>
          <p><strong>Your message:</strong></p>
          <div style="border-left:3px solid #eee;padding-left:8px;color:#333">${safeMessage}</div>
          <hr/>
          <p style="color:#777;">© 2025 Schoolemy</p>
        </div>
      `,
    };

    // Send both emails
    await transporter.sendMail(mailOptionsToAdmin);
    await transporter.sendMail(mailOptionsToUser);

    return res.status(201).json({ success: true, message: "Message sent successfully." });
  } catch (error) {
    logger.error("Error in sendContactEmail:", error);
    return res.status(500).json({ success: false, message: "Failed to send message." });
  }
};

export default { sendContactEmail };