import express from "express";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import prisma from "../lib/prisma.js";
import { authenticate, allowRoles } from "../middleware/auth.js";

function wrapInHTMLTemplate(subject, body, senderName) {
  const formattedBody = body
    .split("\n")
    .map(para => para.trim() ? `<p style="margin-top: 0; margin-bottom: 16px; color: #334155; font-size: 15px; line-height: 1.6;">${para}</p>` : "")
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);">
          <!-- Top Accent Bar -->
          <tr>
            <td style="background-color: #2563eb; height: 6px;"></td>
          </tr>
          
          <!-- Header / Brand -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 800; color: #1e293b; letter-spacing: -0.025em;">LeadFlow</span>
                    <span style="font-size: 11px; font-weight: 600; color: #2563eb; background-color: #eff6ff; padding: 4px 8px; border-radius: 6px; margin-left: 8px; vertical-align: middle; border: 1px solid #dbeafe;">CRM</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              ${formattedBody}
            </td>
          </tr>
          
          <!-- Footer Signature -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #f1f5f9; padding-top: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">${senderName}</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500;">Conseiller Commercial • LeadFlow</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Email Footer Info -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin-top: 24px;">
          <tr>
            <td align="center" style="padding: 0 20px;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                Cet e-mail a été envoyé dans le cadre du suivi de vos opportunités commerciales.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} LeadFlow CRM. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

const router = express.Router();
router.use(authenticate);

// GET /api/emails/config - Get active system settings for emails
router.get("/config", async (req, res, next) => {
  try {
    const configPath = path.resolve(process.cwd(), "src/lib/settings.json");
    let settings = { emailProvider: "smtp" };
    if (fs.existsSync(configPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      } catch (err) {
        // ignore
      }
    }
    res.json({
      success: true,
      data: {
        emailProvider: settings.emailProvider || "smtp",
        resendFromEmail: settings.resendFromEmail || "",
        hasResendApiKey: !!settings.resendApiKey
      }
    });
  } catch (e) {
    next(e);
  }
});

// PUT /api/emails/config - Save global settings (Admin only)
router.put("/config", allowRoles("Administrateur"), async (req, res, next) => {
  try {
    const configPath = path.resolve(process.cwd(), "src/lib/settings.json");
    let settings = { sessionLength: "15m" };
    if (fs.existsSync(configPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      } catch (err) {
        // ignore
      }
    }

    if (req.body.emailProvider) settings.emailProvider = req.body.emailProvider;
    if (req.body.resendFromEmail !== undefined) settings.resendFromEmail = req.body.resendFromEmail;
    if (req.body.resendApiKey !== undefined) settings.resendApiKey = req.body.resendApiKey;

    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2), "utf-8");
    res.json({
      success: true,
      data: {
        emailProvider: settings.emailProvider,
        resendFromEmail: settings.resendFromEmail,
        hasResendApiKey: !!settings.resendApiKey
      }
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/emails/test-smtp - Test email config (Resend key validation or User SMTP validation)
router.post("/test-smtp", async (req, res, next) => {
  try {
    const configPath = path.resolve(process.cwd(), "src/lib/settings.json");
    let settings = { emailProvider: "smtp" };
    if (fs.existsSync(configPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      } catch (err) {
        // ignore
      }
    }

    const provider = req.body.emailProvider || settings.emailProvider || "smtp";

    if (provider === "resend") {
      const apiKey = req.body.resendApiKey || settings.resendApiKey;
      if (!apiKey) {
        return res.status(400).json({ success: false, message: "La clé API Resend n'est pas configurée." });
      }

      // Hit Resend API /api/emails or /api/domains to check validity
      const response = await fetch("https://api.resend.com/domains", {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });
      if (response.ok) {
        res.json({ success: true, message: "Connexion API Resend validée !" });
      } else {
        const errData = await response.json().catch(() => ({}));
        res.status(400).json({ success: false, message: errData.message || "La clé API Resend semble incorrecte." });
      }
    } else {
      // SMTP Mode - verify individual active user's credentials
      const user = await prisma.utilisateur.findUnique({ where: { id: req.user.id } });
      if (!user || !user.smtpHost || !user.smtpUser || !user.smtpPass) {
        return res.status(400).json({
          success: false,
          message: "Veuillez d'abord configurer vos identifiants SMTP individuels dans vos paramètres de compte."
        });
      }

      const transporter = nodemailer.createTransport({
        host: user.smtpHost,
        port: user.smtpPort || 587,
        secure: user.smtpPort === 465,
        auth: {
          user: user.smtpUser,
          pass: user.smtpPass
        }
      });

      await transporter.verify();
      res.json({ success: true, message: "Connexion SMTP individuelle vérifiée avec succès !" });
    }
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || "Erreur de connexion." });
  }
});

// GET /api/emails/history/:leadId - Fetch email history for a specific lead
router.get("/history/:leadId", async (req, res, next) => {
  try {
    const emails = await prisma.email.findMany({
      where: { leadId: req.params.leadId },
      orderBy: { dateCreation: "asc" }
    });
    res.json({ success: true, data: emails });
  } catch (e) {
    next(e);
  }
});

// POST /api/emails/simulate-incoming - Simulate an email reply from the lead
router.post("/simulate-incoming", async (req, res, next) => {
  try {
    const { leadId, subject, body } = req.body;
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead introuvable." });
    }

    const configPath = path.resolve(process.cwd(), "src/lib/settings.json");
    let settings = { emailProvider: "smtp" };
    if (fs.existsSync(configPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      } catch (err) {
        // ignore
      }
    }

    const fromAddress = lead.email || "client@prospect.com";
    const toAddress = settings.resendFromEmail || "onboarding@resend.dev";

    const emailRecord = await prisma.email.create({
      data: {
        sujet: subject || "Re: Suite à notre échange",
        corps: body || "Merci pour votre message. Vos propositions m'intéressent, je reste disponible pour planifier un rendez-vous téléphonique.",
        direction: "RECEIVED",
        expediteur: fromAddress,
        destinataire: toAddress,
        leadId: lead.id
      }
    });

    // Log in CRM activities too
    await prisma.activite.create({
      data: {
        type: "Email",
        description: `Email reçu de ${lead.prenom} ${lead.nom} - Sujet: ${emailRecord.sujet}\n\n${emailRecord.corps}`,
        leadId: lead.id,
        utilisateurId: req.user.id
      }
    });

    res.status(201).json({ success: true, data: emailRecord });
  } catch (e) {
    next(e);
  }
});

