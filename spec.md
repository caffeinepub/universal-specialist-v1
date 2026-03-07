# VERASLi™ | Universal Specialist v2

## Current State

The app has five enterprise sector tabs (Healthcare, Technology, Education, Construction, Mechanics) with a Live Vision HUD in the Construction tab. Phase 1 of the scan pipeline calls the Ollama vision model directly from the browser via `fetch()` to `http://localhost:11434/api/generate` using the `llava` model. This is a fully client-side call. The backend `agenticScan` function is a stub that returns placeholder text and is only used for record-keeping calls after the frontend has already completed the vision analysis. The Motoko backend already imports the `http-outcalls/outcall.mo` module.

## Requested Changes (Diff)

### Add

- New Motoko function `visionScan(imageBase64: Text, prompt: Text, contextMode: Text)` that performs a server-side HTTPS POST outcall to `https://ollama.com/api/generate` with:
  - Header: `Authorization: Bearer YOUR_API_KEY_HERE`
  - Header: `Content-Type: application/json`
  - Body: `{ "model": "llama3.2-vision", "prompt": "<prompt>", "images": ["<imageBase64>"], "stream": false }`
  - Returns `Text` (the raw JSON response from Ollama Cloud)
- New type `VisionScanResult` exposed to frontend: `{ response: Text; contextMode: Text; timestamp: Int }`

### Modify

- `main.mo`: Import and use `outcall.mo`'s `httpPostRequest` for the new `visionScan` function. The Bearer API key is hardcoded as a placeholder constant `OLLAMA_API_KEY`.
- `LiveVisionHUD.tsx` (Phase 1): Replace the direct browser `fetch()` to localhost Ollama with a call to `actor.visionScan(base64, prompt, contextMode)`. Parse the returned JSON string client-side the same way as before (`data.response`). All downstream logic (JSON parse for detected_mode, sector lock, Phase 2 web search) remains unchanged.
- Update `backend.d.ts` to expose `visionScan` method signature.
- Update the HUD status label for Phase 1 from "Identifying via LLaVA..." to "Identifying via Ollama Cloud..." to reflect the new routing.

### Remove

- The direct `fetch()` call to `${endpoint}/api/generate` (the localhost Ollama call) in `captureAndScan()`.
- The `localStorage.getItem("verasli_ollama_endpoint")` lookup (no longer needed for Phase 1 since the call is now server-side).

## Implementation Plan

1. Update `main.mo`: add `OLLAMA_API_KEY` constant, add `VisionScanResult` type, add `visionScan` public shared function that calls `OutCall.httpPostRequest` to `https://ollama.com/api/generate` with the Authorization header, prompt, and base64 image.
2. Update `backend.d.ts`: add `visionScan` function signature.
3. Update `LiveVisionHUD.tsx`: in `captureAndScan()`, replace the Phase 1 browser fetch block with `const rawJson = await actor.visionScan(base64, prompt, contextMode)` and parse `rawJson` as `{ response?: string }`. Update the phase label to say "Ollama Cloud". Remove the `endpoint` localStorage lookup.
