import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appUsers = sqliteTable("app_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["admin", "technician"] }).notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const appSessions = sqliteTable("app_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => appUsers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("app_sessions_user_id_idx").on(table.userId)]);

export const molds = sqliteTable("molds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  location: text("location"),
  status: text("status", {
    enum: ["available", "issued", "repair", "retired"],
  }).notNull().default("available"),
  custodian: text("custodian"),
  notes: text("notes"),
  displayCode: text("display_code"),
  productionLine: text("production_line"),
  toolingType: text("tooling_type"),
  size: text("size"),
  source: text("source"),
  sourceStatus: text("source_status", {
    enum: ["installed", "repair", "spare", "mismatch", "unlocated"],
  }),
  currentMachine: text("current_machine"),
  currentHead: text("current_head"),
  sourceSheet: text("source_sheet"),
  sourceRow: integer("source_row"),
  sizeClass: text("size_class"),
  outsideA: text("outside_a"),
  outsideB: text("outside_b"),
  insideA: text("inside_a"),
  insideB: text("inside_b"),
  measuredHeight: text("measured_height"),
  shoulderHeight: text("shoulder_height"),
  measuredDepth: text("measured_depth"),
  measuredInnerRadius: text("measured_inner_radius"),
  measuredOuterRadius: text("measured_outer_radius"),
  historyCount: integer("history_count").notNull().default(0),
  latestTechnician: text("latest_technician"),
  latestEventAt: integer("latest_event_at", { mode: "timestamp_ms" }),
  qrToken: text("qr_token").unique(),
  inspectionStatus: text("inspection_status", { enum: ["pending", "pass", "fail"] }),
  inspectedAt: integer("inspected_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const movements = sqliteTable("movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moldId: integer("mold_id")
    .notNull()
    .references(() => molds.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["receive", "issue", "return", "repair", "repair_return", "retire"],
  }).notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  counterparty: text("counterparty"),
  location: text("location"),
  reference: text("reference"),
  note: text("note"),
  machine: text("machine"),
  productionLine: text("production_line"),
  head: text("head"),
  toolingType: text("tooling_type"),
  quantity: text("quantity"),
  size: text("size"),
  technician: text("technician"),
  innerDiameter: text("inner_diameter"),
  outerDiameter: text("outer_diameter"),
  height: text("height"),
  innerRadius: text("inner_radius"),
  outerRadius: text("outer_radius"),
  reason: text("reason"),
  plate: text("plate"),
  centerRadius: text("center_radius"),
  happenedAt: integer("happened_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const moldInspections = sqliteTable("mold_inspections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moldId: integer("mold_id").notNull().references(() => molds.id, { onDelete: "cascade" }),
  inspectionType: text("inspection_type", { enum: ["new", "repair_return", "routine"] }).notNull(),
  machine: text("machine"),
  head: text("head"),
  toolingType: text("tooling_type").notNull(),
  innerDiameter: text("inner_diameter"),
  outerDiameter: text("outer_diameter"),
  height: text("height"),
  innerRadius: text("inner_radius"),
  outerRadius: text("outer_radius"),
  centerRadius: text("center_radius"),
  result: text("result", { enum: ["pass", "fail"] }).notNull(),
  checkedBy: text("checked_by").notNull(),
  note: text("note"),
  inspectedAt: integer("inspected_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("mold_inspections_mold_id_idx").on(table.moldId)]);

export const toolingLogs = sqliteTable("tooling_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceSheet: text("source_sheet").notNull(),
  sourceRow: integer("source_row").notNull(),
  eventAt: integer("event_at", { mode: "timestamp_ms" }),
  dateQuality: text("date_quality", {
    enum: ["complete", "missing", "time_only"],
  }).notNull(),
  day: integer("day"),
  month: integer("month"),
  machine: text("machine"),
  line: text("line"),
  head: text("head"),
  toolingType: text("tooling_type"),
  quantity: text("quantity"),
  toolingCode: text("tooling_code"),
  size: text("size"),
  technician: text("technician"),
  innerDiameter: text("inner_diameter"),
  outerDiameter: text("outer_diameter"),
  height: text("height"),
  innerRadius: text("inner_radius"),
  outerRadius: text("outer_radius"),
  reasonRaw: text("reason_raw"),
  reasonGroup: text("reason_group", {
    enum: ["wear", "size_change", "pm", "quality", "other", "unspecified"],
  }).notNull(),
  plate: text("plate"),
  centerRadius: text("center_radius"),
  importedAt: integer("imported_at", { mode: "timestamp_ms" }).notNull(),
});


export const toolingAssignments = sqliteTable("tooling_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slotKey: text("slot_key").notNull().unique(),
  snapshotLabel: text("snapshot_label").notNull(),
  machine: text("machine").notNull(),
  size: text("size"),
  line: text("line").notNull(),
  toolingType: text("tooling_type").notNull(),
  head: text("head").notNull(),
  toolingCode: text("tooling_code").notNull(),
  condition: text("condition", {
    enum: ["installed", "repair", "spare", "mismatch"],
  }).notNull(),
  note: text("note"),
});

export const workOrderMachines = sqliteTable("work_order_machines", {
  machine: text("machine").primaryKey(),
  sizeProfile: text("size_profile"),
  startedAt: integer("started_at", { mode: "timestamp_ms" }),
  flangeAllowance: text("flange_allowance"),
  sourceLabel: text("source_label").notNull(),
});

export const workOrderCells = sqliteTable("work_order_cells", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  machine: text("machine")
    .notNull()
    .references(() => workOrderMachines.machine, { onDelete: "cascade" }),
  productionLine: text("production_line").notNull(),
  toolingType: text("tooling_type").notNull(),
  metric: text("metric").notNull(),
  specValue: text("spec_value"),
  head1A: text("head1_a"),
  head1B: text("head1_b"),
  head2A: text("head2_a"),
  head2B: text("head2_b"),
  head3A: text("head3_a"),
  head3B: text("head3_b"),
  head4A: text("head4_a"),
  head4B: text("head4_b"),
});

