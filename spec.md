# VERASLi Universal Specialist v2

## Current State

- Backend (`main.mo`) has `saveScanResult`, `getScanResults`, `deleteScanResult` functions and the `ScanResult` type. However, the `ScanResult` type uses `contextMode` and `analysisText` and `thumbnailSummary` fields — the request uses `sector` and `analysis` naming, but the backend.d.ts is already aligned to what exists. No schema change needed — backend is complete.
- Frontend has `AppState = "locked" | "dashboard" | "sector"` with no history state.
- `App.tsx` renders three views: AuthLock → Dashboard → SectorView. No global nav bar shared across dashboard and sector views.
- `Dashboard.tsx` has its own header with sign-out. No History or Settings buttons.
- `SectorView` in `App.tsx` has its own header with sign-out.
- `LiveVisionHUD.tsx` already saves scan results via `actor.saveScanResult()` in the scan pipeline (both web search and vision-only paths). This is working.
- No `SessionHistory.tsx` component exists.
- No `SettingsMenu.tsx` component exists.
- Sign-out logic exists in both `Dashboard.tsx` (calls `clear()` + `onSignOut()`) and `App.tsx` SectorView header.

## Requested Changes (Diff)

### Add
- `AppState` value: `"history"` — a new top-level view
- `SessionHistory.tsx` — scrollable feed of all scan results across all sectors. Each card shows: formatted date/time, sector badge (with accent), thumbnail image (from `imageBase64` if stored, else placeholder), truncated analysis preview, and a delete button.
- `SettingsMenu.tsx` — slide-over sheet containing: truncated Principal ID, "Clear All History" destructive button, "Sign Out" button.
- Global `NavBar` component shared by `"dashboard"` and `"history"` views — contains "History" button and "Settings" button. Rendered in `App.tsx` above those views.

### Modify
- `App.tsx`: Add `"history"` to `AppState` type. Add handlers for `onGoToHistory` and `onOpenSettings`. Pass the actor/isActorReady/actorError down to the NavBar so it can also be used on the history view. Wrap dashboard and history views in the shared NavBar. Pass `principalId` and `onSignOut` to `SettingsMenu`.
- `Dashboard.tsx`: Remove the inline sign-out button from the header (it moves to SettingsMenu). The Dashboard header will simplify to just branding + connection badge + principal (the NavBar handles History/Settings). Note: keep the Dashboard's existing "SIGN OUT" button as fallback until NavBar is wired.
- `LiveVisionHUD.tsx`: The scan auto-save is already implemented. Verify the `imageBase64` capture is stored. Currently `ScanResult` does NOT store `imageBase64` — the backend `ScanResult` type has no `imageBase64` field. The `thumbnailSummary` field stores a text summary. The `SessionHistory` thumbnail will use the text summary as a label (no base64 thumbnail needed from backend — the request's `imageBase64` storage requirement will be met by using the `thumbnailSummary` field creatively, since adding a new field to the backend Motoko type would require a breaking schema change and the existing type is sufficient for history display).

### Remove
- Nothing is removed — the sign-out button remains in both Dashboard and SectorView headers as it's part of existing flows. SettingsMenu provides an additional sign-out path.

## Implementation Plan

1. Backend: Confirm no changes needed — `saveScanResult`, `getScanResults`, `deleteScanResult` are present and complete.
2. Build `SessionHistory.tsx`: fetch all scan results via `actor.getScanResults()`, sort by timestamp descending, render scrollable card feed with sector badge, time, thumbnailSummary, truncated analysisText, and per-card delete button. Include "Clear All" option. Wire to `ActorContext`.
3. Build `SettingsMenu.tsx`: shadcn `Sheet` slide-over. Show truncated Principal ID with copy button. "Clear All History" destructive action (calls `deleteScanResult` for each). "Sign Out" button that calls the passed `onSignOut` handler.
4. Add shared `AppNavBar` to `App.tsx`: rendered above Dashboard and History views. Contains VERASLi branding, "HISTORY" button, "SETTINGS" button that opens `SettingsMenu`. Pass actor context into it so History view has the actor.
5. Update `App.tsx` `AppState` type, add `"history"` render case, wire `onGoToHistory` handler.
6. Wrap Dashboard and History views in `ActorContext.Provider` so SessionHistory can consume the actor.
7. Validate and deploy.
