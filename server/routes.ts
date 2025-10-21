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

  