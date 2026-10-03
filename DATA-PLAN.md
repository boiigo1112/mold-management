# Data Plan

## Current inventory snapshot

- **Source:** user-provided workbook `2569.xlsm`, uploaded 2026-10-03.
- **Authoritative sheets:** `DIEP1`, `PUNCHP1`, `PUNCHP3`, `DIEP3`, and `REDRAWP2`.
- **Imported item rows:** 799 current tooling records — DIEP1 202, PUNCHP1 216, PUNCHP3 226, DIEP3 155, REDRAWP2 0.
- **Empty-sheet handling:** `REDRAWP2` contains section headings but no item row with a mold NO. and measurements. The artifact records no fabricated REDRAW item.
- **Identity:** each inventory row has a unique internal key from the exact source sheet and row. The visible tooling code remains the Excel `No.` value; the source sheet, source row, tooling type, production line, and SIZE disambiguate repeated NO. values.
- **Status mapping:** `สแปร์` → available; `ใช้งานบนเครื่อง` → issued/installed on the parsed `TP` machine and head; `ส่งซ่อม` → repair; `ยกเลิกใช้งาน` → retired. One source row (`DIEP1` row 198, NO. 6912) says it is in use but leaves the machine blank, so it is marked `unlocated` with a visible review note rather than assigning a machine by guesswork.
- **Measurements:** Outside 12–6, Outside 3–9, Inside 12–6, Inside 3–9, HEIGHT, R-IN, R-OUT, shoulder height, depth, and size class are preserved only where the corresponding Excel sheet provides them.
- **Technician withdrawal linkage:** selecting a tooling NO. in the withdrawal form reads the matching row, shows its source and measurements, and saves those measurements with the issue event. Machine/head linkage is updated on issue and cleared when returned, repaired, or retired.
- **History:** the five-sheet snapshot replaces the prior imported tooling-log dataset. Each imported item is represented as its current source record; no event date is inferred because these sheets do not provide one. Operational movements that already exist remain intact so previously created work-order records are not rewritten.
- **Prior workbook registry:** prior workbook-derived molds that have operational movements are archived for referential integrity and hidden from current stock; unreferenced prior workbook rows are removed.

No public-web or connected-account sources are used. New operational records continue to be entered through the artifact's existing actions.
