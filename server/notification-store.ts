import fs from "fs";
import path from "path";

export interface GroupPerson {
  name: string;
  email: string;
}

export interface NotificationGroup {
  id: string;
  name: string;
  department: string;
  members: GroupPerson[];
  managers: GroupPerson[];
}

export interface OverdueNotificationSettings {
  enabled: boolean;
  thresholdDays: number;
  frequency: "once" | "daily";
  sendTime: string; // HH:mm
}

export interface NotificationSettingsPayload {
  groups: NotificationGroup[];
  overdueSettings: OverdueNotificationSettings;
}

const settingsFile = path.resolve(
  import.meta.dirname,
  "..",
  "attached_assets",
  "notification-settings.json",
);

function ensureDirExists(p: string) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function loadNotificationSettings(): Promise<NotificationSettingsPayload> {
  try {
    const buf = await fs.promises.readFile(settingsFile, "utf-8");
    const parsed = JSON.parse(buf);
    return normalizeSettings(parsed);
  } catch {
    return {
      groups: [],
      overdueSettings: {
        enabled: false,
        thresholdDays: 0,
        frequency: "once",
        sendTime: "09:00",
      },
    };
  }
}

export async function saveNotificationSettings(payload: NotificationSettingsPayload): Promise<void> {
  const normalized = normalizeSettings(payload);
  ensureDirExists(settingsFile);
  await fs.promises.writeFile(settingsFile, JSON.stringify(normalized, null, 2), "utf-8");
}

function normalizeSettings(obj: any): NotificationSettingsPayload {
  const normalizePerson = (entry: any): GroupPerson | null => {
    if (!entry || typeof entry !== "object") return null;
    const name = String(entry.name ?? "").trim();
    const email = String(entry.email ?? "").trim();
    if (!name || !email) return null;
    return { name, email };
  };

  const groups: NotificationGroup[] = Array.isArray(obj?.groups)
    ? obj.groups
        .map((g: any) => {
          const members = Array.isArray(g?.members)
            ? g.members.map(normalizePerson).filter(Boolean)
            : [];
          const managers = Array.isArray(g?.managers)
            ? g.managers.map(normalizePerson).filter(Boolean)
            : [];
          return {
            id: String(g.id ?? "").trim(),
            name: String(g.name ?? "").trim(),
            department: String(g.department ?? "").trim(),
            members: members as GroupPerson[],
            managers: managers as GroupPerson[],
          };
        })
        .filter((g: NotificationGroup) => g.id && g.name && g.department)
    : [];

  const rawOverdue = obj?.overdueSettings ?? {};
  const threshold = Number(rawOverdue.thresholdDays ?? 0);
  const frequency =
    rawOverdue.frequency === "daily" || rawOverdue.frequency === "once"
      ? rawOverdue.frequency
      : "once";
  const overdueSettings: OverdueNotificationSettings = {
    enabled: Boolean(rawOverdue.enabled),
    thresholdDays: Number.isFinite(threshold) ? Math.max(0, Math.floor(threshold)) : 0,
    frequency,
    sendTime: String(rawOverdue.sendTime ?? "09:00").trim() || "09:00",
  };

  return { groups, overdueSettings };
}
