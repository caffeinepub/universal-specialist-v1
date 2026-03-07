# VERASLi Universal Specialist v2

## Current State
The app has a working 3-mode frontend (Tactical Mechanic, Academic Auditor, Environmental Command) with:
- Motoko backend storing KnowledgeDoc, DataRow, ScanResult per Principal
- TacticalMechanicView with Knowledge Sink + Data Grid
- LiveVisionHUD with 3-phase agentic scan (Vision → Web Search → Synthesis)
- `agenticScan(imageDescription, contextMode)` backend function returning AgenticResult
- Enterprise dark-mode UI (Sora + JetBrains Mono, charcoal-slate bg, metallic blue accents)

Backend compiles successfully (warnings only, no errors).

## Requested Changes (Diff)

### Add
- 5 new enterprise sector modes: Healthcare, Technology, Education, Construction, Mechanics
- Per-sector accent colors: Cyan (Healthcare), Blue (Technology), Amber (Education), Orange (Construction), Green (Mechanics)
- "Auto-Detecting Environment..." HUD overlay visual state during Phase 1
- "Context Locked: [Sector]" flash notification after auto-detection
- Backend `agenticScan` sector routing: each mode appends domain-specific keywords to the web search query

### Modify
- Replace the 3 context modes in App.tsx with 5 new sector modes
- Update LiveVisionHUD Phase 1 vision prompt to request JSON output: `{ detected_mode, image_description }`
- Frontend state management: auto-switch active sector based on `detected_mode` from Phase 1 response
- HUD bottom bar: show sector lock notification after detection, then display search results
- Context suffixes updated per sector for DuckDuckGo query biasing

### Remove
- "Tactical Mechanic", "Academic Auditor", "Environmental Command" hardcoded modes
- Legacy shortcode labels [TM-01], [AA-02], [EC-03] in tabs (replace with sector codes)

## Implementation Plan
1. Update `agenticScan` in Motoko backend to handle 5 sector modes with keyword biasing
2. Replace TABS array in App.tsx with 5 sector tabs + per-sector accent colors
3. Update LiveVisionHUD: new sector prompts requesting JSON, auto-detect state machine, sector-lock notification
4. Update TacticalMechanicView header labels for new "Mechanics" sector branding
5. Wire sector auto-detection callback from LiveVisionHUD up to App.tsx via prop
6. Validate frontend and deploy
