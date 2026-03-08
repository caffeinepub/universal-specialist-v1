# VERASLi Universal Specialist v2

## Current State
The app has a Live Vision HUD that routes Phase 1 scans through `actor.visionScan()` (Motoko HTTPS outcall to Ollama Cloud). The backend has a try/catch that returns an error JSON string on failure. The frontend checks for `"error"` in the response and throws, then the catch block surfaces the message. No direct fetch calls to Ollama exist in the frontend.

**Root issue identified:** The backend error JSON encoding can break with special characters in the error message (unescaped quotes, colons). The frontend catch block uses `err.message` which for ICP actor rejections may be an opaque rejection code rather than the full message string. This causes "Failed to fetch"-style generic errors.

## Requested Changes (Diff)

### Add
- Nothing new.

### Modify
- **Backend (main.mo)**: Harden the `visionScan` try/catch to safely escape the error message before embedding it in JSON (replace quotes and backslashes). Also include the HTTP status code from the response body when available. Return `{"error":"<safe-message>","status":"<code>"}` format.
- **Frontend (LiveVisionHUD.tsx)**: In the Phase 1 catch block, replace `err.message` fallback with `err instanceof Error ? (err.message || String(err)) : String(err)` to ensure the full ICP rejection reason is surfaced. Also add a console.error for diagnostics. Confirm no `fetch('https://ollama.com/...')` calls exist anywhere in the file.

### Remove
- Nothing.

## Implementation Plan
1. Fix backend: safely escape the error message string before JSON serialization in visionScan.
2. Fix frontend: update catch block to use `String(err)` as the final fallback so the raw ICP rejection appears on the HUD.
3. Validate (typecheck + build).
4. Deploy.
