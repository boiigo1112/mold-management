ALTER TABLE `molds` ADD `qr_token` text;
--> statement-breakpoint
ALTER TABLE `molds` ADD `inspection_status` text;
--> statement-breakpoint
ALTER TABLE `molds` ADD `inspected_at` integer;
--> statement-breakpoint
CREATE UNIQUE INDEX `molds_qr_token_unique` ON `molds` (`qr_token`);
--> statement-breakpoint
CREATE TABLE `mold_inspections` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `mold_id` integer NOT NULL,
  `inspection_type` text NOT NULL,
  `machine` text,
  `head` text,
  `tooling_type` text NOT NULL,
  `inner_diameter` text,
  `outer_diameter` text,
  `height` text,
  `inner_radius` text,
  `outer_radius` text,
  `center_radius` text,
  `result` text NOT NULL,
  `checked_by` text NOT NULL,
  `note` text,
  `inspected_at` integer NOT NULL,
  FOREIGN KEY (`mold_id`) REFERENCES `molds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mold_inspections_mold_id_idx` ON `mold_inspections` (`mold_id`);
