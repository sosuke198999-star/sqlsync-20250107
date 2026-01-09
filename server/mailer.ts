import nodemailer from "nodemailer";
import { type Claim } from "@shared/schema";

function getBool(val: string | undefined, def = false): boolean {
  if (val == null) return def;
  const s = String(val).toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = getBool(process.env.SMTP_SECURE, false);

  const oauthClientId = process.env.GMAIL_OAUTH2_CLIENT_ID;
  const oauthClientSecret = process.env.GMAIL_OAUTH2_CLIENT_SECRET;
  const oauthRefreshToken = process.env.GMAIL_OAUTH2_REFRESH_TOKEN;

  if (user && oauthClientId && oauthClientSecret && oauthRefreshToken) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user,
        clientId: oauthClientId,
        clientSecret: oauthClientSecret,
        refreshToken: oauthRefreshToken,
      },
    } as any);
  }

  if (!host || !port) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user || pass ? { user, pass } : undefined,
  } as any);
}

const transporter = buildTransport();

export function isEmailConfigured(): boolean {
  return !!transporter && !!process.env.MAIL_FROM;
}

async function sendMail(payload: { to: string[]; subject: string; text: string }): Promise<void> {
  if (!transporter) return;
  const from = process.env.MAIL_FROM;
  if (!from || payload.to.length === 0) return;
  await transporter.sendMail({
    from,
    to: payload.to.join(","),
    subject: payload.subject,
    text: payload.text,
  });
}

function buildClaimCreatedSubjectBi(claim: Claim): string {
  return `Claim Registered: TCAR-${claim.tcarNo}`;
}

function buildClaimCreatedBodyBi(claim: Claim): string {
  const lines = [
    "A new claim has been registered.",
    "",
    `TCAR No: ${claim.tcarNo}`,
    `Customer: ${claim.customerName}`,
    `Defect: ${claim.defectName}`,
    `Quantity: ${claim.defectCount ?? "-"}`,
    `Received Date: ${claim.receivedDate}`,
    `Due Date: ${claim.dueDate ?? "-"}`,
    `Remarks: ${claim.remarks ?? "-"}`,
  ];
  return lines.join("\n");
}

function buildClaimAcceptedSubjectBi(claim: Claim): string {
  return `Claim Accepted: TCAR-${claim.tcarNo}`;
}

function buildClaimAcceptedBodyBi(claim: Claim): string {
  const lines = [
    "The claim has been accepted and assigned.",
    "",
    `TCAR No: ${claim.tcarNo}`,
    `Customer: ${claim.customerName}`,
    `Defect: ${claim.defectName}`,
    `Quantity: ${claim.defectCount ?? "-"}`,
    `Due Date: ${claim.dueDate ?? "-"}`,
    "",
    "Please take necessary actions.",
  ];
  return lines.join("\n");
}

function buildCountermeasureSubjectBi(claim: Claim): string {
  return `Countermeasure Submitted: TCAR-${claim.tcarNo}`;
}

