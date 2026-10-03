CREATE TABLE work_order_snapshots (
  movement_id INTEGER PRIMARY KEY NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
  machine TEXT NOT NULL,
  size_profile TEXT,
  started_at INTEGER,
  flange_allowance TEXT,
  source_label TEXT NOT NULL,
  captured_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE work_order_snapshot_cells (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  movement_id INTEGER NOT NULL REFERENCES work_order_snapshots(movement_id) ON DELETE CASCADE,
  production_line TEXT NOT NULL,
  tooling_type TEXT NOT NULL,
  metric TEXT NOT NULL,
  spec_value TEXT,
  head1_a TEXT,
  head1_b TEXT,
  head2_a TEXT,
  head2_b TEXT,
  head3_a TEXT,
  head3_b TEXT,
  head4_a TEXT,
  head4_b TEXT
);
--> statement-breakpoint
CREATE INDEX work_order_snapshot_cells_movement_idx ON work_order_snapshot_cells(movement_id);
