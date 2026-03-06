# VERASLi™ | Universal Specialist v1

## Current State
- Frontend shell with Terminal-Dark aesthetic (JetBrains Mono, OKLCH green/amber tokens)
- Three context tabs: Tactical Mechanic, Academic Auditor, Environmental Command
- Each tab shows a placeholder boot-sequence animation with status cells
- Backend has only a `whoami()` function — no persistent storage

## Requested Changes (Diff)

### Add
- **Knowledge Sink zone** in Tactical Mechanic view
  - Label: "Primary Knowledge Drop (VERASLi™ Indexing)"
  - Accepts: paste text directly, or upload `.txt` / `.md` file
  - Displays uploaded/pasted content as indexed document list
- **Structured Data Grid** below the Knowledge Sink
  - Columns: Component | Specification | Tools Required
  - Add/edit/delete rows
  - Rows saved to Motoko backend, scoped to caller's Principal ID
- **Search bar** at the top of Tactical Mechanic view
  - Filters both Knowledge Sink documents AND Data Grid rows in real time
- **Amber text for Warnings**, green text for "Status: OK" indicators
- **Backend storage** (Motoko): CRUD operations for Data Grid rows, keyed by Principal
  - `saveDataRow(row)` — upsert a data row
  - `getDataRows()` — get all rows for caller
  - `deleteDataRow(id)` — delete a row by id
  - `saveKnowledgeDoc(doc)` — save a knowledge sink document
  - `getKnowledgeDocs()` — get all knowledge docs for caller
  - `deleteKnowledgeDoc(id)` — delete a knowledge doc

### Modify
- Tactical Mechanic tab content: replace placeholder with full Knowledge Sink + Data Grid layout
- Academic Auditor and Environmental Command tabs: keep placeholder for now

### Remove
- Nothing removed from existing features

## Implementation Plan
1. Update `main.mo` to add stable storage maps: DataRow records (id, component, specification, toolsRequired, createdAt) and KnowledgeDoc records (id, title, content, createdAt), all keyed by Principal
2. Expose backend CRUD query/update functions for both entities
3. Regenerate `backend.d.ts` bindings
4. Build `TacticalMechanicView` component:
   - Search bar at top (filters both sections)
   - Knowledge Sink section: text paste area + file upload button (.txt/.md), list of saved docs with delete
   - Data Grid section: table with Component/Specification/Tools Required columns, add-row form, delete per row
5. Wire all data operations to backend (load on mount, save on submit, delete on action)
6. Apply amber/green status coloring throughout, consistent with Terminal-Dark theme
7. Replace PlaceholderContent for "tactical-mechanic" tab with TacticalMechanicView
