import { type User, type InsertUser, type Claim, type InsertClaim } from "@shared/schema";
import { randomUUID } from "crypto";
import { z } from "zod";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllClaims(): Promise<Claim[]>;
  getClaim(id: string): Promise<Claim | undefined>;
  getClaimByTcarNo(tcarNo: string): Promise<Claim | undefined>;
  getLatestTcarForMonth(yearMonth: string): Promise<string | undefined>;
  createClaim(claim: InsertClaim, tcarNo: string): Promise<Claim>;
  updateClaim(id: string, updates: Partial<Claim>): Promise<Claim | undefined>;
  deleteClaim(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private claims: Map<string, Claim>;

  constructor() {
    this.users = new Map();
    this.claims = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllClaims(): Promise<Claim[]> {
    return Array.from(this.claims.values());
  }

  async getClaim(id: string): Promise<Claim | undefined> {
    return this.claims.get(id);
  }

  async getClaimByTcarNo(tcarNo: string): Promise<Claim | undefined> {
    return Array.from(this.claims.values()).find(
      (claim) => claim.tcarNo === tcarNo,
    );
  }

  async getLatestTcarForMonth(yearMonth: string): Promise<string | undefined> {
    const prefix = `${yearMonth}-`;
    const tcarList = Array.from(this.claims.values())
      .map(c => c.tcarNo)
      .filter(no => typeof no === 'string' && no.startsWith(prefix))
      .sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
    return tcarList[0];
  }

  async createClaim(insertClaim: InsertClaim, tcarNo: string): Promise<Claim> {
    const id = randomUUID();
    const now = new Date();
    const claim: Claim = {
      id,
      tcarNo,
      customerDefectId: insertClaim.customerDefectId ?? null,
      customerName: insertClaim.customerName,
      partNumber: insertClaim.partNumber ?? null,
      dcItems: insertClaim.dcItems,
      defectName: insertClaim.defectName,
      defectCount: insertClaim.defectCount ?? null,
      occurrenceDate: insertClaim.occurrenceDate ?? null,
      status: insertClaim.status || 'PENDING_ACCEPTANCE',
      receivedDate: insertClaim.receivedDate,
      dueDate: insertClaim.dueDate ?? null,
      remarks: insertClaim.remarks ?? null,
      assignee: insertClaim.assignee ?? null,
      assigneeTech: insertClaim.assigneeTech ?? null,
      assigneeFactory: insertClaim.assigneeFactory ?? null,
      correctiveAction: insertClaim.correctiveAction ?? null,
      preventiveAction: insertClaim.preventiveAction ?? null,
      driveFileId: insertClaim.driveFileId ?? null,
      driveFileUrl: insertClaim.driveFileUrl ?? null,
      attachments: (insertClaim as any).attachments ?? [],
      createdBy: insertClaim.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.claims.set(id, claim);
    return claim;
  }

  async updateClaim(id: string, updates: Partial<Claim>): Promise<Claim | undefined> {
    const claim = this.claims.get(id);
    if (!claim) return undefined;
    
    const updatedClaim: Claim = {
      ...claim,
      ...updates,
      id: claim.id,
      tcarNo: claim.tcarNo,
      createdAt: claim.createdAt,
      updatedAt: new Date(),
    };
    this.claims.set(id, updatedClaim);
    return updatedClaim;
  }

  async deleteClaim(id: string): Promise<boolean> {
    return this.claims.delete(id);
  }
}

class SupabaseRestStorage implements IStorage {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private headers() {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      apikey: this.apiKey,
      Authorization: `Bearer ${this.apiKey}`,
      Prefer: "return=representation",
    } as Record<string, string>;
  }

  private async handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Supabase error ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  }

  private normalizeClaim(c: any): Claim {
    return {
      id: c.id,
      tcarNo: c.tcarNo ?? c.tcar_no,
      customerDefectId: c.customerDefectId ?? c.customer_defect_id ?? null,
      customerName: c.customerName ?? c.customer_name,
      partNumber: c.partNumber ?? c.part_number ?? null,
      dcItems: c.dcItems ?? c.dc_items ?? [],
      defectName: c.defectName ?? c.defect_name,
      defectCount: c.defectCount ?? c.defect_count ?? null,
      occurrenceDate: c.occurrenceDate ?? c.occurrence_date ?? null,
      status: c.status,
      receivedDate: c.receivedDate ?? c.received_date,
      dueDate: c.dueDate ?? c.due_date ?? null,
      remarks: c.remarks ?? null,
      assignee: c.assignee ?? null,
      assigneeTech: c.assigneeTech ?? c.assignee_tech ?? null,
      assigneeFactory: c.assigneeFactory ?? c.assignee_factory ?? null,
      correctiveAction: c.correctiveAction ?? c.corrective_action ?? null,
      preventiveAction: c.preventiveAction ?? c.preventive_action ?? null,
      driveFileId: c.driveFileId ?? c.drive_file_id ?? null,
      driveFileUrl: c.driveFileUrl ?? c.drive_file_url ?? null,
      attachments: c.attachments ?? [],
      createdBy: c.createdBy ?? c.created_by ?? null,
      createdAt: c.createdAt ? new Date(c.createdAt) : c.created_at ? new Date(c.created_at) : undefined,
      updatedAt: c.updatedAt ? new Date(c.updatedAt) : c.updated_at ? new Date(c.updated_at) : undefined,
    } as unknown as Claim;
  }

  private toSnakeCasePayload(insertClaim: InsertClaim, tcarNo?: string): Record<string, any> {
    const payload: Record<string, any> = {
      customer_defect_id: insertClaim.customerDefectId ?? null,
      customer_name: insertClaim.customerName,
      part_number: insertClaim.partNumber ?? null,
      dc_items: insertClaim.dcItems,
      defect_name: insertClaim.defectName,
      defect_count: insertClaim.defectCount ?? null,
      occurrence_date: insertClaim.occurrenceDate ?? null,
      status: insertClaim.status || 'PENDING_ACCEPTANCE',
      received_date: insertClaim.receivedDate,
      due_date: insertClaim.dueDate ?? null,
      remarks: insertClaim.remarks ?? null,
      assignee: insertClaim.assignee ?? null,
      assignee_tech: insertClaim.assigneeTech ?? null,
      assignee_factory: insertClaim.assigneeFactory ?? null,
      corrective_action: insertClaim.correctiveAction ?? null,
      preventive_action: insertClaim.preventiveAction ?? null,
      drive_file_id: insertClaim.driveFileId ?? null,
      drive_file_url: insertClaim.driveFileUrl ?? null,
      attachments: (insertClaim as any).attachments ?? [],
      created_by: insertClaim.createdBy ?? null,
    };
    if (tcarNo) payload.tcar_no = tcarNo;
    return payload;
  }

  async getUser(id: string): Promise<User | undefined> {
    const url = `${this.baseUrl}/rest/v1/users?id=eq.${encodeURIComponent(id)}&select=*`;
    const data = await this.handle<User[]>(await fetch(url, { headers: this.headers() }));
    return data[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const url = `${this.baseUrl}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=*`;
    const data = await this.handle<User[]>(await fetch(url, { headers: this.headers() }));
    return data[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const url = `${this.baseUrl}/rest/v1/users`;
    const data = await this.handle<User[]>(
      await fetch(url, { method: "POST", headers: this.headers(), body: JSON.stringify(insertUser) })
    );
    return z.any().parse(data[0]);
  }

  async getAllClaims(): Promise<Claim[]> {
    const url = `${this.baseUrl}/rest/v1/claims?select=*`;
    const data = await this.handle<any[]>(await fetch(url, { headers: this.headers() }));
    return data.map((c) => this.normalizeClaim(c));
  }

  async getClaim(id: string): Promise<Claim | undefined> {
    const url = `${this.baseUrl}/rest/v1/claims?id=eq.${encodeURIComponent(id)}&select=*`;
    const data = await this.handle<any[]>(await fetch(url, { headers: this.headers() }));
    return data[0] ? this.normalizeClaim(data[0]) : undefined;
  }

  async getClaimByTcarNo(tcarNo: string): Promise<Claim | undefined> {
    const url = `${this.baseUrl}/rest/v1/claims?tcar_no=eq.${encodeURIComponent(tcarNo)}&select=*`;
    const data = await this.handle<any[]>(await fetch(url, { headers: this.headers() }));
    return data[0] ? this.normalizeClaim(data[0]) : undefined;
  }

  async getLatestTcarForMonth(yearMonth: string): Promise<string | undefined> {
    const like = `${yearMonth}-%`;
    const url = `${this.baseUrl}/rest/v1/claims?select=tcar_no&tcar_no=like.${encodeURIComponent(like)}&order=tcar_no.desc&limit=1`;
    const data = await this.handle<any[]>(await fetch(url, { headers: this.headers() }));
    return data?.[0]?.tcar_no;
  }

  async createClaim(insertClaim: InsertClaim, tcarNo: string): Promise<Claim> {
    const url = `${this.baseUrl}/rest/v1/claims`;
    const payload = this.toSnakeCasePayload(insertClaim, tcarNo);
    const data = await this.handle<any[]>(
      await fetch(url, { method: "POST", headers: this.headers(), body: JSON.stringify(payload) })
    );
    return this.normalizeClaim(data[0]);
  }

  async updateClaim(id: string, updates: Partial<Claim>): Promise<Claim | undefined> {
    const url = `${this.baseUrl}/rest/v1/claims?id=eq.${encodeURIComponent(id)}&select=*`;
    const snake: Record<string, any> = {
      // keep id/tcar_no immutable; server enforces it
      customer_defect_id: updates.customerDefectId,
      customer_name: updates.customerName,
      part_number: updates.partNumber,
      dc_items: updates.dcItems,
      defect_name: updates.defectName,
      defect_count: updates.defectCount,
      occurrence_date: updates.occurrenceDate,
      status: updates.status,
      received_date: updates.receivedDate,
      due_date: updates.dueDate,
      remarks: updates.remarks,
      assignee: updates.assignee,
      assignee_tech: updates.assigneeTech,
      assignee_factory: updates.assigneeFactory,
      corrective_action: updates.correctiveAction,
      preventive_action: updates.preventiveAction,
      drive_file_id: updates.driveFileId,
      drive_file_url: updates.driveFileUrl,
      attachments: (updates as any).attachments,
      created_by: updates.createdBy,
      updated_at: new Date().toISOString(),
    };
    // remove undefined keys so PATCH only updates provided fields
    Object.keys(snake).forEach((k) => snake[k] === undefined && delete snake[k]);

    const data = await this.handle<any[]>(
      await fetch(url, { method: "PATCH", headers: this.headers(), body: JSON.stringify(snake) })
    );
    return data[0] ? this.normalizeClaim(data[0]) : undefined;
  }

  async deleteClaim(id: string): Promise<boolean> {
    const url = `${this.baseUrl}/rest/v1/claims?id=eq.${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: "DELETE", headers: this.headers() });
    if (!res.ok) return false;
    return true;
  }
}

function buildStorage(): IStorage {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && serviceKey) {
    return new SupabaseRestStorage(supabaseUrl, serviceKey);
  }
  return new MemStorage();
}

export const storage = buildStorage();