export const workOrderSnapshots = sqliteTable("work_order_snapshots", {
  movementId: integer("movement_id")
    .primaryKey()
    .references(() => movements.id, { onDelete: "cascade" }),
  machine: text("machine").notNull(),
  sizeProfile: text("size_profile"),
  startedAt: integer("started_at", { mode: "timestamp_ms" }),
  flangeAllowance: text("flange_allowance"),
  sourceLabel: text("source_label").notNull(),
  capturedAt: integer("captured_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const workOrderSnapshotCells = sqliteTable("work_order_snapshot_cells", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  movementId: integer("movement_id")
    .notNull()
    .references(() => workOrderSnapshots.movementId, { onDelete: "cascade" }),
  productionLine: text("production_line").notNull(),
  toolingType: text("tooling_type").notNull(),
  metric: text("metric").notNull(),
  specValue: text("spec_value"),
  head1A: text("head1_a"),
  head1B: text("head1_b"),
  head2A: text("head2_a"),
  head2B: text("head2_b"),
  head3A: text("head3_a"),
  head3B: text("head3_b"),
  head4A: text("head4_a"),
  head4B: text("head4_b"),
});

export const repairOrders = sqliteTable("repair_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceNo: text("source_no").notNull().unique(),
  jobName: text("job_name").notNull(),
  drawingCode: text("drawing_code"),
  quantity: integer("quantity").notNull().default(1),
  unit: text("unit").notNull().default("ตัว"),
  orderMonth: integer("order_month").notNull(),
  urgency: text("urgency", { enum: ["normal", "urgent", "very_urgent"] }).notNull().default("normal"),
  orderedDate: text("ordered_date"),
  dueDate: text("due_date"),
  requester: text("requester"),
  receivedDate: text("received_date"),
  receiver: text("receiver"),
  machine: text("machine"),
  detail: text("detail"),
  size: text("size"),
  note: text("note"),
  department: text("department").notNull().default("กระป๋อง 2 ชิ้น"),
  jobKind: text("job_kind", { enum: ["new", "repair"] }).notNull().default("repair"),
  status: text("status", { enum: ["open", "received", "cancelled"] }).notNull().default("open"),
  receiveCondition: text("receive_condition", { enum: ["pass", "adjust", "fail"] }),
  receiveNote: text("receive_note"),
  cancelReason: text("cancel_reason"),
  cancelledAt: integer("cancelled_at", { mode: "timestamp_ms" }),
  sourceSheet: text("source_sheet").notNull().default("P4R1"),
  sourceRow: integer("source_row"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("repair_orders_status_idx").on(table.status), index("repair_orders_month_idx").on(table.orderMonth)]);

export const repairReceiveInspections = sqliteTable("repair_receive_inspections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  repairOrderId: integer("repair_order_id").notNull().references(() => repairOrders.id, { onDelete: "cascade" }),
  moldId: integer("mold_id").notNull().references(() => molds.id, { onDelete: "restrict" }),
  moldCode: text("mold_code").notNull(),
  beforeOutsideA: text("before_outside_a"),
  beforeOutsideB: text("before_outside_b"),
  beforeInsideA: text("before_inside_a"),
  beforeInsideB: text("before_inside_b"),
  beforeHeight: text("before_height"),
  beforeInnerRadius: text("before_inner_radius"),
  beforeOuterRadius: text("before_outer_radius"),
  beforeShoulderHeight: text("before_shoulder_height"),
  beforeDepth: text("before_depth"),
  afterOutsideA: text("after_outside_a"),
  afterOutsideB: text("after_outside_b"),
  afterInsideA: text("after_inside_a"),
  afterInsideB: text("after_inside_b"),
  afterHeight: text("after_height"),
  afterInnerRadius: text("after_inner_radius"),
  afterOuterRadius: text("after_outer_radius"),
  afterShoulderHeight: text("after_shoulder_height"),
  afterDepth: text("after_depth"),
  result: text("result", { enum: ["pass", "adjust", "fail"] }).notNull(),
  note: text("note"),
  checkedBy: text("checked_by").notNull(),
  inspectedAt: integer("inspected_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  index("repair_receive_order_idx").on(table.repairOrderId),
  index("repair_receive_mold_idx").on(table.moldId),
  index("repair_receive_inspected_at_idx").on(table.inspectedAt),
]);

export const repairDesignCodes = sqliteTable("repair_design_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  toolingType: text("tooling_type").notNull(),
  sizeLabel: text("size_label").notNull(),
  drawingCode: text("drawing_code").notNull(),
  innerDiameter: text("inner_diameter"),
  sourceRow: integer("source_row").notNull(),
});

