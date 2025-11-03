import nodemailer from 'nodemailer';
import { type Claim } from "@shared/schema";

function getBool(val: string | undefined, def = false): boolean {
  if (val == null) return def;
  const s = String(val).toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

// Build a reusable transporter if SMTP is configured
function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = getBool(process.env.SMTP_SECURE, false);

  const oauthClientId = process.env.GMAIL_OAUTH2_CLIENT_ID;
  const oauthClientSecret = process.env.GMAIL_OAUTH2_CLIENT_SECRET;
  const oauthRefreshToken = process.env.GMAIL_OAUTH2_REFRESH_TOKEN;

  // Prefer OAuth2 for Gmail when env vars are present
  if (user && oauthClientId && oauthClientSecret && oauthRefreshToken) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user,
        clientId: oauthClientId,
        clientSecret: oauthClientSecret,
        refreshToken: oauthRefreshToken,
      },
    } as any);
  }

  if (!host || !port) {
    return null; // Not configured
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

function buildClaimCreatedSubject(claim: Claim): string {
  return `【クレーム受付】TCAR-${claim.tcarNo} 新規登録`;
}

function buildClaimCreatedBody(claim: Claim): string {
  const lines = [
    '新しいクレームが登録されました。',
    '',
    `TCAR No: ${claim.tcarNo}`,
    `顧客名: ${claim.customerName}`,
    `不具合名: ${claim.defectName}`,
    `不具合数: ${claim.defectCount ?? '-'} 件`,
    `受付日: ${claim.receivedDate}`,
    `期限: ${claim.dueDate ?? '-'} 見込み`,
    '',
    `備考: ${claim.remarks ?? '-'}`,
  ];
  return lines.join('\n');
}

// Send notification for claim creation. Best-effort; callers should not await.
export async function sendClaimCreatedEmail(claim: Claim, recipients?: string[]): Promise<void> {
  try {
    if (!transporter) return;
    const from = process.env.MAIL_FROM!;
    const resolved = recipients && recipients.length > 0
      ? recipients
      : (process.env.NOTIFY_ON_CLAIM_CREATED || process.env.MAIL_TO || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    const to = resolved.join(',');
    if (!from || !to) return;

    const subject = buildClaimCreatedSubjectBi(claim);
    const text = buildClaimCreatedBodyBi(claim);

    await transporter.sendMail({ from, to, subject, text });
  } catch (err) {
    // Log and swallow to avoid disrupting request flow
    console.error('[mailer] Failed to send claim-created email:', err);
  }
}

function buildClaimAcceptedSubject(claim: Claim): string {
  return `【受付完了】TCAR-${claim.tcarNo} 技術へ回付`;
}

function buildClaimAcceptedBody(claim: Claim): string {
  const lines = [
    'クレームが受付完了となりました。',
    '',
    `TCAR No: ${claim.tcarNo}`,
    `顧客名: ${claim.customerName}`,
    `不具合名: ${claim.defectName}`,
    `不具合数: ${claim.defectCount ?? '-'} 件`,
    `期限: ${claim.dueDate ?? '-'}`,
    '',
    '対応をお願いします。',
  ];
  return lines.join('\n');
}

export async function sendClaimAcceptedEmail(claim: Claim, recipients?: string[]): Promise<void> {
  try {
    if (!transporter) return;
    const from = process.env.MAIL_FROM!;
    const resolved = recipients && recipients.length > 0
      ? recipients
      : (process.env.NOTIFY_ON_CLAIM_ACCEPTED || process.env.MAIL_TO || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    const to = resolved.join(',');
    if (!from || !to) return;

    const subject = buildClaimAcceptedSubjectBi(claim);
    const text = buildClaimAcceptedBodyBi(claim);
    await transporter.sendMail({ from, to, subject, text });
  } catch (err) {
    console.error('[mailer] Failed to send claim-accepted email:', err);
  }
}

function buildCountermeasureSubject(claim: Claim): string {
  return `【対策完了】TCAR-${claim.tcarNo} 対策書登録完了`;
}

function buildCountermeasureBody(claim: Claim): string {
  const lines = [
    '対策書が登録され、クレームが完了しました。',
    '',
    `TCAR No: ${claim.tcarNo}`,
    `顧客名: ${claim.customerName}`,
    `不具合名: ${claim.defectName}`,
    `不具合数: ${claim.defectCount ?? '-'} 件`,
    `対策: ${claim.correctiveAction ?? '-'}`,
    `予防: ${claim.preventiveAction ?? '-'}`,
    claim.driveFileUrl ? `資料: ${claim.driveFileUrl}` : '',
  ].filter(Boolean) as string[];
  return lines.join('\n');
}

export async function sendCountermeasureSubmittedEmail(claim: Claim, recipients?: string[]): Promise<void> {
  try {
    if (!transporter) return;
    const from = process.env.MAIL_FROM!;
    const resolved = recipients && recipients.length > 0
      ? recipients
      : (process.env.NOTIFY_ON_COUNTERMEASURE || process.env.MAIL_TO || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    const to = resolved.join(',');
    if (!from || !to) return;

    const subject = buildCountermeasureSubjectBi(claim);
    const text = buildCountermeasureBodyBi(claim);
    await transporter.sendMail({ from, to, subject, text });
  } catch (err) {
    console.error('[mailer] Failed to send countermeasure-submitted email:', err);
  }
}

export async function sendTechnicalApprovalEmail(claim: Claim, recipients?: string[]): Promise<void> {
  try {
    if (!transporter) return;
    const from = process.env.MAIL_FROM!;
    const resolved = recipients && recipients.length > 0
      ? recipients
      : (process.env.NOTIFY_ON_TECHNICAL_APPROVED || process.env.MAIL_TO || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    const to = resolved.join(',');
    if (!from || !to) return;

    const subject = buildTechnicalApprovalSubjectBi(claim);
    const text = buildTechnicalApprovalBodyBi(claim);
    await transporter.sendMail({ from, to, subject, text });
  } catch (err) {
    console.error('[mailer] Failed to send technical-approval email:', err);
  }
}

// Bilingual subjects/bodies (Japanese + English)
function buildClaimCreatedSubjectBi(claim: Claim): string {
  return `【クレーム受付】TCAR-${claim.tcarNo} 新規登録 / Claim Registered`;
}

function buildClaimCreatedBodyBi(claim: Claim): string {
  const jp = [
    '新しいクレームが登録されました。',
    '',
    `TCAR No: ${claim.tcarNo}`,
    `顧客名: ${claim.customerName}`,
    `不具合名: ${claim.defectName}`,
    `不具合数: ${claim.defectCount ?? '-'} 件`,
    `受付日: ${claim.receivedDate}`,
    `期限: ${claim.dueDate ?? '-'}`,
    `備考: ${claim.remarks ?? '-'}`,
  ];
  const en = [
    '',
    '---',
    'A new claim has been registered.',
    '',
    `TCAR No: ${claim.tcarNo}`,
    `Customer: ${claim.customerName}`,
    `Defect: ${claim.defectName}`,
    `Quantity: ${claim.defectCount ?? '-'}`,
    `Received Date: ${claim.receivedDate}`,
    `Due Date: ${claim.dueDate ?? '-'}`,
    `Remarks: ${claim.remarks ?? '-'}`,
  ];
  return [...jp, ...en].join('\n');
}

function buildClaimAcceptedSubjectBi(claim: Claim): string {
  return `【受付完了】TCAR-${claim.tcarNo} 技術へ回付 / Claim Accepted`;
}

function buildClaimAcceptedBodyBi(claim: Claim): string {
  const jp = [
    'クレームが受付完了になりました。',
    '',
    `TCAR No: ${claim.tcarNo}`,
    `顧客名: ${claim.customerName}`,
    `不具合名: ${claim.defectName}`,
    `不具合数: ${claim.defectCount ?? '-'} 件`,
    `期限: ${claim.dueDate ?? '-'}`,
    '対応をお願いします。',
  ];
  const en = [
    '',
    '---',
    'The claim has been accepted and assigned.',
    '',
    `TCAR No: ${claim.tcarNo}`,
    `Customer: ${claim.customerName}`,
    `Defect: ${claim.defectName}`,
    `Quantity: ${claim.defectCount ?? '-'}`,
    `Due Date: ${claim.dueDate ?? '-'}`,
    'Please take necessary actions.',
  ];
  return [...jp, ...en].join('\n');
}

function buildCountermeasureSubjectBi(claim: Claim): string {
  return `【対策完了】TCAR-${claim.tcarNo} 対策書登録完了 / Countermeasure Submitted`;
}

function buildCountermeasureBodyBi(claim: Claim): string {
  const jp = [
    '対策書が登録され、クレームが完了しました。',
    '',
    `TCAR No: ${claim.tcarNo}`,
    `顧客名: ${claim.customerName}`,
    `不具合名: ${claim.defectName}`,
    `不具合数: ${claim.defectCount ?? '-'} 件`,
    `是正処置: ${claim.correctiveAction ?? '-'}`,
    `予防処置: ${claim.preventiveAction ?? '-'}`,
    claim.driveFileUrl ? `資料: ${claim.driveFileUrl}` : '',
  ].filter(Boolean) as string[];
  const en = [
    '',
    '---',
    'The countermeasure document has been submitted and the claim is completed.',
    '',
    `TCAR No: ${claim.tcarNo}`,
    `Customer: ${claim.customerName}`,
    `Defect: ${claim.defectName}`,
    `Quantity: ${claim.defectCount ?? '-'}`,
    `Corrective Action: ${claim.correctiveAction ?? '-'}`,
    `Preventive Action: ${claim.preventiveAction ?? '-'}`,
    claim.driveFileUrl ? `Document: ${claim.driveFileUrl}` : '',
  ].filter(Boolean) as string[];
  return [...jp, ...en].join('\n');
}

function buildTechnicalApprovalSubjectBi(claim: Claim): string {
  return `【技術承認完了】TCAR-${claim.tcarNo} 完了通知 / Technical Approval Completed`;
}

function buildTechnicalApprovalBodyBi(claim: Claim): string {
  const jp = [
    '技術承認が完了しました。',
    '',
    `TCAR No: ${claim.tcarNo}`,
    `顧客名: ${claim.customerName}`,
    `不具合名: ${claim.defectName}`,
    `不具合数: ${claim.defectCount ?? '-'}`,
    `是正処置: ${claim.correctiveAction ?? '-'}`,
    `予防処置: ${claim.preventiveAction ?? '-'}`,
    claim.driveFileUrl ? `対策書: ${claim.driveFileUrl}` : '',
  ].filter(Boolean) as string[];
  const en = [
    '',
    '---',
    'Technical approval has been completed.',
    '',
    `TCAR No: ${claim.tcarNo}`,
    `Customer: ${claim.customerName}`,
    `Defect: ${claim.defectName}`,
    `Quantity: ${claim.defectCount ?? '-'}`,
    `Corrective Action: ${claim.correctiveAction ?? '-'}`,
    `Preventive Action: ${claim.preventiveAction ?? '-'}`,
    claim.driveFileUrl ? `Document: ${claim.driveFileUrl}` : '',
  ].filter(Boolean) as string[];
  return [...jp, ...en].join('\n');
}
