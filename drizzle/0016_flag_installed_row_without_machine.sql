UPDATE molds
SET source_status = 'unlocated',
    notes = 'Excel ระบุว่าใช้งานบนเครื่อง แต่ช่องเครื่องที่ใช้ว่าง กรุณาตรวจสอบตำแหน่ง'
WHERE source_sheet = 'DIEP1' AND source_row = 198;
--> statement-breakpoint
UPDATE tooling_logs
SET reason_raw = 'สถานะล่าสุด: ใช้งานบนเครื่อง · ไม่พบเครื่องที่ใช้ใน Excel'
WHERE source_sheet = 'DIEP1' AND source_row = 198;