// POST /api/emails/send - Send email (uses either Resend API or User SMTP)
router.post("/send", async (req, res, next) => {
  try {
    const { leadId, subject, body } = req.body;
    if (!leadId || !subject || !body) {
      return res.status(400).json({ success: false, message: "leadId, subject et body sont obligatoires." });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead introuvable." });
    }
    if (!lead.email) {
      return res.status(400).json({ success: false, message: "Le lead sélectionné n'a pas d'adresse email." });
    }

    const configPath = path.resolve(process.cwd(), "src/lib/settings.json");
    let settings = { emailProvider: "smtp" };
    if (fs.existsSync(configPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      } catch (err) {
        // ignore
      }
    }

    const provider = settings.emailProvider || "smtp";
    let senderAddress = "";
    let success = false;
    let errMessage = "";

    if (provider === "resend") {
      const apiKey = settings.resendApiKey;
      const from = settings.resendFromEmail || "onboarding@resend.dev";
      if (!apiKey) {
        return res.status(400).json({ success: false, message: "La clé API Resend n'est pas configurée dans les paramètres système." });
      }

      const senderName = `${req.user.prenom || ""} ${req.user.nom || ""}`.trim();
      const formattedFrom = from.includes("<") ? from : `"${senderName}" <${from}>`;

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: formattedFrom,
          to: [lead.email],
          subject: subject,
          text: body,
          html: wrapInHTMLTemplate(subject, body, senderName)
        })
      });

      if (resendResponse.ok) {
        success = true;
        senderAddress = from;
      } else {
        const errorData = await resendResponse.json().catch(() => ({}));
        errMessage = errorData.message || "L'envoi via Resend a échoué.";
      }
    } else {
      // SMTP Mode
      const user = await prisma.utilisateur.findUnique({ where: { id: req.user.id } });
      if (!user || !user.smtpHost || !user.smtpUser || !user.smtpPass) {
        return res.status(400).json({
          success: false,
          message: "SMTP personnel non configuré. Veuillez configurer vos identifiants dans vos paramètres de compte."
        });
      }

      const transporter = nodemailer.createTransport({
        host: user.smtpHost,
        port: user.smtpPort || 587,
        secure: user.smtpPort === 465,
        auth: {
          user: user.smtpUser,
          pass: user.smtpPass
        }
      });

      try {
        const senderName = `${user.prenom} ${user.nom}`;
        await transporter.sendMail({
          from: `"${senderName}" <${user.smtpUser}>`,
          to: lead.email,
          subject: subject,
          text: body,
          html: wrapInHTMLTemplate(subject, body, senderName)
        });
        success = true;
        senderAddress = user.smtpUser;
      } catch (err) {
        errMessage = err.message || "L'envoi via SMTP individuel a échoué.";
      }
    }

    if (!success) {
      return res.status(400).json({ success: false, message: errMessage });
    }

    // Log the sent email in the database
    const emailRecord = await prisma.email.create({
      data: {
        sujet: subject,
        corps: body,
        direction: "SENT",
        expediteur: senderAddress,
        destinataire: lead.email,
        auteurNom: `${req.user.prenom || ""} ${req.user.nom || ""}`.trim(),
        leadId: lead.id,
        utilisateurId: req.user.id
      }
    });

    // Also log in CRM activities
    await prisma.activite.create({
      data: {
        type: "Email",
        description: `Email envoyé à ${lead.prenom} ${lead.nom} (Par: ${emailRecord.auteurNom}) - Sujet: ${subject}\n\n${body}`,
        leadId: lead.id,
        utilisateurId: req.user.id
      }
    });

    res.status(201).json({ success: true, data: emailRecord });
  } catch (e) {
    next(e);
  }
});

export default router;
