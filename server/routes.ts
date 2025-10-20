import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClaimSchema, updateClaimSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { uploadFileToDriveInTcarFolder, ensureTcarFolder } from "./google-drive";
import {
  sendClaimCreatedEmail,
  sendClaimAcceptedEmail,
  sendCountermeasureSubmittedEmail,
  sendTechnicalApprovalEmail,
  isEmailConfigured,
} from "./mailer";
import { getRecipientsFor, loadNotificationSettings, saveNotificationSettings, type NotificationSettingsPayload } from "./notification-store";

export async function registerRoutes(app: Express): Promise<Server> {
  // Basic version info sourced from package.json (for diagnostics/UI)
  let appName = "rest-express";
  let appVersion = "unknown";
  try {
    const pkgPath = path.resolve(import.meta.dirname, "..", "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    appName = pkg?.name ?? appName;
    appVersion = pkg?.version ?? appVersion;
  } catch {}

  app.get('/api/version', (_req, res) => {
    res.json({
      name: appName,
      version: appVersion,
      env: app.get('env'),
      commit: process.env.GIT_COMMIT || null,
    });
  });

  // Serve local uploads (fallback when Google Drive is not configured)
  const localUploadsDir = path.resolve(import.meta.dirname, "..", "attached_assets");
  try {
    if (!fs.existsSync(localUploadsDir)) {
      fs.mkdirSync(localUploadsDir, { recursive: true });
    }
  } catch {}
  app.use('/uploads', express.static(localUploadsDir));
  app.get('/api/claims', async (req, res) => {
    try {
      const claims = await storage.getAllClaims();
      res.json(claims);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch claims' });
    }
  });

  app.get('/api/claims/:id', async (req, res) => {
    try {
      const claim = await storage.getClaim(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
      }
      res.json(claim);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch claim' });
    }
  });

  app.post('/api/claims', async (req, res) => {
    try {
      const validatedData = insertClaimSchema.parse(req.body);
      
      // Unified TCAR format: YYYYMM-XXXX (zero-padded, monthly sequential)
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

      const makeNext = async (): Promise<string> => {
        const latest = await storage.getLatestTcarForMonth(yearMonth);
        let nextSeq = 1;
        if (latest) {
          const parts = latest.split('-');
          const last = parts[1] || '';
          const num = parseInt(last, 10);
          if (!isNaN(num)) nextSeq = num + 1;
        }
        return `${yearMonth}-${String(nextSeq).padStart(4, '0')}`;
      };

      let claim;
      let attempts = 0;
      const maxAttempts = 3;
      while (true) {
        const tcarNo = await makeNext();
        try {
          claim = await storage.createClaim(validatedData, tcarNo);
          break;
        } catch (e) {
          // In case of rare race causing duplicate unique violation, retry a few times
          if (++attempts >= maxAttempts) {
            throw e;
          }
        }
      }

      // Try to create the Google Drive folder at registration time (best-effort)
      try {
        const folderId = await ensureTcarFolder(claim.tcarNo);
        console.log(`[drive] ensured folder for ${claim.tcarNo}: ${folderId}`);
      } catch (e) {
        const msg = (e as any)?.message || String(e);
        console.warn('[drive] ensureTcarFolder failed:', msg);
      }

      // Fire-and-forget email notification for claim creation based on workflow settings
      try {
        const recipients = await getRecipientsFor('onClaimCreated');
        const configured = isEmailConfigured();
        if (!configured) {
          console.warn('[mail] Not configured: set MAIL_FROM and SMTP_*/GMAIL_OAUTH2_* envs');
        }
        if (recipients.length === 0) {
          console.warn('[mail] No recipients for onClaimCreated; configure notification settings');
        }
        if (configured && recipients.length > 0) {
          console.log(`[mail] sending claim-created email to ${recipients.join(',')}`);
          void sendClaimCreatedEmail(claim, recipients);
        }
      } catch (e) {
        console.warn('[mail] Failed to enqueue claim-created email:', (e as any)?.message || String(e));
      }
      res.status(201).json(claim);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create claim' });
    }
  });

  app.patch('/api/claims/:id', async (req, res) => {
    try {
      const validatedUpdates = updateClaimSchema.parse(req.body);
      const prev = await storage.getClaim(req.params.id);
      const claim = await storage.updateClaim(req.params.id, validatedUpdates);
      if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
      }
      // After successful update, trigger workflow notifications based on status transitions
      try {
        if (isEmailConfigured() && prev) {
          if (prev.status !== claim.status) {
            if (claim.status === 'PENDING_COUNTERMEASURE') {
              const recipients = await getRecipientsFor('onClaimAccepted');
              if (recipients.length > 0) {
                void sendClaimAcceptedEmail(claim, recipients);
              }
            } else if (claim.status === 'COMPLETED') {
              const [technicalRecipients, legacyRecipients] = await Promise.all([
                getRecipientsFor('onTechnicalApproved'),
                getRecipientsFor('onCountermeasureSubmitted'),
              ]);

              if (legacyRecipients.length > 0) {
                void sendCountermeasureSubmittedEmail(claim, legacyRecipients);
              }

              const technicalOnly = technicalRecipients.filter(
                (email) => !legacyRecipients.includes(email),
              );
              if (technicalOnly.length > 0) {
                void sendTechnicalApprovalEmail(claim, technicalOnly);
              }
            }
          }
        }
      } catch {}

      res.json(claim);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update claim' });
    }
  });

  app.delete('/api/claims/:id', async (req, res) => {
    try {
      const success = await storage.deleteClaim(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Claim not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete claim' });
    }
  });

  const upload = multer({ storage: multer.memoryStorage() });

  app.post('/api/claims/:id/upload-document', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const claim = await storage.getClaim(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
      }

      let result: { fileId: string; webViewLink: string } | undefined;
      try {
        result = await uploadFileToDriveInTcarFolder(
          claim.tcarNo,
          req.file.originalname,
          req.file.mimetype,
          req.file.buffer
        );
      } catch (e) {
        // Fallback to local storage when Google Drive is not configured
        const safePrefix = (process.env.GOOGLE_DRIVE_FOLDER_NAME_PREFIX ?? 'TCAR-') + claim.tcarNo;
        const fileName = `${safePrefix}-${req.file.originalname}`;
        const dest = path.join(localUploadsDir, fileName);
        await fs.promises.writeFile(dest, req.file.buffer);
        result = { fileId: fileName, webViewLink: `/uploads/${encodeURIComponent(fileName)}` } as any;
      }

      const updatedClaim = await storage.updateClaim(req.params.id, {
        driveFileId: result!.fileId,
        driveFileUrl: result!.webViewLink,
      });

      res.json({
        fileId: result.fileId,
        fileUrl: result.webViewLink,
        claim: updatedClaim,
      });
    } catch (error) {
      console.error('Failed to upload document:', error);
      res.status(500).json({ error: 'Failed to upload document to Google Drive' });
    }
  });

  // Upload registration-time attachment (kept separate from countermeasure document)
  app.post('/api/claims/:id/upload-attachment', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const claim = await storage.getClaim(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
      }

      let result: { fileId: string; webViewLink: string } | undefined;
      try {
        result = await uploadFileToDriveInTcarFolder(
          claim.tcarNo,
          req.file.originalname,
          req.file.mimetype,
          req.file.buffer
        );
      } catch (e) {
        const safePrefix = (process.env.GOOGLE_DRIVE_FOLDER_NAME_PREFIX ?? 'TCAR-') + claim.tcarNo;
        const fileName = `${safePrefix}-${req.file.originalname}`;
        const dest = path.join(localUploadsDir, fileName);
        await fs.promises.writeFile(dest, req.file.buffer);
        result = { fileId: fileName, webViewLink: `/uploads/${encodeURIComponent(fileName)}` } as any;
      }

      const attachment = {
        fileId: result!.fileId,
        fileUrl: result!.webViewLink,
        fileName: req.file.originalname,
        uploadedAt: new Date().toISOString(),
      };
      const next = [...((claim as any).attachments ?? []), attachment];
      const updatedClaim = await storage.updateClaim(req.params.id, { attachments: next } as any);

      res.json({
        fileId: result!.fileId,
        fileUrl: result!.webViewLink,
        attachment,
        claim: updatedClaim,
      });
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      res.status(500).json({ error: 'Failed to upload attachment' });
    }
  });

  const httpServer = createServer(app);

  // Notification settings endpoints
  app.get('/api/notification-settings', async (_req, res) => {
    try {
      const payload = await loadNotificationSettings();
      res.json(payload);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load notification settings' });
    }
  });

  app.post('/api/notification-settings', async (req, res) => {
    try {
      const payload = req.body as NotificationSettingsPayload;
      await saveNotificationSettings(payload);
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: 'Failed to save notification settings' });
    }
  });

  return httpServer;
}
