import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const dcItemSchema = z.object({
  dc: z.string(),
  quantity: z.number().int().min(1),
});

export type DcItem = z.infer<typeof dcItemSchema>;

export const attachmentSchema = z.object({
  fileId: z.string(),
  fileUrl: z.string(),
  fileName: z.string().optional(),
  uploadedAt: z.string().optional(),
});

export type Attachment = z.infer<typeof attachmentSchema>;

export const claims = pgTable("claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tcarNo: text("tcar_no").notNull().unique(),
  customerDefectId: text("customer_defect_id"),
  customerName: text("customer_name").notNull(),
  partNumber: text("part_number"),
  dcItems: jsonb("dc_items").$type<DcItem[]>().notNull().default(sql`'[]'::jsonb`),
  defectName: text("defect_name").notNull(),
  defectCount: integer("defect_count"),
  occurrenceDate: text("occurrence_date"),
  status: text("status").notNull().default('PENDING_ACCEPTANCE'),
  receivedDate: text("received_date").notNull(),
  dueDate: text("due_date"),
  remarks: text("remarks"),
  assignee: text("assignee"),
  assigneeTech: text("assignee_tech"),
  assigneeFactory: text("assignee_factory"),
  correctiveAction: text("corrective_action"),
  preventiveAction: text("preventive_action"),
  driveFileId: text("drive_file_id"),
  driveFileUrl: text("drive_file_url"),
  // New: separate attachments for registration-time files
  attachments: jsonb("attachments").$type<Attachment[]>().notNull().default(sql`'[]'::jsonb`),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClaimSchema = createInsertSchema(claims)
  .omit({
    id: true,
    tcarNo: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    dcItems: z.array(dcItemSchema).min(1, "At least one DC item is required"),
  });

export const updateClaimSchema = insertClaimSchema.partial().extend({
  status: z.enum(['PENDING_ACCEPTANCE', 'PENDING_COUNTERMEASURE', 'COMPLETED']).optional(),
});

export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type UpdateClaim = z.infer<typeof updateClaimSchema>;
export type Claim = typeof claims.$inferSelect;

export type ClaimStatus = 'PENDING_ACCEPTANCE' | 'PENDING_COUNTERMEASURE' | 'COMPLETED';

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
