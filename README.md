# ระบบจัดการแม่พิมพ์ (Mold Management System)

เว็บแอปบริหารจัดการแม่พิมพ์โรงงานแบบครบวงจร: ทะเบียนแม่พิมพ์, เบิก–จ่าย,
ส่งซ่อม–รับเข้าจากซ่อม, ตรวจเช็คค่าวัด, รายงานสรุป และใบงาน (Work Order)

## Tech stack

- TypeScript + React 19 (client) / Bun (server)
- Drizzle ORM + SQLite
- Tailwind CSS 4
- Package manager: Bun 1.3.x

> หมายเหตุ: โปรเจกต์นี้พัฒนาบน Muse hosted runtime โดยใช้ `@hatch/space-sdk`
> (อ้างอิง path ภายในเครื่อง `file:/opt/hatch/skills/spaces/ts-runtime/dist/space-sdk.tgz`)
> การรันนอกสภาพแวดล้อมดังกล่าวต้องจัดเตรียม SDK ให้ตรงกันเอง

## การติดตั้ง (สำหรับพัฒนา)

```bash
bun install
bun run build
```

## โครงสร้าง

- `client/` — โค้ดฝั่งหน้าเว็บ (React)
- `server/` — โค้ดฝั่งเซิร์ฟเวอร์ (actions, schema)
- `drizzle/` — migration ของฐานข้อมูล (เรียงตามลำดับเลข)
- `DATA-PLAN.md` — แผนข้อมูลและการนำเข้าไฟล์ Excel

## ข้อมูล

ฐานข้อมูลจริง (`app.db`) และไฟล์ Excel ต้นฉบับ **ไม่ได้** อยู่ใน repo นี้
สคีมาเริ่มต้นดูได้จาก `drizzle/` แล้วนำเข้าข้อมูลตามขั้นตอนใน `DATA-PLAN.md`
