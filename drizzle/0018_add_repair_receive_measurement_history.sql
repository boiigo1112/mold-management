CREATE TABLE `repair_receive_inspections` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `repair_order_id` integer NOT NULL,
  `mold_id` integer NOT NULL,
  `mold_code` text NOT NULL,
  `before_outside_a` text,
  `before_outside_b` text,
  `before_inside_a` text,
  `before_inside_b` text,
  `before_height` text,
  `before_inner_radius` text,
  `before_outer_radius` text,
  `before_shoulder_height` text,
  `before_depth` text,
  `after_outside_a` text,
  `after_outside_b` text,
  `after_inside_a` text,
  `after_inside_b` text,
  `after_height` text,
  `after_inner_radius` text,
  `after_outer_radius` text,
  `after_shoulder_height` text,
  `after_depth` text,
  `result` text NOT NULL,
  `note` text,
  `checked_by` text NOT NULL,
  `inspected_at` integer NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`repair_order_id`) REFERENCES `repair_orders`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`mold_id`) REFERENCES `molds`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `repair_receive_order_idx` ON `repair_receive_inspections` (`repair_order_id`);
--> statement-breakpoint
CREATE INDEX `repair_receive_mold_idx` ON `repair_receive_inspections` (`mold_id`);
--> statement-breakpoint
CREATE INDEX `repair_receive_inspected_at_idx` ON `repair_receive_inspections` (`inspected_at`);