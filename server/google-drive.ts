import { google } from 'googleapis';
import fs from 'fs';
import { Readable } from 'stream';

// This module supports two auth modes:
// 1) Service Account via GOOGLE_SERVICE_ACCOUNT_JSON (+ optional GOOGLE_DRIVE_PARENT_FOLDER_ID)
// 2) Legacy Replit connector fallback when the above is not provided

let connectionSettings: any;

async function getDriveClient() {
  // Prefer inline JSON; fallback to file path if provided
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const saPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH;
  if (saJson || saPath) {
    const jsonString = saJson ?? fs.readFileSync(saPath as string, 'utf-8');
    const credentials = JSON.parse(jsonString);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return google.drive({ version: 'v3', auth });
  }

  // Fallback: Replit connector
  const accessToken = await getReplitAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

async function getReplitAccessToken() {
  if (
    connectionSettings &&
    connectionSettings.settings.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken || !hostname) {
    throw new Error('No Google auth configured');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        Accept: 'application/json',
        X_REPLIT_TOKEN: xReplitToken as any,
      } as any,
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }

  return accessToken;
}

async function findOrCreateFolder(drive: any, name: string, parentId?: string) {
  // Try to find existing folder by name under the parent
  const qParts = [
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    `name = '${name.replace(/'/g, "\\'")}'`,
  ];
  if (parentId) qParts.push(`'${parentId}' in parents`);

  const list = await drive.files.list({
    q: qParts.join(' and '),
    fields: 'files(id, name)',
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    pageSize: 1,
  });

  const existing = list.data.files?.[0];
  if (existing?.id) return existing.id;

  // Create new folder
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id',
    supportsAllDrives: true,
  });

  if (!created.data.id) throw new Error('Failed to create folder');
  return created.data.id;
}

export async function ensureTcarFolder(tcarNo: string): Promise<string> {
  const drive = await getDriveClient();
  const parent = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
  const prefix = process.env.GOOGLE_DRIVE_FOLDER_NAME_PREFIX ?? 'TCAR-';
  const folderName = `${prefix}${tcarNo}`;
  const folderId = await findOrCreateFolder(drive, folderName, parent);
  return folderId;
}

export async function uploadFileToDrive(
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
  parentFolderId?: string
): Promise<{ fileId: string; webViewLink: string }> {
  const drive = await getDriveClient();

  const fileMetadata: any = {
    name: fileName,
  };
  if (parentFolderId) fileMetadata.parents = [parentFolderId];

  const media = {
    mimeType: mimeType,
    body: Readable.from(fileBuffer),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  });

  if (!response.data.id || !response.data.webViewLink) {
    throw new Error('Failed to upload file to Google Drive');
  }

  // Optional: make the file viewable by link
  if (process.env.GOOGLE_DRIVE_SHARE_ANYONE_WITH_LINK === '1') {
    try {
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      });
    } catch (e) {
      // Non-fatal; logging omitted to keep server output clean
    }
  }

  return {
    fileId: response.data.id,
    webViewLink: response.data.webViewLink,
  };
}

export async function uploadFileToDriveInTcarFolder(
  tcarNo: string,
  originalFileName: string,
  mimeType: string,
  fileBuffer: Buffer
): Promise<{ fileId: string; webViewLink: string; folderId: string }> {
  const drive = await getDriveClient();
  const parent = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
  const prefix = process.env.GOOGLE_DRIVE_FOLDER_NAME_PREFIX ?? 'TCAR-';
  const folderName = `${prefix}${tcarNo}`;

  const folderId = await findOrCreateFolder(drive, folderName, parent);

  const fileName = `${folderName}-${originalFileName}`;
  const { fileId, webViewLink } = await uploadFileToDrive(
    fileName,
    mimeType,
    fileBuffer,
    folderId
  );

  return { fileId, webViewLink, folderId };
}
