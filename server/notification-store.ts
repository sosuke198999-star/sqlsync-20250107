import fs from 'fs';
import path from 'path';

export interface NotificationGroup {
  id: string;
  name: string;
  emails: string[];
}

export interface WorkflowNotificationSettings {
  onClaimCreated: string[];
  onClaimAccepted: string[];
  onCountermeasureSubmitted: string[];
  onTechnicalApproved: string[];
}

export interface NotificationSettingsPayload {
  groups: NotificationGroup[];
  workflowSettings: WorkflowNotificationSettings;
}

const settingsFile = path.resolve(import.meta.dirname, "..", "attached_assets", "notification-settings.json");

function ensureDirExists(p: string) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function loadNotificationSettings(): Promise<NotificationSettingsPayload> {
  try {
    const buf = await fs.promises.readFile(settingsFile, 'utf-8');
    const parsed = JSON.parse(buf);
    return normalizeSettings(parsed);
  } catch {
    // default empty settings
    return {
      groups: [],
      workflowSettings: {
        onClaimCreated: [],
        onClaimAccepted: [],
        onCountermeasureSubmitted: [],
        onTechnicalApproved: [],
      },
    };
  }
}

export async function saveNotificationSettings(payload: NotificationSettingsPayload): Promise<void> {
  const normalized = normalizeSettings(payload);
  ensureDirExists(settingsFile);
  await fs.promises.writeFile(settingsFile, JSON.stringify(normalized, null, 2), 'utf-8');
}

function normalizeSettings(obj: any): NotificationSettingsPayload {
  const groups: NotificationGroup[] = Array.isArray(obj?.groups) ? obj.groups.map((g: any) => ({
    id: String(g.id ?? ''),
    name: String(g.name ?? ''),
    emails: Array.isArray(g.emails) ? g.emails.map((e: any) => String(e ?? '').trim()).filter(Boolean) : [],
  })).filter((g: NotificationGroup) => g.id && g.name) : [];

  const wf = obj?.workflowSettings ?? {};
  const workflowSettings: WorkflowNotificationSettings = {
    onClaimCreated: Array.isArray(wf.onClaimCreated) ? wf.onClaimCreated.map(String) : [],
    onClaimAccepted: Array.isArray(wf.onClaimAccepted) ? wf.onClaimAccepted.map(String) : [],
    onCountermeasureSubmitted: Array.isArray(wf.onCountermeasureSubmitted) ? wf.onCountermeasureSubmitted.map(String) : [],
    onTechnicalApproved: Array.isArray(wf.onTechnicalApproved) ? wf.onTechnicalApproved.map(String) : [],
  };

  return { groups, workflowSettings };
}

export async function getRecipientsFor(eventKey: keyof WorkflowNotificationSettings): Promise<string[]> {
  const { groups, workflowSettings } = await loadNotificationSettings();
  const selected = new Set<string>(workflowSettings[eventKey] || []);
  const emails = new Set<string>();
  for (const g of groups) {
    if (selected.has(g.id)) {
      for (const e of g.emails) {
        const v = String(e || '').trim();
        if (v) emails.add(v);
      }
    }
  }
  return Array.from(emails);
}
