DROP TABLE IF EXISTS entries;
--> statement-breakpoint
CREATE TABLE molds (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'issued', 'repair', 'retired')),
  custodian TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  mold_id INTEGER NOT NULL REFERENCES molds(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('receive', 'issue', 'return', 'repair', 'repair_return', 'retire')),
  from_status TEXT,
  to_status TEXT NOT NULL,
  counterparty TEXT,
  location TEXT,
  reference TEXT,
  note TEXT,
  happened_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX movements_mold_id_idx ON movements(mold_id);
--> statement-breakpoint
CREATE INDEX movements_happened_at_idx ON movements(happened_at);