export const toolingSpecs = sqliteTable("tooling_specs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceRow: integer("source_row").notNull().unique(),
  machine: text("machine"),
  headConfig: text("head_config"),
  sizeProfile: text("size_profile"),
  p1PunchOd: text("p1_punch_od"),
  p1PunchId: text("p1_punch_id"),
  p1PunchHeight: text("p1_punch_height"),
  p1PunchInnerRadius: text("p1_punch_inner_radius"),
  p1DieOd: text("p1_die_od"),
  p1DieId: text("p1_die_id"),
  p1DieHeight: text("p1_die_height"),
  p1CoreOd: text("p1_core_od"),
  p1CoreHeight: text("p1_core_height"),
  p1CoreOuterRadius: text("p1_core_outer_radius"),
  p2RedrawOd: text("p2_redraw_od"),
  p2RedrawId: text("p2_redraw_id"),
  p2RedrawHeight: text("p2_redraw_height"),
  p2RedrawInnerRadius: text("p2_redraw_inner_radius"),
  p2RedrawOuterRadius: text("p2_redraw_outer_radius"),
  p2SleeveOd: text("p2_sleeve_od"),
  p2SleeveHeight: text("p2_sleeve_height"),
  p2SleeveR1: text("p2_sleeve_r1"),
  p2SleeveR2: text("p2_sleeve_r2"),
  p2SleeveR3: text("p2_sleeve_r3"),
  p3PunchSize: text("p3_punch_size"),
  p3PunchOd: text("p3_punch_od"),
  p3PunchId: text("p3_punch_id"),
  p3PunchHeight: text("p3_punch_height"),
  p3DieOd: text("p3_die_od"),
  p3DieId: text("p3_die_id"),
  p3DieHeight: text("p3_die_height"),
});
