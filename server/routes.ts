import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer, type Server } from "http";
import { execSync } from "child_process";
import { storage } from "./storage";
import { insertClaimSchema, updateClaimSchema, type Claim } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { uploadFileToDriveInTcarFolder, ensureTcarFolder, getTcarFolderName } from "./google-drive";
import {
  sendClaimCreatedEmail,
  sendClaimAcceptedEmail,
  sendCountermeasureSubmittedEmail,
  sendTechnicalApprovalEmail,
  isEmailConfigured,
} from "./mailer";
import { loadNotificationSettings, saveNotificationSettings, type NotificationSettingsPayload } from "./notification-store";
import { getRecipientsForEvent } from "./notification-logic";
import { startOverdueNotifier } from "./overdue-notifier";

export async function registerRoutes(app: Express): Promise<Server> {
  const pkgPath = path.resolve(import.meta.dirname, "..", "package.json");
  const repoRoot = path.resolve(import.meta.dirname, "..");
  const readGitCommit = () => {
    if (process.env.GIT_COMMIT) return process.env.GIT_COMMIT;
    try {
      const output = execSync("git rev-parse --short HEAD", {
        cwd: repoRoot,
        stdio: ["ignore", "pipe", "ignore"],
      });
      return output.toString().trim() || null;
    } catch {
      return null;
    }
  };
  const readVersionInfo = () => {
    let appName = "rest-express";
    let appVersion = "unknown";
    let commit = readGitCommit();
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      appName = pkg?.name ?? appName;
      appVersion = pkg?.version ?? appVersion;
    } catch {}
    return { appName, appVersion, commit };
  };

  app.get('/api/version', (_req, res) => {
    const { appName, appVersion, commit } = readVersionInfo();
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.json({
      name: appName,
      version: appVersion,
      env: app.get('env'),
      commit: commit || null,
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

      // Fire-and-forget email notification for claim creation
      try {
        const recipients = await getRecipientsForEvent('claimCreated', claim);
        const configured = isEmailConfigured();
        if (!configured) {
          console.warn('[mail] Not configured: set MAIL_FROM and SMTP_*/GMAIL_OAUTH2_* envs');
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
      const validatedUpdates = updateClaimSchema.parse(req.body) as Partial<Claim>;
      const prev = await storage.getClaim(req.params.id);
      const claim = await storage.updateClaim(req.params.id, validatedUpdates);
      if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
      }
      // After successful update, trigger notifications based on status transitions
      try {
        if (isEmailConfigured() && prev) {
          if (prev.status !== claim.status) {
            if (claim.status === 'PENDING_COUNTERMEASURE') {
              const recipients = await getRecipientsForEvent('claimAccepted', claim);
              if (recipients.length > 0) {
                void sendClaimAcceptedEmail(claim, recipients);
              }
            } else if (claim.status === 'PENDING_APPROVAL') {
              const recipients = await getRecipientsForEvent('countermeasureSubmitted', claim);
              if (recipients.length > 0) {
                void sendCountermeasureSubmittedEmail(claim, recipients);
              }
            } else if (claim.status === 'COMPLETED') {
              const recipients = await getRecipientsForEvent('technicalApproved', claim);
              if (recipients.length > 0) {
                void sendTechnicalApprovalEmail(claim, recipients);
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
      const claim = await storage.getClaim(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
      }
      const userRole = (req.header("x-user-role") ?? "").trim();
      const userName = (req.header("x-user-name") ?? "").trim();
      const isAdmin = userRole === "admin";
      const isOwner =
        (!!claim.createdBy && claim.createdBy === userName) ||
        (!claim.createdBy && !!claim.assignee && claim.assignee === userName);
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const success = await storage.deleteClaim(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Claim not found" });
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
        const safePrefix = getTcarFolderName(claim.tcarNo);
        const fileName = `${safePrefix}-${req.file.originalname}`;
        const dest = path.join(localUploadsDir, fileName);
        await fs.promises.writeFile(dest, req.file.buffer);
        result = { fileId: fileName, webViewLink: `/uploads/${encodeURIComponent(fileName)}` } as any;
      }
      if (!result) {
        throw new Error("Failed to store document");
      }

      const nextStatus = claim.status === "COMPLETED" ? claim.status : "PENDING_APPROVAL";
      const updatedClaim = await storage.updateClaim(req.params.id, {
        driveFileId: result.fileId,
        driveFileUrl: result.webViewLink,
        status: nextStatus,
      });

      if (nextStatus === "PENDING_APPROVAL") {
        try {
          const recipients = await getRecipientsForEvent('countermeasureSubmitted', updatedClaim as Claim);
          if (isEmailConfigured() && recipients.length > 0) {
            void sendCountermeasureSubmittedEmail(updatedClaim as Claim, recipients);
          }
        } catch {}
      }

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
        const safePrefix = getTcarFolderName(claim.tcarNo);
        const fileName = `${safePrefix}-${req.file.originalname}`;
        const dest = path.join(localUploadsDir, fileName);
        await fs.promises.writeFile(dest, req.file.buffer);
        result = { fileId: fileName, webViewLink: `/uploads/${encodeURIComponent(fileName)}` } as any;
      }
      if (!result) {
        throw new Error("Failed to store attachment");
      }

      const attachment = {
        fileId: result.fileId,
        fileUrl: result.webViewLink,
        fileName: req.file.originalname,
        uploadedAt: new Date().toISOString(),
      };
      const next = [...(claim.attachments ?? []), attachment];
      const updatedClaim = await storage.updateClaim(req.params.id, { attachments: next });

      res.json({
        fileId: result.fileId,
        fileUrl: result.webViewLink,
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

  startOverdueNotifier();

  return httpServer;
}
