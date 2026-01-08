import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { sendOverdueEmail, isEmailConfigured } from "./mailer";
import { loadNotificationSettings } from "./notification-store";
import { getRecipientsForEvent } from "./notification-logic";

const sentFile = path.resolve(
  import.meta.dirname,
  "..",
  "attached_assets",
  "overdue-notifications.json",
);

type SentMap = Record<string, string>;

function loadSentMap(): SentMap {
  try {
    const raw = fs.readFileSync(sentFile, "utf-8");
    return JSON.parse(raw) as SentMap;
  } catch {
    return {};
  }
}

function saveSentMap(map: SentMap) {
  const dir = path.dirname(sentFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(sentFile, JSON.stringify(map, null, 2), "utf-8");
}

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const parseDueDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

let lastRunKey: string | null = null;

function shouldRunNow(sendTime: string, now: Date) {
  const todayKey = toDateKey(now);
  if (lastRunKey === todayKey) return false;
  const [hour, minute] = sendTime.split(":").map((part) => Number(part));
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (now < target) return false;
  lastRunKey = todayKey;
  return true;
}

export function startOverdueNotifier() {
  const run = async () => {
    try {
      const { overdueSettings } = await loadNotificationSettings();
      if (!overdueSettings.enabled) return;
      if (!shouldRunNow(overdueSettings.sendTime, new Date())) return;

      const configured = isEmailConfigured();
      if (!configured) {
        console.warn("[mail] Not configured: set MAIL_FROM and SMTP_*/GMAIL_OAUTH2_* envs");
        return;
      }

      const claims = await storage.getAllClaims();
      const sentMap = loadSentMap();
      const todayKey = toDateKey(new Date());
      const thresholdDays = overdueSettings.thresholdDays ?? 0;
      const cutoff = new Date();
      cutoff.setHours(0, 0, 0, 0);
      cutoff.setDate(cutoff.getDate() - thresholdDays);

      for (const claim of claims) {
        if (claim.status === "COMPLETED") continue;
        const due = parseDueDate(claim.dueDate ?? undefined);
        if (!due) continue;
        if (due > cutoff) continue;

        if (overdueSettings.frequency === "once" && sentMap[claim.id]) {
          continue;
        }

        const recipients = await getRecipientsForEvent("overdue", claim);
        if (recipients.length === 0) continue;
        console.log(`[mail] sending overdue email to ${recipients.join(",")}`);
        await sendOverdueEmail(claim, recipients);
        sentMap[claim.id] = overdueSettings.frequency === "daily" ? todayKey : todayKey;
      }

      saveSentMap(sentMap);
    } catch (error) {
      console.warn("[mail] Failed to process overdue notifications:", error);
    }
  };

  // run every minute to catch configured time
  setInterval(run, 60 * 1000);
  void run();
}
