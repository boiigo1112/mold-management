import { defineAction, z, type ActionsModule, type Ctx } from "@hatch/space-sdk";
import { and, asc, desc, eq, gte, inArray, isNotNull, like, lt, or, sql } from "drizzle-orm";
import * as schema from "./schema";

const moldStatus = z.enum(["available", "issued", "repair", "retired"]);
const movementType = z.enum([
  "receive",
  "issue",
  "return",
  "repair",
  "repair_return",
  "retire",
]);
const reasonGroup = z.enum(["wear", "size_change", "pm", "quality", "other", "unspecified"]);

const mutationResponse = z.object({
  ok: z.boolean(),
  message: z.string(),
  id: z.number().optional(),
  code: z.string().optional(),
  movement_id: z.number().optional(),
});

const authUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  display_name: z.string(),
  role: z.enum(["admin", "technician"]),
});

const authStateResponse = z.object({
  needs_setup: z.boolean(),
  authenticated: z.boolean(),
  user: authUserSchema.nullable(),
});

const authMutationResponse = z.object({
  ok: z.boolean(),
  message: z.string(),
  token: z.string().optional(),
  user: authUserSchema.optional(),
});

const userListResponse = z.object({
  users: z.array(authUserSchema.extend({ active: z.boolean(), created_at: z.string() })),
});

const workspaceResponse = z.object({
  molds: z.array(
    z.object({
      id: z.number(),
      code: z.string(),
      name: z.string(),
      location: z.string().nullable(),
      status: moldStatus,
      custodian: z.string().nullable(),
      notes: z.string().nullable(),
      display_code: z.string(),
      production_line: z.string().nullable(),
      tooling_type: z.string().nullable(),
      size: z.string().nullable(),
      source: z.string().nullable(),
      source_status: z.enum(["installed", "repair", "spare", "mismatch", "unlocated"]).nullable(),
      current_machine: z.string().nullable(),
      current_head: z.string().nullable(),
      source_sheet: z.string().nullable(),
      source_row: z.number().nullable(),
      size_class: z.string().nullable(),
      outside_a: z.string().nullable(),
      outside_b: z.string().nullable(),
      inside_a: z.string().nullable(),
      inside_b: z.string().nullable(),
      measured_height: z.string().nullable(),
      shoulder_height: z.string().nullable(),
      measured_depth: z.string().nullable(),
      measured_inner_radius: z.string().nullable(),
      measured_outer_radius: z.string().nullable(),
      history_count: z.number(),
      latest_technician: z.string().nullable(),
      latest_event_at: z.string().nullable(),
      qr_token: z.string().nullable(),
      inspection_status: z.enum(["pending", "pass", "fail"]).nullable(),
      inspected_at: z.string().nullable(),
      created_at: z.string(),
      updated_at: z.string(),
    }),
  ),
  movements: z.array(
    z.object({
      id: z.number(),
      mold_id: z.number(),
      mold_code: z.string(),
      mold_name: z.string(),
      type: movementType,
      from_status: z.string().nullable(),
      to_status: z.string(),
      counterparty: z.string().nullable(),
      location: z.string().nullable(),
      reference: z.string().nullable(),
      note: z.string().nullable(),
      machine: z.string().nullable(),
      production_line: z.string().nullable(),
      head: z.string().nullable(),
      tooling_type: z.string().nullable(),
      quantity: z.string().nullable(),
      size: z.string().nullable(),
      technician: z.string().nullable(),
      inner_diameter: z.string().nullable(),
      outer_diameter: z.string().nullable(),
      height: z.string().nullable(),
      inner_radius: z.string().nullable(),
      outer_radius: z.string().nullable(),
      reason: z.string().nullable(),
      plate: z.string().nullable(),
      center_radius: z.string().nullable(),
      happened_at: z.string(),
    }),
  ),
  import_summary: z.object({
    total: z.number(),
    incomplete_dates: z.number(),
    latest_at: z.string().nullable(),
  }),
});

const toolingRecordSchema = z.object({
  id: z.number(),
  source_sheet: z.string(),
  source_row: z.number(),
  event_at: z.string().nullable(),
  date_quality: z.enum(["complete", "missing", "time_only"]),
  day: z.number().nullable(),
  month: z.number().nullable(),
  machine: z.string().nullable(),
  line: z.string().nullable(),
  head: z.string().nullable(),
  tooling_type: z.string().nullable(),
  quantity: z.string().nullable(),
  tooling_code: z.string().nullable(),
  size: z.string().nullable(),
  technician: z.string().nullable(),
  inner_diameter: z.string().nullable(),
  outer_diameter: z.string().nullable(),
  height: z.string().nullable(),
  inner_radius: z.string().nullable(),
  outer_radius: z.string().nullable(),
  reason_raw: z.string().nullable(),
  reason_group: reasonGroup,
  plate: z.string().nullable(),
  center_radius: z.string().nullable(),
});

const movementRecordSchema = z.object({
  id: z.number(),
  mold_id: z.number(),
  mold_code: z.string(),
  mold_name: z.string(),
  type: movementType,
  from_status: z.string().nullable(),
  to_status: z.string(),
  counterparty: z.string().nullable(),
  location: z.string().nullable(),
  reference: z.string().nullable(),
  note: z.string().nullable(),
  machine: z.string().nullable(),
  production_line: z.string().nullable(),
  head: z.string().nullable(),
  tooling_type: z.string().nullable(),
  quantity: z.string().nullable(),
  size: z.string().nullable(),
  technician: z.string().nullable(),
  inner_diameter: z.string().nullable(),
  outer_diameter: z.string().nullable(),
  height: z.string().nullable(),
  inner_radius: z.string().nullable(),
  outer_radius: z.string().nullable(),
  reason: z.string().nullable(),
  plate: z.string().nullable(),
  center_radius: z.string().nullable(),
  happened_at: z.string(),
});

const toolingHistoryResponse = z.object({
  summary: z.object({
    total: z.number(),
    matches: z.number(),
    unique_tools: z.number(),
    machines: z.number(),
    complete_dates: z.number(),
    incomplete_dates: z.number(),
    first_at: z.string().nullable(),
    last_at: z.string().nullable(),
  }),
  by_line: z.array(z.object({ label: z.string(), count: z.number() })),
  by_reason: z.array(z.object({ reason: reasonGroup, count: z.number() })),
  filters: z.object({ machines: z.array(z.string()), lines: z.array(z.string()) }),
  records: z.array(toolingRecordSchema),
  page: z.object({ offset: z.number(), limit: z.number(), has_more: z.boolean() }),
});

const moldHistoryResponse = z.object({
  mold: z.object({
    id: z.number(),
    display_code: z.string(),
    name: z.string(),
    production_line: z.string().nullable(),
    tooling_type: z.string().nullable(),
    size: z.string().nullable(),
  }),
  tooling_records: z.array(toolingRecordSchema),
  operational_records: z.array(movementRecordSchema),
  linked_count: z.number(),
});

const toolingCalendarResponse = z.object({ records: z.array(toolingRecordSchema) });

const workOrderSnapshotResponse = z.object({
  machine: z.string(),
  size_profile: z.string().nullable(),
  started_at: z.string().nullable(),
  flange_allowance: z.string().nullable(),
  source_label: z.string().nullable(),
  snapshot_kind: z.enum(["captured", "current"]),
  captured_at: z.string().nullable(),
  cells: z.array(z.object({
    production_line: z.string(),
    tooling_type: z.string(),
    metric: z.string(),
    spec_value: z.string().nullable(),
    head1_a: z.string().nullable(),
    head1_b: z.string().nullable(),
    head2_a: z.string().nullable(),
    head2_b: z.string().nullable(),
    head3_a: z.string().nullable(),
    head3_b: z.string().nullable(),
    head4_a: z.string().nullable(),
    head4_b: z.string().nullable(),
  })),
});

const qrLookupResponse = z.object({
  ok: z.boolean(),
  message: z.string(),
  mold_id: z.number().optional(),
});

const repairOrderSchema = z.object({
  id: z.number(), source_no: z.string(), job_name: z.string(), drawing_code: z.string().nullable(),
  quantity: z.number(), unit: z.string(), order_month: z.number(), urgency: z.enum(["normal", "urgent", "very_urgent"]),
  ordered_date: z.string().nullable(), due_date: z.string().nullable(), requester: z.string().nullable(),
  received_date: z.string().nullable(), receiver: z.string().nullable(), machine: z.string().nullable(),
  detail: z.string().nullable(), size: z.string().nullable(), note: z.string().nullable(), department: z.string(),
  job_kind: z.enum(["new", "repair"]), status: z.enum(["open", "received", "cancelled"]),
  receive_condition: z.enum(["pass", "adjust", "fail"]).nullable(), receive_note: z.string().nullable(),
  cancel_reason: z.string().nullable(), cancelled_at: z.string().nullable(),
  source_sheet: z.string(), source_row: z.number().nullable(), created_at: z.string(), updated_at: z.string(),
});

const repairOrdersResponse = z.object({
  summary: z.object({ total: z.number(), open: z.number(), received: z.number(), cancelled: z.number(), imported: z.number() }),
  orders: z.array(repairOrderSchema),
  design_codes: z.array(z.object({ id: z.number(), tooling_type: z.string(), size_label: z.string(), drawing_code: z.string(), inner_diameter: z.string().nullable() })),
  page: z.object({ offset: z.number(), limit: z.number(), has_more: z.boolean() }),
});

const repairMutationResponse = z.object({ ok: z.boolean(), message: z.string(), id: z.number().optional(), source_no: z.string().optional() });

const repairMeasurementSchema = z.object({
  outside_a: z.string().nullable(), outside_b: z.string().nullable(),
  inside_a: z.string().nullable(), inside_b: z.string().nullable(), height: z.string().nullable(),
  inner_radius: z.string().nullable(), outer_radius: z.string().nullable(),
  shoulder_height: z.string().nullable(), depth: z.string().nullable(),
});

const repairReceiveHistoryResponse = z.object({
  records: z.array(z.object({
    id: z.number(), order_id: z.number(), source_no: z.string(), job_name: z.string(),
    mold_id: z.number(), mold_code: z.string(), tooling_type: z.string().nullable(), size: z.string().nullable(),
    result: z.enum(["pass", "adjust", "fail"]), note: z.string().nullable(), checked_by: z.string(),
    inspected_at: z.string(), before: repairMeasurementSchema, after: repairMeasurementSchema,
  })),
});

const repairSummaryReportResponse = z.object({
  period: z.object({ start_date: z.string(), end_date: z.string() }),
  totals: z.object({
    sent_orders: z.number(), sent_molds: z.number(), received_orders: z.number(), received_molds: z.number(),
    passed: z.number(), adjust: z.number(), failed: z.number(), uninspected: z.number(),
  }),
  sent_items: z.array(z.object({
    id: z.number(), source_no: z.string(), ordered_date: z.string(), job_name: z.string(), drawing_code: z.string().nullable(),
    quantity: z.number(), unit: z.string(), machine: z.string().nullable(), size: z.string().nullable(),
    urgency: z.enum(["normal", "urgent", "very_urgent"]), status: z.enum(["open", "received", "cancelled"]),
  })),
  received_items: z.array(z.object({
    id: z.number(), record_key: z.string(), order_id: z.number(), source_no: z.string(), received_date: z.string(),
    mold_code: z.string().nullable(), job_name: z.string(), drawing_code: z.string().nullable(),
    tooling_type: z.string().nullable(), size: z.string().nullable(), machine: z.string().nullable(),
    quantity: z.number(), unit: z.string(), receiver: z.string().nullable(),
    result: z.enum(["pass", "adjust", "fail"]).nullable(), checked_by: z.string().nullable(),
    source: z.enum(["inspection", "order_history"]),
  })),

  tooling_breakdown: z.array(z.object({ label: z.string(), sent: z.number(), received: z.number() })),
});