function buildCountermeasureBodyBi(claim: Claim): string {
  const lines = [
    "The countermeasure document has been submitted and the claim is completed.",
    "",
    `TCAR No: ${claim.tcarNo}`,
    `Customer: ${claim.customerName}`,
    `Defect: ${claim.defectName}`,
    `Quantity: ${claim.defectCount ?? "-"}`,
    `Corrective Action: ${claim.correctiveAction ?? "-"}`,
    `Preventive Action: ${claim.preventiveAction ?? "-"}`,
    claim.driveFileUrl ? `Document: ${claim.driveFileUrl}` : "",
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

function buildTechnicalApprovalSubjectBi(claim: Claim): string {
  return `Technical Approval Completed: TCAR-${claim.tcarNo}`;
}

function buildTechnicalApprovalBodyBi(claim: Claim): string {
  const lines = [
    "Technical approval has been completed.",
    "",
    `TCAR No: ${claim.tcarNo}`,
    `Customer: ${claim.customerName}`,
    `Defect: ${claim.defectName}`,
    `Quantity: ${claim.defectCount ?? "-"}`,
    `Corrective Action: ${claim.correctiveAction ?? "-"}`,
    `Preventive Action: ${claim.preventiveAction ?? "-"}`,
    claim.driveFileUrl ? `Document: ${claim.driveFileUrl}` : "",
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

function buildOverdueSubjectBi(claim: Claim): string {
  return `Overdue Claim: TCAR-${claim.tcarNo}`;
}

function buildOverdueBodyBi(claim: Claim): string {
  const lines = [
    "There is an overdue claim that requires attention.",
    "",
    `TCAR No: ${claim.tcarNo}`,
    `Customer: ${claim.customerName}`,
    `Defect: ${claim.defectName}`,
    `Received Date: ${claim.receivedDate}`,
    `Due Date: ${claim.dueDate ?? "-"}`,
    `Tech Assignee: ${claim.assigneeTech ?? "-"}`,
    `Factory Assignee: ${claim.assigneeFactory ?? "-"}`,
    `Created By: ${claim.createdBy ?? "-"}`,
  ];
  return lines.join("\n");
}

export async function sendClaimCreatedEmail(claim: Claim, recipients?: string[]): Promise<void> {
  try {
    if (!transporter) return;
    const from = process.env.MAIL_FROM;
    const resolved = recipients && recipients.length > 0
      ? recipients
      : (process.env.NOTIFY_ON_CLAIM_CREATED || process.env.MAIL_TO || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const to = resolved.join(",");
    if (!from || !to) return;

    const subject = buildClaimCreatedSubjectBi(claim);
    const text = buildClaimCreatedBodyBi(claim);

    await transporter.sendMail({ from, to, subject, text });
  } catch (err) {
    console.error("[mailer] Failed to send claim-created email:", err);
  }
}

export async function sendClaimAcceptedEmail(claim: Claim, recipients?: string[]): Promise<void> {
  try {
    if (!transporter) return;
    const from = process.env.MAIL_FROM;
    const resolved = recipients && recipients.length > 0
      ? recipients
      : (process.env.NOTIFY_ON_CLAIM_ACCEPTED || process.env.MAIL_TO || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const to = resolved.join(",");
    if (!from || !to) return;

    const subject = buildClaimAcceptedSubjectBi(claim);
    const text = buildClaimAcceptedBodyBi(claim);
    await transporter.sendMail({ from, to, subject, text });
  } catch (err) {
    console.error("[mailer] Failed to send claim-accepted email:", err);
  }
}

export async function sendCountermeasureSubmittedEmail(claim: Claim, recipients?: string[]): Promise<void> {
  try {
    if (!transporter) return;
    const from = process.env.MAIL_FROM;
    const resolved = recipients && recipients.length > 0
      ? recipients
      : (process.env.NOTIFY_ON_COUNTERMEASURE || process.env.MAIL_TO || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const to = resolved.join(",");
    if (!from || !to) return;

    const subject = buildCountermeasureSubjectBi(claim);
    const text = buildCountermeasureBodyBi(claim);
    await transporter.sendMail({ from, to, subject, text });
  } catch (err) {
    console.error("[mailer] Failed to send countermeasure-submitted email:", err);
  }
}

export async function sendTechnicalApprovalEmail(claim: Claim, recipients?: string[]): Promise<void> {
  try {
    if (!transporter) return;
    const from = process.env.MAIL_FROM;
    const resolved = recipients && recipients.length > 0
      ? recipients
      : (process.env.NOTIFY_ON_TECHNICAL_APPROVED || process.env.MAIL_TO || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const to = resolved.join(",");
    if (!from || !to) return;

    const subject = buildTechnicalApprovalSubjectBi(claim);
    const text = buildTechnicalApprovalBodyBi(claim);
    await transporter.sendMail({ from, to, subject, text });
  } catch (err) {
    console.error("[mailer] Failed to send technical-approval email:", err);
  }
}

export async function sendOverdueEmail(claim: Claim, recipients?: string[]): Promise<void> {
  const list = recipients?.filter(Boolean) ?? [];
  if (!list.length) return;
  try {
    const subject = buildOverdueSubjectBi(claim);
    const text = buildOverdueBodyBi(claim);
    await sendMail({ to: list, subject, text });
  } catch (err) {
    console.error("[mailer] Failed to send overdue email:", err);
  }
}