const referenceDataResponse = z.object({
  snapshot_label: z.string().nullable(),
  assignments: z.array(z.object({
    id: z.number(), machine: z.string(), size: z.string().nullable(), line: z.string(),
    tooling_type: z.string(), head: z.string(), tooling_code: z.string(),
    condition: z.enum(["installed", "repair", "spare", "mismatch"]), note: z.string().nullable(),
  })),
  specs: z.array(z.object({
    id: z.number(), source_row: z.number(), machine: z.string().nullable(), head_config: z.string().nullable(), size_profile: z.string().nullable(),
    p1: z.object({ punch_od: z.string().nullable(), punch_id: z.string().nullable(), punch_height: z.string().nullable(), punch_r: z.string().nullable(), die_od: z.string().nullable(), die_id: z.string().nullable(), die_height: z.string().nullable(), core_od: z.string().nullable(), core_height: z.string().nullable(), core_r: z.string().nullable() }),
    p2: z.object({ redraw_od: z.string().nullable(), redraw_id: z.string().nullable(), redraw_height: z.string().nullable(), redraw_inner_r: z.string().nullable(), redraw_outer_r: z.string().nullable(), sleeve_od: z.string().nullable(), sleeve_height: z.string().nullable(), sleeve_r1: z.string().nullable(), sleeve_r2: z.string().nullable(), sleeve_r3: z.string().nullable() }),
    p3: z.object({ punch_size: z.string().nullable(), punch_od: z.string().nullable(), punch_id: z.string().nullable(), punch_height: z.string().nullable(), die_od: z.string().nullable(), die_id: z.string().nullable(), die_height: z.string().nullable() }),
  })),
});

type MoldStatus = z.infer<typeof moldStatus>;
type MovementType = z.infer<typeof movementType>;
type UserRole = "admin" | "technician";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function passwordDigest(password: string, salt: string): Promise<string> {
  return sha256(`${salt}:${password}`);
}

async function sessionUser(ctx: Ctx, token: string | undefined): Promise<typeof schema.appUsers.$inferSelect | null> {
  if (!token) return null;
  const db = ctx.db<typeof schema>();
  const tokenHash = await sha256(token);
  const rows = await db.select({ user: schema.appUsers, expiresAt: schema.appSessions.expiresAt })
    .from(schema.appSessions)
    .innerJoin(schema.appUsers, eq(schema.appSessions.userId, schema.appUsers.id))
    .where(and(eq(schema.appSessions.tokenHash, tokenHash), eq(schema.appUsers.active, true)))
    .limit(1);
  const row = rows[0];
  if (!row || row.expiresAt.getTime() <= Date.now()) return null;
  return row.user;
}

async function issueSession(ctx: Ctx, userId: number): Promise<string> {
  const db = ctx.db<typeof schema>();
  const token = randomHex(32);
  const now = new Date();
  await db.insert(schema.appSessions).values({
    userId,
    tokenHash: await sha256(token),
    createdAt: now,
    expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
  });
  return token;
}

async function hasRole(ctx: Ctx, token: string | undefined, roles: UserRole[]): Promise<boolean> {
  const user = await sessionUser(ctx, token);
  return Boolean(user && roles.includes(user.role));
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function nextMoldCode(ctx: Ctx, happenedAt: Date): Promise<string> {
  const db = ctx.db<typeof schema>();
  const year = happenedAt.getUTCFullYear();
  const prefix = `NO-${year}-`;
  const rows = await db.select({ code: schema.molds.code }).from(schema.molds)
    .where(like(schema.molds.code, `${prefix}%`)).orderBy(desc(schema.molds.code)).limit(1);
  const last = rows[0]?.code;
  const lastSequence = last ? Number(last.slice(prefix.length)) : 0;
  const next = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

function nextStatus(type: Exclude<MovementType, "receive">): MoldStatus {
  if (type === "issue") return "issued";
  if (type === "repair") return "repair";
  if (type === "retire") return "retired";
  return "available";
}

function allowed(status: MoldStatus, type: Exclude<MovementType, "receive">): boolean {
  if (type === "issue") return status === "available";
  if (type === "return") return status === "issued";
  if (type === "repair_return") return status === "repair";
  if (type === "repair") return status !== "repair" && status !== "retired";
  return status !== "retired";
}

function canonicalWorkOrderType(value: string | null): string | null {
  const normalized = value?.trim().toUpperCase().replace(/\s+/g, " ");
  if (!normalized) return null;
  if (normalized.includes("SLEEVE") || normalized === "DIE CORE P2") return "SLEEVEDIE CENTER CORE";
  if (normalized.includes("PUNCH CORE WASHER")) return "PUNCH CORE WASHER";
  if (normalized.includes("REDRAW RING")) return "REDRAW RING";
  if (normalized.includes("REDRAW PRESSURE")) return "REDRAW PRESSURE";
  if (normalized.includes("BLANK PUNCH")) return "BLANK PUNCH";
  if (normalized.includes("BLANK DIE")) return "BLANK DIE";
  if (normalized.includes("TRIMMING PUNCH")) return "TRIMMING PUNCH";
  if (normalized.includes("TRIMMING BLOCK")) return "TRIMMING BLOCK";
  if (normalized.includes("PUNCH CUTTER P1")) return "PUNCH CUTTER P1";
  if (normalized.includes("DIE CUTTER P1")) return "DIE CUTTER P1";
  if (normalized.includes("DIE CORE P1")) return "DIE CORE P1";
  if (normalized.includes("PUNCH CUTTER P3")) return "PUNCH CUTTER P3";
  if (normalized.includes("DIE CUTTER P3")) return "DIE CUTTER P3";
  return normalized;
}

function mapToolingRecord(row: typeof schema.toolingLogs.$inferSelect): z.infer<typeof toolingRecordSchema> {
  return {
    id: row.id,
    source_sheet: row.sourceSheet,
    source_row: row.sourceRow,
    event_at: row.eventAt?.toISOString() ?? null,
    date_quality: row.dateQuality,
    day: row.day,
    month: row.month,
    machine: row.machine,
    line: row.line,
    head: row.head,
    tooling_type: row.toolingType,
    quantity: row.quantity,
    tooling_code: row.toolingCode,
    size: row.size,
    technician: row.technician,
    inner_diameter: row.innerDiameter,
    outer_diameter: row.outerDiameter,
    height: row.height,
    inner_radius: row.innerRadius,
    outer_radius: row.outerRadius,
    reason_raw: row.reasonRaw,
    reason_group: row.reasonGroup,
    plate: row.plate,
    center_radius: row.centerRadius,
  };
}

function mapRepairOrder(row: typeof schema.repairOrders.$inferSelect): z.infer<typeof repairOrderSchema> {
  return {
    id: row.id, source_no: row.sourceNo, job_name: row.jobName, drawing_code: row.drawingCode,
    quantity: row.quantity, unit: row.unit, order_month: row.orderMonth, urgency: row.urgency,
    ordered_date: row.orderedDate, due_date: row.dueDate, requester: row.requester,
    received_date: row.receivedDate, receiver: row.receiver, machine: row.machine, detail: row.detail,
    size: row.size, note: row.note, department: row.department, job_kind: row.jobKind, status: row.status,
    receive_condition: row.receiveCondition, receive_note: row.receiveNote,
    cancel_reason: row.cancelReason, cancelled_at: row.cancelledAt?.toISOString() ?? null, source_sheet: row.sourceSheet,
    source_row: row.sourceRow, created_at: row.createdAt.toISOString(), updated_at: row.updatedAt.toISOString(),
  };
}

async function nextRepairNo(ctx: Ctx, orderDate: string): Promise<string> {
  const db = ctx.db<typeof schema>();
  const latest = await db.select({ sourceNo: schema.repairOrders.sourceNo }).from(schema.repairOrders)
    .orderBy(desc(schema.repairOrders.id)).limit(1);
  const previous = latest[0]?.sourceNo ?? "P4R-00-0000";
  const match = previous.match(/(\d{4,})$/);
  const sequence = Number(match?.[1] ?? "0") + 1;
  const month = Number(orderDate.slice(5, 7));
  return `P4R-${String(month).padStart(2, "0")}-${String(sequence).padStart(4, "0")}`;
}

export const Actions = {
  getAuthState: defineAction({
    request: z.object({ session_token: z.string().max(256).optional() }),
    response: authStateResponse,
    async handler(ctx, args): Promise<z.infer<typeof authStateResponse>> {
      const db = ctx.db<typeof schema>();
      const users = await db.select({ count: sql<number>`count(*)` }).from(schema.appUsers);
      const user = await sessionUser(ctx, args.session_token);
      return {
        needs_setup: Number(users[0]?.count ?? 0) === 0,
        authenticated: Boolean(user),
        user: user ? { id: user.id, username: user.username, display_name: user.displayName, role: user.role } : null,
      };
    },
  }),

  bootstrapAdmin: defineAction({
    request: z.object({
      username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/),
      display_name: z.string().trim().min(2).max(100),
      password: z.string().min(8).max(128),
    }),
    response: authMutationResponse,
    async handler(ctx, args): Promise<z.infer<typeof authMutationResponse>> {
      const db = ctx.db<typeof schema>();
      const existing = await db.select({ count: sql<number>`count(*)` }).from(schema.appUsers);
      if (Number(existing[0]?.count ?? 0) > 0) return { ok: false, message: "ตั้งค่าผู้ดูแลระบบแล้ว" };
      const salt = randomHex(16);
      const now = new Date();
      const inserted = await db.insert(schema.appUsers).values({
        username: args.username.trim().toLowerCase(), displayName: args.display_name.trim(), role: "admin",
        passwordHash: await passwordDigest(args.password, salt), passwordSalt: salt, active: true,
        createdAt: now, updatedAt: now,
      }).returning({ id: schema.appUsers.id, username: schema.appUsers.username, displayName: schema.appUsers.displayName, role: schema.appUsers.role });
      const user = inserted[0];
      if (!user) return { ok: false, message: "สร้างบัญชีผู้ดูแลไม่สำเร็จ" };
      return { ok: true, message: "สร้างบัญชีผู้ดูแลแล้ว", token: await issueSession(ctx, user.id), user: { id: user.id, username: user.username, display_name: user.displayName, role: user.role } };
    },
  }),

  login: defineAction({
    request: z.object({ username: z.string().trim().min(1).max(40), password: z.string().min(1).max(128) }),
    response: authMutationResponse,
    async handler(ctx, args): Promise<z.infer<typeof authMutationResponse>> {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.appUsers).where(eq(schema.appUsers.username, args.username.trim().toLowerCase())).limit(1);
      const user = rows[0];
      if (!user || !user.active || await passwordDigest(args.password, user.passwordSalt) !== user.passwordHash) {
        return { ok: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
      }
      return { ok: true, message: "เข้าสู่ระบบแล้ว", token: await issueSession(ctx, user.id), user: { id: user.id, username: user.username, display_name: user.displayName, role: user.role } };
    },
  }),

  logout: defineAction({
    request: z.object({ session_token: z.string().max(256) }),
    response: mutationResponse,
    async handler(ctx, args): Promise<z.infer<typeof mutationResponse>> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.appSessions).where(eq(schema.appSessions.tokenHash, await sha256(args.session_token)));
      return { ok: true, message: "ออกจากระบบแล้ว" };
    },
  }),

  listUsers: defineAction({
    request: z.object({ session_token: z.string().max(256) }),
    response: userListResponse,
    async handler(ctx, args): Promise<z.infer<typeof userListResponse>> {
      if (!await hasRole(ctx, args.session_token, ["admin"])) return { users: [] };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.appUsers).orderBy(asc(schema.appUsers.displayName));
      return { users: rows.map((user) => ({ id: user.id, username: user.username, display_name: user.displayName, role: user.role, active: user.active, created_at: user.createdAt.toISOString() })) };
    },
  }),

  createUser: defineAction({
    request: z.object({
      session_token: z.string().max(256),
      username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/),
      display_name: z.string().trim().min(2).max(100),
      password: z.string().min(8).max(128),
      role: z.enum(["admin", "technician"]),
    }),
    response: mutationResponse,
    async handler(ctx, args): Promise<z.infer<typeof mutationResponse>> {
      if (!await hasRole(ctx, args.session_token, ["admin"])) return { ok: false, message: "ไม่มีสิทธิ์จัดการผู้ใช้งาน" };
      const db = ctx.db<typeof schema>();
      const username = args.username.trim().toLowerCase();
      const duplicate = await db.select({ id: schema.appUsers.id }).from(schema.appUsers).where(eq(schema.appUsers.username, username)).limit(1);
      if (duplicate[0]) return { ok: false, message: "ชื่อผู้ใช้นี้มีอยู่แล้ว" };
      const salt = randomHex(16); const now = new Date();
      const inserted = await db.insert(schema.appUsers).values({ username, displayName: args.display_name.trim(), role: args.role, passwordHash: await passwordDigest(args.password, salt), passwordSalt: salt, active: true, createdAt: now, updatedAt: now }).returning({ id: schema.appUsers.id });
      ctx.invalidateQueries();
      return { ok: true, message: "เพิ่มผู้ใช้งานแล้ว", id: inserted[0]?.id };
    },
  }),

  getWorkspace: defineAction({
    request: z.object({ movement_limit: z.number().int().min(1).max(200).default(80) }),
    response: workspaceResponse,
    async handler(ctx, args): Promise<z.infer<typeof workspaceResponse>> {
      const db = ctx.db<typeof schema>();
      const moldRows = await db.select().from(schema.molds)
        .where(sql`coalesce(${schema.molds.source}, '') <> 'workbook_archive'`)
        .orderBy(desc(schema.molds.updatedAt));
      const movementRows = await db
        .select({
          id: schema.movements.id,
          moldId: schema.movements.moldId,
          moldCode: sql<string>`coalesce(${schema.molds.displayCode}, ${schema.molds.code})`,
          moldName: schema.molds.name,
          type: schema.movements.type,
          fromStatus: schema.movements.fromStatus,
          toStatus: schema.movements.toStatus,
          counterparty: schema.movements.counterparty,
          location: schema.movements.location,
          reference: schema.movements.reference,
          note: schema.movements.note,
          machine: schema.movements.machine,
          productionLine: schema.movements.productionLine,
          head: schema.movements.head,
          toolingType: schema.movements.toolingType,
          quantity: schema.movements.quantity,
          size: schema.movements.size,
          technician: schema.movements.technician,
          innerDiameter: schema.movements.innerDiameter,
          outerDiameter: schema.movements.outerDiameter,
          height: schema.movements.height,
          innerRadius: schema.movements.innerRadius,
          outerRadius: schema.movements.outerRadius,
          reason: schema.movements.reason,
          plate: schema.movements.plate,
          centerRadius: schema.movements.centerRadius,
          happenedAt: schema.movements.happenedAt,
        })
        .from(schema.movements)
        .innerJoin(schema.molds, eq(schema.movements.moldId, schema.molds.id))
        .orderBy(desc(schema.movements.happenedAt), desc(schema.movements.id))
        .limit(args.movement_limit);
      const importRows = await db
        .select({
          total: sql<number>`count(*)`,
          incompleteDates: sql<number>`sum(case when ${schema.toolingLogs.dateQuality} = 'complete' then 0 else 1 end)`,
          latestAt: sql<number | null>`max(${schema.toolingLogs.eventAt})`,
        })
        .from(schema.toolingLogs);
      const importRow = importRows[0];

      return {
        molds: moldRows.map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          location: row.location,
          status: row.status,
          custodian: row.custodian,
          notes: row.notes,
          display_code: row.displayCode ?? row.code,
          production_line: row.productionLine,
          tooling_type: row.toolingType,
          size: row.size,
          source: row.source,
          source_status: row.sourceStatus,
          current_machine: row.currentMachine,
          current_head: row.currentHead,
          source_sheet: row.sourceSheet,
          source_row: row.sourceRow,
          size_class: row.sizeClass,
          outside_a: row.outsideA,
          outside_b: row.outsideB,
          inside_a: row.insideA,
          inside_b: row.insideB,
          measured_height: row.measuredHeight,
          shoulder_height: row.shoulderHeight,
          measured_depth: row.measuredDepth,
          measured_inner_radius: row.measuredInnerRadius,
          measured_outer_radius: row.measuredOuterRadius,
          history_count: row.historyCount,
          latest_technician: row.latestTechnician,
          latest_event_at: row.latestEventAt?.toISOString() ?? null,
          qr_token: row.qrToken,
          inspection_status: row.inspectionStatus,
          inspected_at: row.inspectedAt?.toISOString() ?? null,
          created_at: row.createdAt.toISOString(),
          updated_at: row.updatedAt.toISOString(),
        })),
        movements: movementRows.map((row) => ({
          id: row.id,
          mold_id: row.moldId,
          mold_code: row.moldCode,
          mold_name: row.moldName,
          type: row.type,
          from_status: row.fromStatus,
          to_status: row.toStatus,
          counterparty: row.counterparty,
          location: row.location,
          reference: row.reference,
          note: row.note,
          machine: row.machine,
          production_line: row.productionLine,
          head: row.head,
          tooling_type: row.toolingType,
          quantity: row.quantity,
          size: row.size,
          technician: row.technician,
          inner_diameter: row.innerDiameter,
          outer_diameter: row.outerDiameter,
          height: row.height,
          inner_radius: row.innerRadius,
          outer_radius: row.outerRadius,
          reason: row.reason,
          plate: row.plate,
          center_radius: row.centerRadius,
          happened_at: row.happenedAt.toISOString(),
        })),
        import_summary: {
          total: Number(importRow?.total ?? 0),
          incomplete_dates: Number(importRow?.incompleteDates ?? 0),
          latest_at: importRow?.latestAt ? new Date(Number(importRow.latestAt)).toISOString() : null,
        },
      };
    },
  }),

  getRepairOrders: defineAction({
    request: z.object({
      session_token: z.string().max(256), search: z.string().max(120).default(""),
      status: z.enum(["", "open", "received", "cancelled"]).default(""),
      source: z.enum(["", "P4R1"]).default(""),
      month: z.number().int().min(0).max(12).default(0),
      urgency: z.enum(["", "normal", "urgent", "very_urgent"]).default(""),
      offset: z.number().int().min(0).default(0), limit: z.number().int().min(20).max(200).default(80),
    }),
    response: repairOrdersResponse,
    async handler(ctx, args): Promise<z.infer<typeof repairOrdersResponse>> {
      if (!await hasRole(ctx, args.session_token, ["admin"])) return { summary: { total: 0, open: 0, received: 0, cancelled: 0, imported: 0 }, orders: [], design_codes: [], page: { offset: 0, limit: args.limit, has_more: false } };
      const db = ctx.db<typeof schema>();
      const term = args.search.trim() ? `%${args.search.trim()}%` : "";
      const sourceClause = args.source ? eq(schema.repairOrders.sourceSheet, args.source) : undefined;
      const whereClause = and(
        sourceClause,
        args.status ? eq(schema.repairOrders.status, args.status) : undefined,
        args.month ? eq(schema.repairOrders.orderMonth, args.month) : undefined,
        args.urgency ? eq(schema.repairOrders.urgency, args.urgency) : undefined,
        term ? or(
          like(schema.repairOrders.sourceNo, term), like(schema.repairOrders.jobName, term),
          like(schema.repairOrders.drawingCode, term), like(schema.repairOrders.machine, term),
          like(schema.repairOrders.size, term), like(schema.repairOrders.detail, term),
          like(schema.repairOrders.requester, term), like(schema.repairOrders.receiver, term),
        ) : undefined,
      );
      const [summaryRows, matchRows, rows, designCodes] = await Promise.all([
        db.select({
          total: sql<number>`count(*)`,
          open: sql<number>`sum(case when ${schema.repairOrders.status} = 'open' then 1 else 0 end)`,
          received: sql<number>`sum(case when ${schema.repairOrders.status} = 'received' then 1 else 0 end)`,
          cancelled: sql<number>`sum(case when ${schema.repairOrders.status} = 'cancelled' then 1 else 0 end)`,
          imported: sql<number>`sum(case when ${schema.repairOrders.sourceSheet} = 'P4R1' then 1 else 0 end)`,
        }).from(schema.repairOrders).where(sourceClause),
        db.select({ count: sql<number>`count(*)` }).from(schema.repairOrders).where(whereClause),
        db.select().from(schema.repairOrders).where(whereClause)
          .orderBy(desc(schema.repairOrders.id)).limit(args.limit).offset(args.offset),
        db.select().from(schema.repairDesignCodes)
          .orderBy(asc(schema.repairDesignCodes.toolingType), asc(schema.repairDesignCodes.sourceRow)),
      ]);
      const summary = summaryRows[0]; const matches = Number(matchRows[0]?.count ?? 0);
      return {
        summary: { total: Number(summary?.total ?? 0), open: Number(summary?.open ?? 0), received: Number(summary?.received ?? 0), cancelled: Number(summary?.cancelled ?? 0), imported: Number(summary?.imported ?? 0) },
        orders: rows.map(mapRepairOrder),
        design_codes: designCodes.map((row) => ({ id: row.id, tooling_type: row.toolingType, size_label: row.sizeLabel, drawing_code: row.drawingCode, inner_diameter: row.innerDiameter })),
        page: { offset: args.offset, limit: args.limit, has_more: args.offset + rows.length < matches },
      };
    },
  }),

  createRepairOrder: defineAction({
    request: z.object({
      session_token: z.string().max(256), job_name: z.string().trim().min(1).max(180),
      drawing_code: z.string().max(120).optional(), quantity: z.number().int().min(1).max(9999),
      unit: z.string().trim().min(1).max(30), urgency: z.enum(["normal", "urgent", "very_urgent"]),
      ordered_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      requester: z.string().trim().min(1).max(120), machine: z.string().max(120).optional(),
      detail: z.string().trim().min(1).max(1600), size: z.string().max(240).optional(), note: z.string().max(800).optional(),
      department: z.string().trim().min(1).max(120).default("กระป๋อง 2 ชิ้น"), job_kind: z.enum(["new", "repair"]).default("repair"),
    }),
    response: repairMutationResponse,
    async handler(ctx, args): Promise<z.infer<typeof repairMutationResponse>> {
      if (!await hasRole(ctx, args.session_token, ["admin"])) return { ok: false, message: "เฉพาะ Admin เท่านั้นที่สร้างใบส่งซ่อมได้" };
      if (args.due_date < args.ordered_date) return { ok: false, message: "กำหนดเสร็จต้องไม่ก่อนวันที่สั่ง" };
      const db = ctx.db<typeof schema>(); const now = new Date(); const sourceNo = await nextRepairNo(ctx, args.ordered_date);
      const inserted = await db.insert(schema.repairOrders).values({
        sourceNo, jobName: args.job_name.trim(), drawingCode: clean(args.drawing_code), quantity: args.quantity,
        unit: args.unit.trim(), orderMonth: Number(args.ordered_date.slice(5, 7)), urgency: args.urgency,
        orderedDate: args.ordered_date, dueDate: args.due_date, requester: args.requester.trim(), machine: clean(args.machine),
        detail: args.detail.trim(), size: clean(args.size), note: clean(args.note), department: args.department.trim(),
        jobKind: args.job_kind, status: "open", sourceSheet: "ระบบ", sourceRow: null, createdAt: now, updatedAt: now,
      }).returning({ id: schema.repairOrders.id });
      const row = inserted[0]; if (!row) return { ok: false, message: "สร้างใบส่งซ่อมไม่สำเร็จ" };
      ctx.invalidateQueries(); return { ok: true, message: `สร้างใบส่งซ่อม ${sourceNo} แล้ว`, id: row.id, source_no: sourceNo };
    },
  }),

  updateRepairOrder: defineAction({
    request: z.object({
      session_token: z.string().max(256), order_id: z.number().int().positive(),
      job_name: z.string().trim().min(1).max(180), drawing_code: z.string().max(120).optional(),
      quantity: z.number().int().min(1).max(9999), unit: z.string().trim().min(1).max(30),
      urgency: z.enum(["normal", "urgent", "very_urgent"]),
      ordered_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]),
      due_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]),
      requester: z.string().max(120).optional(), machine: z.string().max(120).optional(),
      detail: z.string().max(1600).optional(), size: z.string().max(240).optional(), note: z.string().max(800).optional(),
      department: z.string().trim().min(1).max(120), job_kind: z.enum(["new", "repair"]),
    }),
    response: repairMutationResponse,
    async handler(ctx, args): Promise<z.infer<typeof repairMutationResponse>> {
      if (!await hasRole(ctx, args.session_token, ["admin"])) return { ok: false, message: "เฉพาะ Admin เท่านั้นที่แก้ไขใบส่งซ่อมได้" };
      if (args.ordered_date && args.due_date && args.due_date < args.ordered_date) return { ok: false, message: "กำหนดเสร็จต้องไม่ก่อนวันที่สั่ง" };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.repairOrders).where(eq(schema.repairOrders.id, args.order_id)).limit(1);
      const order = rows[0];
      if (!order) return { ok: false, message: "ไม่พบใบส่งซ่อมที่เลือก" };
      if (order.status === "cancelled") return { ok: false, message: "ใบส่งซ่อมนี้ถูกยกเลิกแล้ว จึงแก้ไขไม่ได้" };
      await db.update(schema.repairOrders).set({
        jobName: args.job_name.trim(), drawingCode: clean(args.drawing_code), quantity: args.quantity, unit: args.unit.trim(),
        urgency: args.urgency, orderedDate: clean(args.ordered_date), dueDate: clean(args.due_date),
        orderMonth: args.ordered_date ? Number(args.ordered_date.slice(5, 7)) : order.orderMonth,
        requester: clean(args.requester), machine: clean(args.machine), detail: clean(args.detail), size: clean(args.size),
        note: clean(args.note), department: args.department.trim(), jobKind: args.job_kind, updatedAt: new Date(),
      }).where(eq(schema.repairOrders.id, order.id));
      ctx.invalidateQueries();
      return { ok: true, message: `บันทึกการแก้ไข ${order.sourceNo} แล้ว`, id: order.id, source_no: order.sourceNo };
    },
  }),

  cancelRepairOrder: defineAction({
    request: z.object({ session_token: z.string().max(256), order_id: z.number().int().positive(), reason: z.string().trim().min(1).max(800) }),
    response: repairMutationResponse,
    async handler(ctx, args): Promise<z.infer<typeof repairMutationResponse>> {
      if (!await hasRole(ctx, args.session_token, ["admin"])) return { ok: false, message: "เฉพาะ Admin เท่านั้นที่ยกเลิกใบส่งซ่อมได้" };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.repairOrders).where(eq(schema.repairOrders.id, args.order_id)).limit(1);
      const order = rows[0];
      if (!order) return { ok: false, message: "ไม่พบใบส่งซ่อมที่เลือก" };
      if (order.status === "received") return { ok: false, message: "รายการนี้รับกลับแล้ว ไม่สามารถยกเลิกได้" };
      if (order.status === "cancelled") return { ok: false, message: "รายการนี้ถูกยกเลิกแล้ว" };
      const now = new Date();
      await db.update(schema.repairOrders).set({ status: "cancelled", cancelReason: args.reason.trim(), cancelledAt: now, updatedAt: now }).where(eq(schema.repairOrders.id, order.id));
      ctx.invalidateQueries();
      return { ok: true, message: `ยกเลิก ${order.sourceNo} แล้ว`, id: order.id, source_no: order.sourceNo };
    },
  }),

  deleteRepairOrder: defineAction({
    request: z.object({ session_token: z.string().max(256), order_id: z.number().int().positive() }),
    response: repairMutationResponse,
    async handler(ctx, args): Promise<z.infer<typeof repairMutationResponse>> {
      if (!await hasRole(ctx, args.session_token, ["admin"])) return { ok: false, message: "เฉพาะ Admin เท่านั้นที่ลบใบส่งซ่อมได้" };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.repairOrders).where(eq(schema.repairOrders.id, args.order_id)).limit(1);
      const order = rows[0];
      if (!order) return { ok: false, message: "ไม่พบใบส่งซ่อมที่เลือก" };
      await db.delete(schema.repairOrders).where(eq(schema.repairOrders.id, order.id));
      ctx.invalidateQueries();
      return { ok: true, message: `ลบ ${order.sourceNo} แล้ว`, id: order.id, source_no: order.sourceNo };
    },
  }),

  receiveRepairOrder: defineAction({
    request: z.object({
      session_token: z.string().max(256), order_id: z.number().int().positive(),
      received_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), receiver: z.string().trim().min(1).max(120),
      note: z.string().max(800).optional(),
      inspections: z.array(z.object({
        mold_id: z.number().int().positive(), result: z.enum(["pass", "adjust", "fail"]), note: z.string().max(500).optional(),
        outside_a: z.string().max(60).optional(), outside_b: z.string().max(60).optional(),
        inside_a: z.string().max(60).optional(), inside_b: z.string().max(60).optional(), height: z.string().max(60).optional(),
        inner_radius: z.string().max(60).optional(), outer_radius: z.string().max(60).optional(),
        shoulder_height: z.string().max(60).optional(), depth: z.string().max(60).optional(),
      })).min(1).max(50),
    }),
    response: repairMutationResponse,
    async handler(ctx, args): Promise<z.infer<typeof repairMutationResponse>> {
      if (!await hasRole(ctx, args.session_token, ["admin"])) return { ok: false, message: "เฉพาะ Admin เท่านั้นที่รับงานซ่อมเข้าได้" };
      const db = ctx.db<typeof schema>();
      const orderRows = await db.select().from(schema.repairOrders).where(eq(schema.repairOrders.id, args.order_id)).limit(1);
      const order = orderRows[0];
      if (!order) return { ok: false, message: "ไม่พบใบส่งซ่อมที่เลือก" };
      if (order.status === "received") return { ok: false, message: "ใบนี้รับงานกลับแล้ว" };
      if (order.status === "cancelled") return { ok: false, message: "ใบนี้ถูกยกเลิกแล้ว ไม่สามารถรับงานกลับได้" };
      if (order.orderedDate && args.received_date < order.orderedDate) return { ok: false, message: "วันที่รับเข้าต้องไม่ก่อนวันที่สั่งซ่อม" };
      const uniqueIds = Array.from(new Set(args.inspections.map((item) => item.mold_id)));
      if (uniqueIds.length !== args.inspections.length) return { ok: false, message: "มีรหัสแม่พิมพ์ซ้ำ กรุณาเลือกแต่ละตัวเพียงครั้งเดียว" };
      const moldRows = await db.select().from(schema.molds).where(inArray(schema.molds.id, uniqueIds));
      if (moldRows.length !== uniqueIds.length) return { ok: false, message: "พบรหัสแม่พิมพ์ไม่ครบ กรุณาเลือกใหม่จากรายการ" };
      const byId = new Map(moldRows.map((mold) => [mold.id, mold]));
      for (const item of args.inspections) {
        const measured = [item.outside_a, item.outside_b, item.inside_a, item.inside_b, item.height, item.inner_radius, item.outer_radius, item.shoulder_height, item.depth];
        if (!measured.some((value) => clean(value))) return { ok: false, message: `กรุณากรอกค่าหลังตรวจของแม่พิมพ์ ${byId.get(item.mold_id)?.displayCode ?? item.mold_id} อย่างน้อย 1 ค่า` };
      }
      const user = await sessionUser(ctx, args.session_token);
      const inspectedAt = new Date(`${args.received_date}T12:00:00`);
      const now = new Date();
      const statements = [];
      for (const item of args.inspections) {
        const mold = byId.get(item.mold_id);
        if (!mold) continue;
        const nextMoldStatus: MoldStatus = item.result === "pass" ? "available" : "repair";
        const inspectionResult = item.result === "pass" ? "pass" : "fail";
        statements.push(db.insert(schema.repairReceiveInspections).values({
          repairOrderId: order.id, moldId: mold.id, moldCode: mold.displayCode ?? mold.code,
          beforeOutsideA: mold.outsideA, beforeOutsideB: mold.outsideB, beforeInsideA: mold.insideA, beforeInsideB: mold.insideB,
          beforeHeight: mold.measuredHeight, beforeInnerRadius: mold.measuredInnerRadius, beforeOuterRadius: mold.measuredOuterRadius,
          beforeShoulderHeight: mold.shoulderHeight, beforeDepth: mold.measuredDepth,
          afterOutsideA: clean(item.outside_a), afterOutsideB: clean(item.outside_b), afterInsideA: clean(item.inside_a), afterInsideB: clean(item.inside_b),
          afterHeight: clean(item.height), afterInnerRadius: clean(item.inner_radius), afterOuterRadius: clean(item.outer_radius),
          afterShoulderHeight: clean(item.shoulder_height), afterDepth: clean(item.depth), result: item.result,
          note: clean(item.note), checkedBy: user?.displayName ?? args.receiver.trim(), inspectedAt, createdAt: now,
        }));
        statements.push(db.update(schema.molds).set({
          outsideA: clean(item.outside_a), outsideB: clean(item.outside_b), insideA: clean(item.inside_a), insideB: clean(item.inside_b),
          measuredHeight: clean(item.height), measuredInnerRadius: clean(item.inner_radius), measuredOuterRadius: clean(item.outer_radius),
          shoulderHeight: clean(item.shoulder_height), measuredDepth: clean(item.depth), status: nextMoldStatus,
          sourceStatus: item.result === "pass" ? "spare" : "repair", inspectionStatus: inspectionResult,
          inspectedAt, latestTechnician: args.receiver.trim(), latestEventAt: inspectedAt, updatedAt: now,
        }).where(eq(schema.molds.id, mold.id)));
        statements.push(db.insert(schema.moldInspections).values({
          moldId: mold.id, inspectionType: "repair_return", machine: mold.currentMachine, head: mold.currentHead,
          toolingType: mold.toolingType ?? mold.name,
          innerDiameter: [clean(item.inside_a), clean(item.inside_b)].filter(Boolean).join(" / ") || null,
          outerDiameter: [clean(item.outside_a), clean(item.outside_b)].filter(Boolean).join(" / ") || null,
          height: clean(item.height), innerRadius: clean(item.inner_radius), outerRadius: clean(item.outer_radius), centerRadius: null,
          result: inspectionResult, checkedBy: user?.displayName ?? args.receiver.trim(),
          note: [clean(item.note), `ใบส่งซ่อม ${order.sourceNo}`].filter(Boolean).join(" · "), inspectedAt,
        }));
        statements.push(db.insert(schema.movements).values({
          moldId: mold.id, type: "repair_return", fromStatus: mold.status, toStatus: nextMoldStatus,
          counterparty: args.receiver.trim(), location: mold.location, reference: order.sourceNo,
          note: [clean(args.note), clean(item.note), `ผลตรวจ ${item.result}`].filter(Boolean).join(" · ") || null,
          machine: mold.currentMachine, productionLine: mold.productionLine, head: mold.currentHead,
          toolingType: mold.toolingType, quantity: "1", size: mold.size, technician: args.receiver.trim(),
          innerDiameter: [clean(item.inside_a), clean(item.inside_b)].filter(Boolean).join(" / ") || null,
          outerDiameter: [clean(item.outside_a), clean(item.outside_b)].filter(Boolean).join(" / ") || null,
          height: clean(item.height), innerRadius: clean(item.inner_radius), outerRadius: clean(item.outer_radius),
          reason: `รับกลับจากซ่อม ${order.sourceNo}`, plate: clean(item.shoulder_height), centerRadius: clean(item.depth),
          happenedAt: inspectedAt, createdAt: now,
        }));
      }
      const overallCondition = args.inspections.some((item) => item.result === "fail") ? "fail" : args.inspections.some((item) => item.result === "adjust") ? "adjust" : "pass";
      statements.push(db.update(schema.repairOrders).set({
        status: "received", receivedDate: args.received_date, receiver: args.receiver.trim(),
        receiveCondition: overallCondition, receiveNote: clean(args.note), updatedAt: now,
      }).where(eq(schema.repairOrders.id, order.id)));
      const firstStatement = statements[0];
      if (!firstStatement) return { ok: false, message: "ไม่มีรายการตรวจรับให้บันทึก" };
      await db.batch([firstStatement, ...statements.slice(1)]);
      ctx.invalidateQueries();
      return { ok: true, message: `รับงาน ${order.sourceNo} และบันทึกค่าวัดแม่พิมพ์ ${args.inspections.length} ตัวแล้ว`, id: order.id, source_no: order.sourceNo };
    },
  }),

  getRepairReceiveHistory: defineAction({
    request: z.object({
      session_token: z.string().max(256), order_id: z.number().int().positive().optional(),
      year: z.number().int().min(2000).max(2200).optional(), month: z.number().int().min(1).max(12).optional(),
      limit: z.number().int().min(1).max(300).default(120),
    }),
    response: repairReceiveHistoryResponse,
    async handler(ctx, args): Promise<z.infer<typeof repairReceiveHistoryResponse>> {
      if (!await hasRole(ctx, args.session_token, ["admin"])) return { records: [] };
      const db = ctx.db<typeof schema>();
      const start = args.year && args.month ? new Date(args.year, args.month - 1, 1) : null;
      const end = args.year && args.month ? new Date(args.year, args.month, 1) : null;
      const rows = await db.select({
        inspection: schema.repairReceiveInspections, sourceNo: schema.repairOrders.sourceNo,
        jobName: schema.repairOrders.jobName, toolingType: schema.molds.toolingType, size: schema.molds.size,
      }).from(schema.repairReceiveInspections)
        .innerJoin(schema.repairOrders, eq(schema.repairReceiveInspections.repairOrderId, schema.repairOrders.id))
        .innerJoin(schema.molds, eq(schema.repairReceiveInspections.moldId, schema.molds.id))
        .where(and(
          args.order_id ? eq(schema.repairReceiveInspections.repairOrderId, args.order_id) : undefined,
          start ? gte(schema.repairReceiveInspections.inspectedAt, start) : undefined,
          end ? lt(schema.repairReceiveInspections.inspectedAt, end) : undefined,
        )).orderBy(desc(schema.repairReceiveInspections.inspectedAt), desc(schema.repairReceiveInspections.id)).limit(args.limit);
      return { records: rows.map(({ inspection, sourceNo, jobName, toolingType, size }) => ({
        id: inspection.id, order_id: inspection.repairOrderId, source_no: sourceNo, job_name: jobName,
        mold_id: inspection.moldId, mold_code: inspection.moldCode, tooling_type: toolingType, size,
        result: inspection.result, note: inspection.note, checked_by: inspection.checkedBy,
        inspected_at: inspection.inspectedAt.toISOString(),
        before: { outside_a: inspection.beforeOutsideA, outside_b: inspection.beforeOutsideB, inside_a: inspection.beforeInsideA, inside_b: inspection.beforeInsideB, height: inspection.beforeHeight, inner_radius: inspection.beforeInnerRadius, outer_radius: inspection.beforeOuterRadius, shoulder_height: inspection.beforeShoulderHeight, depth: inspection.beforeDepth },
        after: { outside_a: inspection.afterOutsideA, outside_b: inspection.afterOutsideB, inside_a: inspection.afterInsideA, inside_b: inspection.afterInsideB, height: inspection.afterHeight, inner_radius: inspection.afterInnerRadius, outer_radius: inspection.afterOuterRadius, shoulder_height: inspection.afterShoulderHeight, depth: inspection.afterDepth },
      })) };
    },
  }),

  getRepairSummaryReport: defineAction({
    request: z.object({
      session_token: z.string().max(256),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
    response: repairSummaryReportResponse,
    async handler(ctx, args): Promise<z.infer<typeof repairSummaryReportResponse>> {
      const empty: z.infer<typeof repairSummaryReportResponse> = {
        period: { start_date: args.start_date, end_date: args.end_date },
        totals: { sent_orders: 0, sent_molds: 0, received_orders: 0, received_molds: 0, passed: 0, adjust: 0, failed: 0, uninspected: 0 },
        sent_items: [], received_items: [], tooling_breakdown: [],
      };
      if (!await hasRole(ctx, args.session_token, ["admin"])) return empty;
      if (args.end_date < args.start_date) return empty;
      const db = ctx.db<typeof schema>();
      const endCursor = new Date(`${args.end_date}T00:00:00Z`);
      endCursor.setUTCDate(endCursor.getUTCDate() + 1);
      const endExclusiveDate = endCursor.toISOString().slice(0, 10);
      const startInstant = new Date(`${args.start_date}T00:00:00+07:00`);
      const endInstant = new Date(`${endExclusiveDate}T00:00:00+07:00`);
      const [sentRows, receivedInspectionRows, receivedOrderRows] = await Promise.all([
        db.select().from(schema.repairOrders).where(and(
          isNotNull(schema.repairOrders.orderedDate),
          gte(schema.repairOrders.orderedDate, args.start_date),
          lt(schema.repairOrders.orderedDate, endExclusiveDate),
          sql`${schema.repairOrders.status} <> 'cancelled'`,
        )).orderBy(asc(schema.repairOrders.orderedDate), asc(schema.repairOrders.id)),
        db.select({
          inspection: schema.repairReceiveInspections,
          sourceNo: schema.repairOrders.sourceNo,
          receivedDate: schema.repairOrders.receivedDate,
          jobName: schema.repairOrders.jobName,
          drawingCode: schema.repairOrders.drawingCode,
          unit: schema.repairOrders.unit,
          receiver: schema.repairOrders.receiver,
          machine: schema.repairOrders.machine,
          toolingType: schema.molds.toolingType,
          size: schema.molds.size,
        }).from(schema.repairReceiveInspections)
          .innerJoin(schema.repairOrders, eq(schema.repairReceiveInspections.repairOrderId, schema.repairOrders.id))
          .innerJoin(schema.molds, eq(schema.repairReceiveInspections.moldId, schema.molds.id))
          .where(and(
            gte(schema.repairReceiveInspections.inspectedAt, startInstant),
            lt(schema.repairReceiveInspections.inspectedAt, endInstant),
          )).orderBy(asc(schema.repairReceiveInspections.inspectedAt), asc(schema.repairReceiveInspections.id)),
        db.select().from(schema.repairOrders).where(and(
          isNotNull(schema.repairOrders.receivedDate),
          gte(schema.repairOrders.receivedDate, args.start_date),
          lt(schema.repairOrders.receivedDate, endExclusiveDate),
          sql`${schema.repairOrders.status} <> 'cancelled'`,
        )).orderBy(asc(schema.repairOrders.receivedDate), asc(schema.repairOrders.id)),
      ]);
      const sentByType = new Map<string, number>();
      for (const row of sentRows) {
        const label = row.jobName.trim() || "ไม่ระบุรายการ";
        sentByType.set(label, (sentByType.get(label) ?? 0) + row.quantity);
      }
      const inspectedOrderIds = new Set(receivedInspectionRows.map((row) => row.inspection.repairOrderId));
      const historicalReceivedRows = receivedOrderRows.filter((row) => !inspectedOrderIds.has(row.id));
      const receivedByType = new Map<string, number>();
      for (const row of receivedInspectionRows) {
        const label = row.toolingType?.trim() || row.jobName.trim() || "ไม่ระบุรายการ";
        receivedByType.set(label, (receivedByType.get(label) ?? 0) + 1);
      }
      for (const row of historicalReceivedRows) {
        const label = row.jobName.trim() || "ไม่ระบุรายการ";
        receivedByType.set(label, (receivedByType.get(label) ?? 0) + row.quantity);
      }
      const receivedItems: z.infer<typeof repairSummaryReportResponse>["received_items"] = [
        ...receivedInspectionRows.map(({ inspection, sourceNo, receivedDate, jobName, drawingCode, unit, receiver, machine, toolingType, size }) => ({
          id: inspection.id, record_key: `inspection-${inspection.id}`, order_id: inspection.repairOrderId, source_no: sourceNo,
          received_date: receivedDate ?? inspection.inspectedAt.toISOString().slice(0, 10),
          mold_code: inspection.moldCode, job_name: jobName, drawing_code: drawingCode,
          tooling_type: toolingType, size, machine, quantity: 1, unit, receiver,
          result: inspection.result, checked_by: inspection.checkedBy, source: "inspection" as const,
        })),
        ...historicalReceivedRows.map((row) => ({
          id: row.id, record_key: `order-${row.id}`, order_id: row.id, source_no: row.sourceNo,
          received_date: row.receivedDate ?? args.start_date, mold_code: null, job_name: row.jobName,
          drawing_code: row.drawingCode, tooling_type: row.jobName, size: row.size, machine: row.machine,
          quantity: row.quantity, unit: row.unit, receiver: row.receiver, result: null, checked_by: null,
          source: "order_history" as const,
        })),
      ].sort((a, b) => a.received_date.localeCompare(b.received_date) || a.source_no.localeCompare(b.source_no, "th"));
      const receivedMolds = receivedInspectionRows.length + historicalReceivedRows.reduce((sum, row) => sum + row.quantity, 0);
      const labels = Array.from(new Set([...sentByType.keys(), ...receivedByType.keys()])).sort((a, b) => a.localeCompare(b, "th"));
      return {
        period: { start_date: args.start_date, end_date: args.end_date },
        totals: {
          sent_orders: sentRows.length,
          sent_molds: sentRows.reduce((sum, row) => sum + row.quantity, 0),
          received_orders: receivedOrderRows.length,
          received_molds: receivedMolds,
          passed: receivedInspectionRows.filter((row) => row.inspection.result === "pass").length,
          adjust: receivedInspectionRows.filter((row) => row.inspection.result === "adjust").length,
          failed: receivedInspectionRows.filter((row) => row.inspection.result === "fail").length,
          uninspected: historicalReceivedRows.reduce((sum, row) => sum + row.quantity, 0),
        },
        sent_items: sentRows.map((row) => ({
          id: row.id, source_no: row.sourceNo, ordered_date: row.orderedDate ?? args.start_date,
          job_name: row.jobName, drawing_code: row.drawingCode, quantity: row.quantity, unit: row.unit,
          machine: row.machine, size: row.size, urgency: row.urgency, status: row.status,
        })),
        received_items: receivedItems,
        tooling_breakdown: labels.map((label) => ({ label, sent: sentByType.get(label) ?? 0, received: receivedByType.get(label) ?? 0 })),
      };
    },
  }),

  receiveMold: defineAction({
    request: z.object({
      session_token: z.string().max(256),
      name: z.string().trim().min(1).max(120),
      tooling_type: z.string().trim().min(1).max(100),
      size: z.string().max(60).optional(),
      production_line: z.string().max(20).optional(),
      machine: z.string().max(30).optional(),
      head: z.enum(["1", "2", "3", "4"]).optional(),
      location: z.string().max(120).optional(),
      reference: z.string().max(120).optional(),
      notes: z.string().max(800).optional(),
      inner_diameter: z.string().max(60).optional(),
      outer_diameter: z.string().max(60).optional(),
      height: z.string().max(60).optional(),
      inner_radius: z.string().max(60).optional(),
      outer_radius: z.string().max(60).optional(),
      center_radius: z.string().max(60).optional(),
      outside_a: z.string().max(60).optional(),
      outside_b: z.string().max(60).optional(),
      inside_a: z.string().max(60).optional(),
      inside_b: z.string().max(60).optional(),
      shoulder_height: z.string().max(60).optional(),
      measured_depth: z.string().max(60).optional(),
      result: z.enum(["pass", "fail"]),
      happened_at: z.string().datetime(),
    }),
    response: mutationResponse,
    async handler(ctx, args): Promise<z.infer<typeof mutationResponse>> {
      if (!await hasRole(ctx, args.session_token, ["admin"])) return { ok: false, message: "เฉพาะผู้ดูแลระบบเท่านั้นที่รับเข้าแม่พิมพ์ได้" };
      const db = ctx.db<typeof schema>();
      const measuredValues = [args.outside_a, args.outside_b, args.inside_a, args.inside_b, args.height, args.shoulder_height, args.measured_depth, args.inner_radius, args.outer_radius, args.center_radius, args.inner_diameter, args.outer_diameter];
      if (args.result === "pass" && !measuredValues.some((value) => clean(value))) return { ok: false, message: "กรุณาบันทึกค่าวัดอย่างน้อย 1 ค่า ก่อนอนุมัติผ่าน" };
      const outsideA = clean(args.outside_a) ?? clean(args.outer_diameter);
      const outsideB = clean(args.outside_b);
      const insideA = clean(args.inside_a) ?? clean(args.inner_diameter);
      const insideB = clean(args.inside_b);
      const joinedOutside = [outsideA, outsideB].filter((value): value is string => Boolean(value)).join(" / ") || null;
      const joinedInside = [insideA, insideB].filter((value): value is string => Boolean(value)).join(" / ") || null;
      const now = new Date();
      const happenedAt = new Date(args.happened_at);
      const code = await nextMoldCode(ctx, happenedAt);
      const qrToken = `MOLD:${randomHex(16)}`;
      const inserted = await db
        .insert(schema.molds)
        .values({
          code,
          name: args.name.trim(),
          location: clean(args.location),
          notes: clean(args.notes),
          displayCode: code,
          productionLine: clean(args.production_line),
          toolingType: clean(args.tooling_type),
          size: clean(args.size),
          source: "manual",
          sourceStatus: "spare",
          status: "available",
          currentMachine: clean(args.machine),
          currentHead: clean(args.head),
          outsideA,
          outsideB,
          insideA,
          insideB,
          measuredHeight: clean(args.height),
          shoulderHeight: clean(args.shoulder_height),
          measuredDepth: clean(args.measured_depth),
          measuredInnerRadius: clean(args.inner_radius),
          measuredOuterRadius: clean(args.outer_radius),
          latestTechnician: (await sessionUser(ctx, args.session_token))?.displayName ?? "Admin",
          latestEventAt: happenedAt,
          qrToken,
          inspectionStatus: args.result,
          inspectedAt: happenedAt,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: schema.molds.id });
      const mold = inserted[0];
      if (!mold) return { ok: false, message: "บันทึกรับเข้าไม่สำเร็จ" };
      const user = await sessionUser(ctx, args.session_token);
      await db.batch([
        db.insert(schema.movements).values({
          moldId: mold.id,
          type: "receive",
          fromStatus: null,
          toStatus: "available",
          location: clean(args.location),
          reference: clean(args.reference),
          note: clean(args.notes),
          machine: clean(args.machine),
          productionLine: clean(args.production_line),
          head: clean(args.head),
          toolingType: clean(args.tooling_type),
          size: clean(args.size),
          innerDiameter: joinedInside,
          outerDiameter: joinedOutside,
          height: clean(args.height),
          innerRadius: clean(args.inner_radius),
          outerRadius: clean(args.outer_radius),
          centerRadius: clean(args.center_radius),
          happenedAt,
          createdAt: now,
        }),
        db.insert(schema.moldInspections).values({
          moldId: mold.id,
          inspectionType: "new",
          machine: clean(args.machine),
          head: clean(args.head),
          toolingType: args.tooling_type.trim(),
          innerDiameter: joinedInside,
          outerDiameter: joinedOutside,
          height: clean(args.height),
          innerRadius: clean(args.inner_radius),
          outerRadius: clean(args.outer_radius),
          centerRadius: clean(args.center_radius),
          result: args.result,
          checkedBy: user?.displayName ?? "Admin",
          note: clean(args.notes),
          inspectedAt: happenedAt,
        }),
      ]);
      ctx.invalidateQueries();
      return { ok: true, message: args.result === "pass" ? `รับเข้า ${code} และอนุมัติป้าย QR แล้ว` : `รับเข้า ${code} แล้ว แต่ยังไม่อนุมัติให้เบิก`, id: mold.id, code };
    },
  }),

  updateMold: defineAction({
    request: z.object({
      session_token: z.string().max(256),
      id: z.number().int().positive(),
      code: z.string().trim().min(1).max(60),
      name: z.string().trim().min(1).max(120),
      location: z.string().max(120).optional(),
      notes: z.string().max(800).optional(),
    }),
    response: mutationResponse,
    async handler(ctx, args): Promise<z.infer<typeof mutationResponse>> {
      if (!await hasRole(ctx, args.session_token, ["admin"])) return { ok: false, message: "เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขทะเบียนได้" };
      const db = ctx.db<typeof schema>();
      const targetRows = await db
        .select({ id: schema.molds.id, code: schema.molds.code, source: schema.molds.source })
        .from(schema.molds)
        .where(eq(schema.molds.id, args.id))
        .limit(1);
      const target = targetRows[0];
      if (!target) return { ok: false, message: "ไม่พบแม่พิมพ์ที่ต้องการแก้ไข" };
      if (target.source !== "workbook") {
        const existing = await db
          .select({ id: schema.molds.id })
          .from(schema.molds)
          .where(eq(schema.molds.code, args.code.trim()))
          .limit(1);
        if (existing[0] && existing[0].id !== args.id) {
          return { ok: false, message: "รหัสแม่พิมพ์นี้ถูกใช้งานแล้ว" };
        }
      }
      const updated = await db
        .update(schema.molds)
        .set({
          code: target.source === "workbook" ? target.code : args.code.trim(),
          displayCode: args.code.trim(),
          name: args.name.trim(),
          location: clean(args.location),
          notes: clean(args.notes),
          updatedAt: new Date(),
        })
        .where(eq(schema.molds.id, args.id))
        .returning({ id: schema.molds.id });
      if (!updated[0]) return { ok: false, message: "ไม่พบแม่พิมพ์ที่ต้องการแก้ไข" };
      ctx.invalidateQueries();
      return { ok: true, message: "บันทึกข้อมูลแม่พิมพ์แล้ว", id: updated[0].id };
    },
  }),

  recordMovement: defineAction({
    request: z.object({
      session_token: z.string().max(256),
      mold_id: z.number().int().positive(),
      type: z.enum(["issue", "return", "repair", "repair_return", "retire"]),
      counterparty: z.string().max(160).optional(),
      location: z.string().max(120).optional(),
      reference: z.string().max(120).optional(),
      note: z.string().max(800).optional(),
      machine: z.string().max(30).optional(),
      production_line: z.string().max(20).optional(),
      head: z.string().max(30).optional(),
      tooling_type: z.string().max(100).optional(),
      quantity: z.string().max(30).optional(),
      size: z.string().max(60).optional(),
      technician: z.string().max(120).optional(),
      reason: z.string().max(160).optional(),
      happened_at: z.string().datetime(),
    }),
    response: mutationResponse,
    async handler(ctx, args): Promise<z.infer<typeof mutationResponse>> {
      const permittedRoles: UserRole[] = args.type === "issue" ? ["technician"] : ["admin"];
      if (!await hasRole(ctx, args.session_token, permittedRoles)) return { ok: false, message: "บัญชีนี้ไม่มีสิทธิ์ทำรายการประเภทนี้" };
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.molds)
        .where(eq(schema.molds.id, args.mold_id))
        .limit(1);
      const mold = rows[0];
      if (!mold) return { ok: false, message: "ไม่พบแม่พิมพ์ที่เลือก" };
      if (args.type === "issue" && mold.inspectionStatus && mold.inspectionStatus !== "pass") {
        return { ok: false, message: "แม่พิมพ์นี้ยังไม่ผ่านการตรวจสอบ จึงยังเบิกไม่ได้" };
      }
      if (!allowed(mold.status, args.type)) {
        return { ok: false, message: "สถานะปัจจุบันไม่รองรับรายการนี้ กรุณาโหลดข้อมูลใหม่" };
      }

      const destinationStatus = nextStatus(args.type);
      const requestedMachine = clean(args.machine);
      const requestedHead = clean(args.head);
      const location = clean(args.location);
      const counterparty = clean(args.counterparty);
      const nextSourceStatus = args.type === "issue" ? "installed" : args.type === "return" || args.type === "repair_return" ? "spare" : args.type === "repair" ? "repair" : null;
      const measuredInner = [mold.insideA, mold.insideB].filter((value): value is string => Boolean(value)).join(" / ") || null;
      const measuredOuter = [mold.outsideA, mold.outsideB].filter((value): value is string => Boolean(value)).join(" / ") || null;
      const now = new Date();
      await db.batch([
        db.update(schema.molds)
          .set({
            status: destinationStatus,
            custodian: args.type === "issue" || args.type === "repair" ? counterparty : null,
            location: args.type === "issue" ? requestedMachine : location ?? mold.location,
            sourceStatus: nextSourceStatus,
            currentMachine: args.type === "issue" ? requestedMachine : null,
            currentHead: args.type === "issue" ? requestedHead : null,
            inspectionStatus: args.type === "repair_return" ? "pending" : mold.inspectionStatus,
            inspectedAt: args.type === "repair_return" ? null : mold.inspectedAt,
            updatedAt: now,
          })
          .where(eq(schema.molds.id, mold.id)),
        db.insert(schema.movements).values({
          moldId: mold.id,
          type: args.type,
          fromStatus: mold.status,
          toStatus: destinationStatus,
          counterparty,
          location,
          reference: clean(args.reference),
          note: clean(args.note),
          machine: clean(args.machine),
          productionLine: clean(args.production_line),
          head: clean(args.head),
          toolingType: clean(args.tooling_type),
          quantity: clean(args.quantity),
          size: clean(args.size),
          technician: clean(args.technician),
          innerDiameter: args.type === "issue" ? measuredInner : null,
          outerDiameter: args.type === "issue" ? measuredOuter : null,
          height: args.type === "issue" ? mold.measuredHeight : null,
          innerRadius: args.type === "issue" ? mold.measuredInnerRadius : null,
          outerRadius: args.type === "issue" ? mold.measuredOuterRadius : null,
          reason: clean(args.reason),
          plate: args.type === "issue" ? [mold.shoulderHeight && `บ่า ${mold.shoulderHeight}`, mold.measuredDepth && `ลึก ${mold.measuredDepth}`].filter(Boolean).join(" · ") || null : null,
          centerRadius: null,
          happenedAt: new Date(args.happened_at),
          createdAt: now,
        }),
      ]);

      if (args.type === "issue") {
        const machine = clean(args.machine);
        const head = clean(args.head);
        const toolingType = canonicalWorkOrderType(clean(args.tooling_type));
        if (machine && ["1", "2", "3", "4"].includes(head ?? "") && toolingType) {
          const machineRows = await db.select().from(schema.workOrderMachines)
            .where(eq(schema.workOrderMachines.machine, machine)).limit(1);
          const machineRow = machineRows[0];
          const requestedSize = clean(args.size);
          const currentBaseSize = machineRow?.sizeProfile?.split("x")[0]?.trim() ?? null;
          const sizeChanged = Boolean(requestedSize && currentBaseSize && requestedSize !== currentBaseSize);
          await db.insert(schema.workOrderMachines).values({
            machine,
            sizeProfile: sizeChanged ? requestedSize : machineRow?.sizeProfile ?? requestedSize,
            startedAt: sizeChanged ? new Date(args.happened_at) : machineRow?.startedAt ?? new Date(args.happened_at),
            flangeAllowance: machineRow?.flangeAllowance ?? null,
            sourceLabel: "อัปเดตจากรายการเบิกในระบบ",
          }).onConflictDoUpdate({
            target: schema.workOrderMachines.machine,
            set: {
              sizeProfile: sizeChanged ? requestedSize : machineRow?.sizeProfile ?? requestedSize,
              startedAt: sizeChanged ? new Date(args.happened_at) : machineRow?.startedAt ?? new Date(args.happened_at),
              sourceLabel: "อัปเดตจากรายการเบิกในระบบ",
            },
          });

          const setHeadValues = (value: string | null, paired: boolean) => {
            if (head === "4") return { head4A: value, head4B: paired ? value : null };
            if (head === "3") return { head3A: value, head3B: paired ? value : null };
            if (head === "2") return { head2A: value, head2B: paired ? value : null };
            return { head1A: value, head1B: paired ? value : null };
          };
          const code = mold.displayCode ?? mold.code;
          await db.update(schema.workOrderCells).set(setHeadValues(code, false))
            .where(and(eq(schema.workOrderCells.machine, machine), eq(schema.workOrderCells.toolingType, toolingType), eq(schema.workOrderCells.metric, "CODE")));
          // Measurement values are controlled by the separate Admin inspection action.
          // A technician's withdrawal only assigns the selected tooling code.
        }
      }

      const movementRows = await db.select({ id: schema.movements.id }).from(schema.movements)
        .where(eq(schema.movements.moldId, mold.id)).orderBy(desc(schema.movements.id)).limit(1);
      const movementId = movementRows[0]?.id;
      const snapshotMachine = clean(args.machine);
      if (args.type === "issue" && movementId && snapshotMachine) {
        const [machineRows, currentCells] = await Promise.all([
          db.select().from(schema.workOrderMachines)
            .where(eq(schema.workOrderMachines.machine, snapshotMachine)).limit(1),
          db.select().from(schema.workOrderCells)
            .where(eq(schema.workOrderCells.machine, snapshotMachine))
            .orderBy(asc(schema.workOrderCells.id)),
        ]);
        const machineRow = machineRows[0];
        if (machineRow && currentCells.length) {
          await db.insert(schema.workOrderSnapshots).values({
            movementId,
            machine: snapshotMachine,
            sizeProfile: machineRow.sizeProfile,
            startedAt: machineRow.startedAt,
            flangeAllowance: machineRow.flangeAllowance,
            sourceLabel: `สำเนาใบงาน ณ เวลาบันทึกรายการเบิก #${movementId}`,
            capturedAt: now,
          });
          await db.insert(schema.workOrderSnapshotCells).values(currentCells.map((cell) => ({
            movementId,
            productionLine: cell.productionLine,
            toolingType: cell.toolingType,
            metric: cell.metric,
            specValue: cell.specValue,
            head1A: cell.head1A,
            head1B: cell.head1B,
            head2A: cell.head2A,
            head2B: cell.head2B,
            head3A: cell.head3A,
            head3B: cell.head3B,
            head4A: cell.head4A,
            head4B: cell.head4B,
          })));
        }
      }
      ctx.invalidateQueries();
      return { ok: true, message: "บันทึกรายการแล้ว", id: mold.id, movement_id: movementId };
    },
  }),

  recordInspection: defineAction({
    request: z.object({
      session_token: z.string().max(256),
      mold_id: z.number().int().positive().optional(),
      inspection_type: z.enum(["new", "repair_return", "routine"]).default("routine"),
      result: z.enum(["pass", "fail"]).default("pass"),
      note: z.string().max(800).optional(),
      machine: z.string().trim().min(1).max(30),
      head: z.enum(["1", "2", "3", "4"]),
      tooling_type: z.string().trim().min(1).max(100),
      inner_diameter: z.string().max(60).optional(),
      outer_diameter: z.string().max(60).optional(),
      height: z.string().max(60).optional(),
      inner_radius: z.string().max(60).optional(),
      outer_radius: z.string().max(60).optional(),
      center_radius: z.string().max(60).optional(),
    }),
    response: mutationResponse,
    async handler(ctx, args): Promise<z.infer<typeof mutationResponse>> {
      if (!await hasRole(ctx, args.session_token, ["admin"])) return { ok: false, message: "เฉพาะ Admin เท่านั้นที่บันทึกค่าวัดได้" };
      const db = ctx.db<typeof schema>();
      const toolingType = canonicalWorkOrderType(args.tooling_type);
      if (!toolingType) return { ok: false, message: "ไม่พบประเภท Tooling" };
      const setHeadValues = (value: string | null, paired: boolean) => {
        if (args.head === "4") return { head4A: value, head4B: paired ? value : null };
        if (args.head === "3") return { head3A: value, head3B: paired ? value : null };
        if (args.head === "2") return { head2A: value, head2B: paired ? value : null };
        return { head1A: value, head1B: paired ? value : null };
      };
      const measurements: Array<[string, string | null, boolean]> = [
        ["OD", clean(args.outer_diameter), true], ["ID", clean(args.inner_diameter), true], ["HEIGHT", clean(args.height), false],
      ];
      if (toolingType === "SLEEVEDIE CENTER CORE") measurements.push(["R1", clean(args.inner_radius), false], ["R2", clean(args.center_radius), false], ["R3", clean(args.outer_radius), false]);
      else measurements.push(["INNER_RADIUS", clean(args.inner_radius), false], ["OUTER_RADIUS", clean(args.outer_radius), false]);
      let changed = 0;
      for (const [metric, value, paired] of measurements) {
        if (!value) continue;
        const updated = await db.update(schema.workOrderCells).set(setHeadValues(value, paired))
          .where(and(eq(schema.workOrderCells.machine, args.machine), eq(schema.workOrderCells.toolingType, toolingType), eq(schema.workOrderCells.metric, metric)))
          .returning({ id: schema.workOrderCells.id });
        changed += updated.length;
      }
      if (changed === 0 && !args.mold_id) return { ok: false, message: "ไม่มีค่าวัดที่บันทึก หรือไม่พบรายการ Tooling ของเครื่องนี้" };
      if (args.mold_id) {
        const user = await sessionUser(ctx, args.session_token);
        const inspectedAt = new Date();
        const moldRows = await db.select({ id: schema.molds.id, status: schema.molds.status, qrToken: schema.molds.qrToken }).from(schema.molds)
          .where(eq(schema.molds.id, args.mold_id)).limit(1);
        const inspectedMold = moldRows[0];
        if (!inspectedMold) return { ok: false, message: "ไม่พบแม่พิมพ์ที่เลือก" };
        await db.batch([
          db.insert(schema.moldInspections).values({
            moldId: args.mold_id,
            inspectionType: args.inspection_type,
            machine: args.machine,
            head: args.head,
            toolingType,
            innerDiameter: clean(args.inner_diameter),
            outerDiameter: clean(args.outer_diameter),
            height: clean(args.height),
            innerRadius: clean(args.inner_radius),
            outerRadius: clean(args.outer_radius),
            centerRadius: clean(args.center_radius),
            result: args.result,
            checkedBy: user?.displayName ?? "Admin",
            note: clean(args.note),
            inspectedAt,
          }),
          db.update(schema.molds).set({
            inspectionStatus: args.result,
            inspectedAt,
            qrToken: args.result === "pass" ? inspectedMold.qrToken ?? `MOLD:${randomHex(16)}` : inspectedMold.qrToken,
            currentMachine: args.machine,
            currentHead: args.head,
            toolingType,
            updatedAt: inspectedAt,
          }).where(eq(schema.molds.id, args.mold_id)),
        ]);
      }
      ctx.invalidateQueries();
      return { ok: true, message: args.result === "pass" ? "บันทึกผลตรวจวัดและอนุมัติใช้งานแล้ว" : "บันทึกผลตรวจวัดแล้ว — รายการไม่ผ่านและยังเบิกไม่ได้" };
    },
  }),

  getWorkOrderSnapshot: defineAction({ 
    request: z.object({
      machine: z.string().trim().min(1).max(30),
      movement_id: z.number().int().positive().optional(),
    }),
    response: workOrderSnapshotResponse,
    async handler(ctx, args): Promise<z.infer<typeof workOrderSnapshotResponse>> {
      const db = ctx.db<typeof schema>();
      if (args.movement_id) {
        const [snapshotRows, snapshotCells] = await Promise.all([
          db.select().from(schema.workOrderSnapshots)
            .where(eq(schema.workOrderSnapshots.movementId, args.movement_id)).limit(1),
          db.select().from(schema.workOrderSnapshotCells)
            .where(eq(schema.workOrderSnapshotCells.movementId, args.movement_id))
            .orderBy(asc(schema.workOrderSnapshotCells.id)),
        ]);
        const saved = snapshotRows[0];
        if (saved) {
          return {
            machine: saved.machine,
            size_profile: saved.sizeProfile,
            started_at: saved.startedAt?.toISOString() ?? null,
            flange_allowance: saved.flangeAllowance,
            source_label: saved.sourceLabel,
            snapshot_kind: "captured",
            captured_at: saved.capturedAt.toISOString(),
            cells: snapshotCells.map((cell) => ({
              production_line: cell.productionLine,
              tooling_type: cell.toolingType,
              metric: cell.metric,
              spec_value: cell.specValue,
              head1_a: cell.head1A,
              head1_b: cell.head1B,
              head2_a: cell.head2A,
              head2_b: cell.head2B,
              head3_a: cell.head3A,
              head3_b: cell.head3B,
              head4_a: cell.head4A,
              head4_b: cell.head4B,
            })),
          };
        }
      }

      const [machineRows, cells] = await Promise.all([
        db.select().from(schema.workOrderMachines)
          .where(eq(schema.workOrderMachines.machine, args.machine)).limit(1),
        db.select().from(schema.workOrderCells)
          .where(eq(schema.workOrderCells.machine, args.machine))
          .orderBy(asc(schema.workOrderCells.id)),
      ]);
      const machine = machineRows[0];
      return {
        machine: args.machine,
        size_profile: machine?.sizeProfile ?? null,
        started_at: machine?.startedAt?.toISOString() ?? null,
        flange_allowance: machine?.flangeAllowance ?? null,
        source_label: machine?.sourceLabel ?? null,
        snapshot_kind: "current",
        captured_at: null,
        cells: cells.map((cell) => ({
          production_line: cell.productionLine,
          tooling_type: cell.toolingType,
          metric: cell.metric,
          spec_value: cell.specValue,
          head1_a: cell.head1A,
          head1_b: cell.head1B,
          head2_a: cell.head2A,
          head2_b: cell.head2B,
          head3_a: cell.head3A,
          head3_b: cell.head3B,
          head4_a: cell.head4A,
          head4_b: cell.head4B,
        })),
      };
    },
  }),

  lookupMoldByQr: defineAction({
    request: z.object({ session_token: z.string().max(256), qr_value: z.string().trim().min(1).max(300) }),
    response: qrLookupResponse,
    async handler(ctx, args): Promise<z.infer<typeof qrLookupResponse>> {
      if (!await hasRole(ctx, args.session_token, ["technician", "admin"])) return { ok: false, message: "กรุณาเข้าสู่ระบบอีกครั้ง" };
      const db = ctx.db<typeof schema>();
      const value = args.qr_value.trim();
      const rows = await db.select({ id: schema.molds.id, status: schema.molds.status, inspectionStatus: schema.molds.inspectionStatus })
        .from(schema.molds).where(and(
          sql`coalesce(${schema.molds.source}, '') <> 'workbook_archive'`,
          or(eq(schema.molds.qrToken, value), eq(schema.molds.code, value), eq(schema.molds.displayCode, value)),
        )).limit(2);
      const mold = rows[0];
      if (!mold) return { ok: false, message: "ไม่พบ QR Code หรือรหัสแม่พิมพ์นี้" };
      if (rows.length > 1 && !value.startsWith("INV2569:") && !value.startsWith("MOLD:")) return { ok: false, message: "พบรหัส NO. ซ้ำหลาย SIZE กรุณาสแกน QR Code หรือเลือกรายการจากทะเบียน" };
      if (mold.status !== "available") return { ok: false, message: "พบแม่พิมพ์แล้ว แต่สถานะปัจจุบันยังไม่พร้อมเบิก", mold_id: mold.id };
      if (mold.inspectionStatus && mold.inspectionStatus !== "pass") return { ok: false, message: "พบแม่พิมพ์แล้ว แต่ยังไม่ผ่านการตรวจสอบ", mold_id: mold.id };
      return { ok: true, message: "พบแม่พิมพ์พร้อมเบิก", mold_id: mold.id };
    },
  }),

  getReferenceData: defineAction({
    request: z.object({}),
    response: referenceDataResponse,
    async handler(ctx): Promise<z.infer<typeof referenceDataResponse>> {
      const db = ctx.db<typeof schema>();
      const [assignments, specs] = await Promise.all([
        db.select({
          id: schema.molds.id,
          machine: schema.molds.currentMachine,
          size: schema.molds.size,
          line: schema.molds.productionLine,
          toolingType: schema.molds.toolingType,
          head: schema.molds.currentHead,
          toolingCode: schema.molds.displayCode,
          note: schema.molds.notes,
        }).from(schema.molds).where(and(
          eq(schema.molds.sourceStatus, "installed"),
          isNotNull(schema.molds.currentMachine),
        )).orderBy(asc(schema.molds.currentMachine), asc(schema.molds.productionLine), asc(schema.molds.currentHead)),
        db.select().from(schema.toolingSpecs).orderBy(asc(schema.toolingSpecs.sourceRow)),
      ]);
      return {
        snapshot_label: assignments.length ? "2569.xlsm · ฐานข้อมูลล่าสุดและรายการเบิกในระบบ" : null,
        assignments: assignments.flatMap((row) => row.machine && row.line && row.toolingType && row.toolingCode ? [{
          id: row.id, machine: row.machine, size: row.size, line: row.line,
          tooling_type: row.toolingType, head: row.head ?? "—", tooling_code: row.toolingCode,
          condition: "installed" as const, note: row.note,
        }] : []),
        specs: specs.map((row) => ({
          id: row.id, source_row: row.sourceRow, machine: row.machine, head_config: row.headConfig, size_profile: row.sizeProfile,
          p1: { punch_od: row.p1PunchOd, punch_id: row.p1PunchId, punch_height: row.p1PunchHeight, punch_r: row.p1PunchInnerRadius, die_od: row.p1DieOd, die_id: row.p1DieId, die_height: row.p1DieHeight, core_od: row.p1CoreOd, core_height: row.p1CoreHeight, core_r: row.p1CoreOuterRadius },
          p2: { redraw_od: row.p2RedrawOd, redraw_id: row.p2RedrawId, redraw_height: row.p2RedrawHeight, redraw_inner_r: row.p2RedrawInnerRadius, redraw_outer_r: row.p2RedrawOuterRadius, sleeve_od: row.p2SleeveOd, sleeve_height: row.p2SleeveHeight, sleeve_r1: row.p2SleeveR1, sleeve_r2: row.p2SleeveR2, sleeve_r3: row.p2SleeveR3 },
          p3: { punch_size: row.p3PunchSize, punch_od: row.p3PunchOd, punch_id: row.p3PunchId, punch_height: row.p3PunchHeight, die_od: row.p3DieOd, die_id: row.p3DieId, die_height: row.p3DieHeight },
        })),
      };
    },
  }),

  getToolingHistory: defineAction({

    request: z.object({
      search: z.string().max(100).default(""),
      line: z.string().max(20).default(""),
      machine: z.string().max(30).default(""),
      reason: z.union([reasonGroup, z.literal("")]).default(""),
      offset: z.number().int().min(0).default(0),
      limit: z.number().int().min(20).max(100).default(50),
    }),
    response: toolingHistoryResponse,
    async handler(ctx, args): Promise<z.infer<typeof toolingHistoryResponse>> {
      const db = ctx.db<typeof schema>();
      const term = args.search.trim() ? `%${args.search.trim()}%` : "";
      const searchClause = term
        ? or(
            like(schema.toolingLogs.toolingCode, term),
            like(schema.toolingLogs.toolingType, term),
            like(schema.toolingLogs.machine, term),
            like(schema.toolingLogs.technician, term),
            like(schema.toolingLogs.reasonRaw, term),
            like(schema.toolingLogs.size, term),
          )
        : undefined;
      const whereClause = and(
        searchClause,
        args.line ? eq(schema.toolingLogs.line, args.line) : undefined,
        args.machine ? eq(schema.toolingLogs.machine, args.machine) : undefined,
        args.reason ? eq(schema.toolingLogs.reasonGroup, args.reason) : undefined,
      );

      const [summaryRows, matchRows, byLineRows, byReasonRows, machineRows, lineRows, rows] = await Promise.all([
        db.select({
          total: sql<number>`count(*)`,
          uniqueTools: sql<number>`count(distinct case when ${schema.toolingLogs.toolingCode} is not null then ${schema.toolingLogs.line} || '|' || ${schema.toolingLogs.toolingType} || '|' || ${schema.toolingLogs.toolingCode} end)`,
          machines: sql<number>`count(distinct ${schema.toolingLogs.machine})`,
          completeDates: sql<number>`sum(case when ${schema.toolingLogs.dateQuality} = 'complete' then 1 else 0 end)`,
          incompleteDates: sql<number>`sum(case when ${schema.toolingLogs.dateQuality} = 'complete' then 0 else 1 end)`,
          firstAt: sql<number | null>`min(${schema.toolingLogs.eventAt})`,
          lastAt: sql<number | null>`max(${schema.toolingLogs.eventAt})`,
        }).from(schema.toolingLogs),
        db.select({ count: sql<number>`count(*)` }).from(schema.toolingLogs).where(whereClause),
        db.select({ label: schema.toolingLogs.line, count: sql<number>`count(*)` })
          .from(schema.toolingLogs).where(isNotNull(schema.toolingLogs.line))
          .groupBy(schema.toolingLogs.line).orderBy(asc(schema.toolingLogs.line)),
        db.select({ reason: schema.toolingLogs.reasonGroup, count: sql<number>`count(*)` })
          .from(schema.toolingLogs).groupBy(schema.toolingLogs.reasonGroup).orderBy(desc(sql<number>`count(*)`)),
        db.select({ value: schema.toolingLogs.machine }).from(schema.toolingLogs)
          .where(isNotNull(schema.toolingLogs.machine)).groupBy(schema.toolingLogs.machine).orderBy(asc(schema.toolingLogs.machine)),
        db.select({ value: schema.toolingLogs.line }).from(schema.toolingLogs)
          .where(isNotNull(schema.toolingLogs.line)).groupBy(schema.toolingLogs.line).orderBy(asc(schema.toolingLogs.line)),
        db.select().from(schema.toolingLogs).where(whereClause)
          .orderBy(desc(schema.toolingLogs.eventAt), desc(schema.toolingLogs.id))
          .limit(args.limit).offset(args.offset),
      ]);
      const summary = summaryRows[0];
      const matches = Number(matchRows[0]?.count ?? 0);
      return {
        summary: {
          total: Number(summary?.total ?? 0),
          matches,
          unique_tools: Number(summary?.uniqueTools ?? 0),
          machines: Number(summary?.machines ?? 0),
          complete_dates: Number(summary?.completeDates ?? 0),
          incomplete_dates: Number(summary?.incompleteDates ?? 0),
          first_at: summary?.firstAt ? new Date(Number(summary.firstAt)).toISOString() : null,
          last_at: summary?.lastAt ? new Date(Number(summary.lastAt)).toISOString() : null,
        },
        by_line: byLineRows.flatMap((row) => row.label ? [{ label: row.label, count: Number(row.count) }] : []),
        by_reason: byReasonRows.map((row) => ({ reason: row.reason, count: Number(row.count) })),
        filters: {
          machines: machineRows.flatMap((row) => row.value ? [row.value] : []),
          lines: lineRows.flatMap((row) => row.value ? [row.value] : []),
        },
        records: rows.map(mapToolingRecord),
        page: { offset: args.offset, limit: args.limit, has_more: args.offset + rows.length < matches },
      };
    },
  }),

  getMoldHistory: defineAction({
    request: z.object({ mold_id: z.number().int().positive() }),
    response: moldHistoryResponse,
    async handler(ctx, args): Promise<z.infer<typeof moldHistoryResponse>> {
      const db = ctx.db<typeof schema>();
      const moldRows = await db.select().from(schema.molds).where(eq(schema.molds.id, args.mold_id)).limit(1);
      const mold = moldRows[0];
      if (!mold) throw new Error("ไม่พบแม่พิมพ์ที่เลือก");

      const toolingWhere = mold.sourceSheet && mold.sourceRow
        ? and(eq(schema.toolingLogs.sourceSheet, mold.sourceSheet), eq(schema.toolingLogs.sourceRow, mold.sourceRow))
        : mold.source === "workbook" && mold.productionLine && mold.toolingType
          ? and(
              eq(schema.toolingLogs.line, mold.productionLine),
              eq(schema.toolingLogs.toolingType, mold.toolingType),
              eq(schema.toolingLogs.toolingCode, mold.displayCode ?? mold.code),
            )
          : undefined;
      const toolingRows = toolingWhere
        ? await db.select().from(schema.toolingLogs).where(toolingWhere)
            .orderBy(desc(schema.toolingLogs.eventAt), desc(schema.toolingLogs.id)).limit(500)
        : [];
      const movementRows = await db.select({
        id: schema.movements.id,
        moldId: schema.movements.moldId,
        moldCode: sql<string>`coalesce(${schema.molds.displayCode}, ${schema.molds.code})`,
        moldName: schema.molds.name,
        type: schema.movements.type,
        fromStatus: schema.movements.fromStatus,
        toStatus: schema.movements.toStatus,
        counterparty: schema.movements.counterparty,
        location: schema.movements.location,
        reference: schema.movements.reference,
        note: schema.movements.note,
        machine: schema.movements.machine,
        productionLine: schema.movements.productionLine,
        head: schema.movements.head,
        toolingType: schema.movements.toolingType,
        quantity: schema.movements.quantity,
        size: schema.movements.size,
        technician: schema.movements.technician,
        innerDiameter: schema.movements.innerDiameter,
        outerDiameter: schema.movements.outerDiameter,
        height: schema.movements.height,
        innerRadius: schema.movements.innerRadius,
        outerRadius: schema.movements.outerRadius,
        reason: schema.movements.reason,
        plate: schema.movements.plate,
        centerRadius: schema.movements.centerRadius,
        happenedAt: schema.movements.happenedAt,
      }).from(schema.movements)
        .innerJoin(schema.molds, eq(schema.movements.moldId, schema.molds.id))
        .where(eq(schema.movements.moldId, mold.id))
        .orderBy(desc(schema.movements.happenedAt), desc(schema.movements.id));

      return {
        mold: {
          id: mold.id,
          display_code: mold.displayCode ?? mold.code,
          name: mold.name,
          production_line: mold.productionLine,
          tooling_type: mold.toolingType,
          size: mold.size,
        },
        tooling_records: toolingRows.map(mapToolingRecord),
        operational_records: movementRows.map((row) => ({
          id: row.id,
          mold_id: row.moldId,
          mold_code: row.moldCode,
          mold_name: row.moldName,
          type: row.type,
          from_status: row.fromStatus,
          to_status: row.toStatus,
          counterparty: row.counterparty,
          location: row.location,
          reference: row.reference,
          note: row.note,
          machine: row.machine,
          production_line: row.productionLine,
          head: row.head,
          tooling_type: row.toolingType,
          quantity: row.quantity,
          size: row.size,
          technician: row.technician,
          inner_diameter: row.innerDiameter,
          outer_diameter: row.outerDiameter,
          height: row.height,
          inner_radius: row.innerRadius,
          outer_radius: row.outerRadius,
          reason: row.reason,
          plate: row.plate,
          center_radius: row.centerRadius,
          happened_at: row.happenedAt.toISOString(),
        })),
        linked_count: toolingRows.length + movementRows.length,
      };
    },
  }),

  getToolingCalendar: defineAction({
    request: z.object({ start_at: z.string().datetime(), end_at: z.string().datetime() }),
    response: toolingCalendarResponse,
    async handler(ctx, args): Promise<z.infer<typeof toolingCalendarResponse>> {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.toolingLogs)
        .where(and(
          gte(schema.toolingLogs.eventAt, new Date(args.start_at)),
          lt(schema.toolingLogs.eventAt, new Date(args.end_at)),
        ))
        .orderBy(asc(schema.toolingLogs.eventAt), asc(schema.toolingLogs.id));
      return { records: rows.map(mapToolingRecord) };
    },
  }),
} satisfies ActionsModule;
