import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Loader2,
  ScanLine,
  Search,
  Trash2,
  VideoOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ScanResult, SearchResult } from "../backend";
import { useActorContext } from "../context/ActorContext";
import {
  ALL_SECTOR_IDS,
  getSectorAccent,
  getSectorLabel,
} from "../data/taxonomy";

// ─── Types ────────────────────────────────────────────────────────────────────

type CameraState = "idle" | "requesting" | "granted" | "denied";
type ScanState =
  | "idle"
  | "detecting"
  | "identifying"
  | "searching"
  | "synthesizing"
  | "success"
  | "error";

export interface LiveVisionHUDProps {
  contextMode: string;
  onSectorDetected?: (sector: string) => void;
}

// ─── Context Prompts ──────────────────────────────────────────────────────────

/**
 * Returns a prompt that instructs the model to respond ONLY with a JSON object:
 * { "detected_mode": "<sector-id>", "image_description": "..." }
 */
function getIdentificationPrompt(): string {
  return `You are an autonomous sector identification specialist. Analyze the image and determine which enterprise sector it belongs to.

Return ONLY a valid JSON object with exactly these two fields:
{
  "detected_mode": "<sector-id>",
  "image_description": "<detailed description>"
}

The "detected_mode" field MUST be one of these exact sector IDs:
- "construction" — building sites, scaffolding, PPE, hard hats, safety vests, concrete, steel beams, blueprints, cranes, power tools
- "advanced-manufacturing" — CNC machines, robots, assembly lines, precision equipment, industrial machinery, factory floors
- "supply-chain-transportation" — trucks, warehouses, logistics, freight, shipping containers, fleet vehicles, cargo
- "energy-natural-resources" — power plants, solar panels, oil rigs, wind turbines, pipelines, mining equipment, extraction
- "agriculture" — crops, fields, tractors, irrigation, livestock, greenhouses, farm equipment, soil analysis
- "public-service-safety" — police, fire stations, emergency responders, government buildings, law enforcement, civil services
- "healthcare-human-services" — medical equipment, hospitals, clinical tools, patients, doctors, nurses, lab instruments
- "education" — classrooms, textbooks, whiteboards, students, teachers, academic materials, learning environments
- "marketing-sales" — retail displays, product promotions, advertising, customer-facing environments, brand signage
- "digital-technology" — computers, servers, circuit boards, code, data centers, network hardware, tech devices
- "management-entrepreneurship" — office environments, business meetings, corporate settings, strategy boards
- "financial-services" — banks, financial terminals, trading floors, accounting materials, investment documents
- "arts-entertainment-design" — studios, creative workspaces, art galleries, performance venues, design tools, media production
- "hospitality-events-tourism" — hotels, restaurants, event venues, tourism sites, guest service areas

The "image_description" field should be a detailed technical breakdown of what you observe.

Respond with ONLY the JSON object. No explanation, no preamble, no markdown.`;
}

function getContextSuffix(contextMode: string): string {
  switch (contextMode) {
    case "construction":
      return "OSHA safety code building specification structural";
    case "advanced-manufacturing":
      return "CNC machining robotics precision engineering spec";
    case "supply-chain-transportation":
      return "logistics fleet compliance DOT freight operations";
    case "energy-natural-resources":
      return "power systems sustainability extraction compliance";
    case "agriculture":
      return "crop science equipment irrigation food systems";
    case "public-service-safety":
      return "emergency response NFPA law enforcement civil safety";
    case "healthcare-human-services":
      return "clinical protocol medical diagnosis treatment compliance";
    case "education":
      return "curriculum academic standard compliance assessment";
    case "marketing-sales":
      return "brand strategy analytics customer engagement retail";
    case "digital-technology":
      return "technical documentation API specification engineering";
    case "management-entrepreneurship":
      return "operations strategy business development KPI";
    case "financial-services":
      return "accounting investment compliance regulatory finance";
    case "arts-entertainment-design":
      return "creative production UX media design standards";
    case "hospitality-events-tourism":
      return "event operations guest experience venue compliance";
    default:
      return "technical specifications manual compliance";
  }
}

// ─── Search Query Builder ─────────────────────────────────────────────────────

const FILLER_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "can",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "there",
  "their",
  "they",
  "any",
  "some",
  "i",
  "visible",
  "image",
  "shows",
  "showing",
  "appears",
  "appear",
  "note",
  "potential",
  "possible",
  "also",
  "see",
  "look",
  "looks",
  "output",
]);

function buildSearchQuery(
  imageDescription: string,
  contextMode: string,
): string {
  const suffix = getContextSuffix(contextMode);
  const raw = imageDescription.slice(0, 120);
  const words = raw
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !FILLER_WORDS.has(w.toLowerCase()));
  const keyTerms = words.slice(0, 12).join(" ");
  const query = `${keyTerms} ${suffix}`.trim().slice(0, 150);
  return query;
}

// ─── DuckDuckGo Search ────────────────────────────────────────────────────────

interface ParsedResult {
  title: string;
  snippet: string;
  url: string;
}

interface DDGRelatedTopic {
  Text?: string;
  FirstURL?: string;
  Topics?: DDGRelatedTopic[];
}

interface DDGResponse {
  AbstractText?: string;
  AbstractURL?: string;
  RelatedTopics?: DDGRelatedTopic[];
}

async function duckDuckGoSearch(query: string): Promise<ParsedResult[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`DDG HTTP ${response.status}`);
  const data = (await response.json()) as DDGResponse;

  const results: ParsedResult[] = [];

  // Priority 1: AbstractText
  if (data.AbstractText && data.AbstractURL) {
    results.push({
      title: data.AbstractText.slice(0, 80),
      snippet: data.AbstractText,
      url: data.AbstractURL,
    });
  }

  // Priority 2: RelatedTopics (skip sub-topic groups)
  if (data.RelatedTopics) {
    for (const topic of data.RelatedTopics) {
      if (results.length >= 4) break;
      if (!topic.Text || !topic.FirstURL || topic.Topics) continue;
      results.push({
        title: topic.Text.slice(0, 80),
        snippet: topic.Text,
        url: topic.FirstURL,
      });
    }
  }

  return results.slice(0, 4);
}

function buildActionableSummary(
  query: string,
  results: ParsedResult[],
): string {
  if (results.length === 0) {
    return `SEARCH EXECUTED: ${query}\n\nNo indexed results returned. Try refining the scan or check connectivity.`;
  }
  const findings = results.map((r, i) => `${i + 1}. ${r.snippet}`).join("\n\n");
  return `QUERY: ${query}\n\nFINDINGS:\n${findings}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

async function compressFrameToBase64(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): Promise<string> {
  // Strictly enforce 600px max and JPEG quality 0.5 to stay under ICP's 2MB ingress limit
  const MAX_DIM = 600;
  const srcW = video.videoWidth || 640;
  const srcH = video.videoHeight || 480;
  const scale = Math.min(1, MAX_DIM / Math.max(srcW, srcH));
  canvas.width = Math.round(srcW * scale);
  canvas.height = Math.round(srcH * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
  return dataUrl.replace(/^data:image\/jpeg;base64,/, "");
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts);
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ─── Sector Lock Notification ─────────────────────────────────────────────────

interface SectorLockBadgeProps {
  sectorName: string;
  accent: string;
  visible: boolean;
}

function SectorLockBadge({
  sectorName,
  accent,
  visible,
}: SectorLockBadgeProps) {
  return (
    <div
      aria-live="polite"
      aria-label={visible ? `Context locked: ${sectorName}` : undefined}
      className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
      style={{
        transition: "opacity 0.35s ease, transform 0.35s ease",
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(-8px)",
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-data font-semibold tracking-widest uppercase border"
        style={{
          background: `oklch(${accent} / 0.12)`,
          borderColor: `oklch(${accent} / 0.4)`,
          color: `oklch(${accent})`,
          boxShadow: `0 2px 16px oklch(${accent} / 0.25)`,
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: `oklch(${accent})` }}
        />
        CONTEXT LOCKED: {sectorName}
      </div>
    </div>
  );
}

// ─── Phase Status Label ───────────────────────────────────────────────────────

function PhaseStatusLabel({
  state,
  accentColor,
}: {
  state: ScanState;
  accentColor: string;
}) {
  const color = accentColor;

  if (state === "detecting") {
    return (
      <div
        data-ocid="hud.loading_state"
        className="flex items-center gap-2 text-xs font-data"
        style={{ color }}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
        <span>PHASE 1 — AUTO-DETECTING ENVIRONMENT...</span>
      </div>
    );
  }
  if (state === "identifying") {
    return (
      <div
        data-ocid="hud.loading_state"
        className="flex items-center gap-2 text-xs font-data"
        style={{ color }}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
        <span>PHASE 1 — VISION SCAN: Identifying via Google Gemini...</span>
      </div>
    );
  }
  if (state === "searching") {
    return (
      <div
        data-ocid="hud.loading_state"
        className="flex items-center gap-2 text-xs font-data"
        style={{ color }}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
        <span>PHASE 2 — WEB SEARCH: Querying live data sources...</span>
      </div>
    );
  }
  if (state === "synthesizing") {
    return (
      <div
        data-ocid="hud.loading_state"
        className="flex items-center gap-2 text-xs font-data"
        style={{ color }}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
        <span>PHASE 3 — SYNTHESIS: Compiling actionable intelligence...</span>
      </div>
    );
  }
  return null;
}

// ─── Agentic Result Display ───────────────────────────────────────────────────

interface AgenticResultDisplayProps {
  summary: string;
  searchQuery: string;
  sources: ParsedResult[];
}

function AgenticResultDisplay({
  summary,
  searchQuery,
  sources,
}: AgenticResultDisplayProps) {
  const isAgenticResult = summary.startsWith("QUERY:");
  const displayText = isAgenticResult
    ? summary.split("\n\nFINDINGS:\n").slice(1).join("\n\nFINDINGS:\n") ||
      summary
    : summary;

  return (
    <div className="space-y-2">
      {/* Summary text */}
      <p className="text-white/90 text-xs font-data leading-relaxed line-clamp-4">
        {displayText}
      </p>

      {/* Query badge */}
      {searchQuery && (
        <div
          data-ocid="hud.search_query_display"
          className="flex items-start gap-1.5"
        >
          <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-data font-semibold bg-white/5 text-white/40 border border-white/10 select-none uppercase tracking-wider">
            QUERY
          </span>
          <span className="text-white/40 text-[10px] font-data leading-tight break-all">
            {searchQuery}
          </span>
        </div>
      )}

      {/* Source links */}
      {sources.length > 0 && (
        <div
          data-ocid="hud.sources_panel"
          className="flex flex-wrap gap-1.5 items-center"
        >
          <span className="text-white/30 text-[9px] font-data uppercase tracking-wider flex-shrink-0">
            [SRC]
          </span>
          {sources.slice(0, 3).map((src, idx) => (
            <a
              key={src.url}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid={`hud.source_link.${idx + 1}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white/50 hover:text-white/80 text-[9px] font-data transition-colors duration-150"
              title={src.title}
            >
              <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="max-w-[100px] truncate">
                {src.title.slice(0, 30) || "Source"}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Corner Bracket ───────────────────────────────────────────────────────────

interface CornerBracketProps {
  position: "tl" | "tr" | "bl" | "br";
  color?: string;
}

function CornerBracket({ position, color }: CornerBracketProps) {
  const posClass = {
    tl: "top-3 left-3",
    tr: "top-3 right-3",
    bl: "bottom-3 left-3",
    br: "bottom-3 right-3",
  }[position];

  const borderClass = {
    tl: "border-t border-l",
    tr: "border-t border-r",
    bl: "border-b border-l",
    br: "border-b border-r",
  }[position];

  return (
    <div
      className={`absolute ${posClass} w-6 h-6 ${borderClass} pointer-events-none`}
      style={{ borderColor: color ?? "oklch(1 0 0 / 0.2)" }}
      aria-hidden="true"
    />
  );
}

// ─── Scan History Item ────────────────────────────────────────────────────────

interface HistoryItemProps {
  result: ScanResult;
  index: number;
  onDelete: (id: string) => void;
}

function HistoryItem({ result, index, onDelete }: HistoryItemProps) {
  const [expanded, setExpanded] = useState(false);

  const isAgenticResult = result.analysisText.startsWith("QUERY:");
  let queryLine = "";
  let findingsText = result.analysisText;

  if (isAgenticResult) {
    const parts = result.analysisText.split("\n\nFINDINGS:\n");
    queryLine = parts[0].replace("QUERY: ", "").trim();
    findingsText = parts[1] ?? result.analysisText;
  }

  const isLong = findingsText.length > 200;
  const sectorLabel = getSectorLabel(result.contextMode);
  const sectorAccentRaw = getSectorAccent(result.contextMode);
  const badgeStyle = {
    background: `oklch(${sectorAccentRaw} / 0.12)`,
    color: `oklch(${sectorAccentRaw})`,
    borderColor: `oklch(${sectorAccentRaw} / 0.3)`,
  };

  return (
    <div
      data-ocid={`hud.history_item.${index}`}
      className="border border-border bg-card rounded-lg p-4 space-y-2 hover:bg-surface-raised transition-colors duration-150"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-data font-medium border select-none"
              style={badgeStyle}
            >
              [{sectorLabel}]
            </span>
            {isAgenticResult && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-data bg-muted/50 text-muted-foreground border border-border select-none">
                <Search className="w-2.5 h-2.5" />
                WEB SEARCH
              </span>
            )}
            <span className="text-muted-foreground text-[10px] font-data">
              {formatTimestamp(result.timestamp)}
            </span>
          </div>
          {result.thumbnailSummary && (
            <div className="text-xs font-medium text-muted-foreground mb-1 font-data">
              {result.thumbnailSummary}
            </div>
          )}
        </div>
        <button
          type="button"
          data-ocid={`hud.delete_button.${index}`}
          onClick={() => onDelete(result.id)}
          className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs text-destructive hover:bg-destructive/10 border border-destructive/30 hover:border-destructive/50 transition-colors duration-150 font-medium"
          aria-label="Delete scan result"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Query line (agentic results only) */}
      {isAgenticResult && queryLine && (
        <div className="flex items-start gap-1.5 pb-1 border-b border-border/50">
          <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-data font-semibold bg-muted/50 text-muted-foreground border border-border select-none uppercase tracking-wider">
            QUERY
          </span>
          <span className="text-muted-foreground text-[10px] font-data leading-tight break-all">
            {queryLine}
          </span>
        </div>
      )}

      {/* Analysis / findings text */}
      <div className="text-foreground/90 text-sm font-data leading-relaxed">
        <p className={!expanded && isLong ? "line-clamp-3" : ""}>
          {findingsText}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 flex items-center gap-1 text-primary text-xs hover:text-primary/80 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> Expand
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LiveVisionHUD({
  contextMode,
  onSectorDetected,
}: LiveVisionHUDProps) {
  // Consume actor from the global ActorContext (initialized at App level, bound to auth)
  const { actor, isActorReady, actorError } = useActorContext();

  // Camera state
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanResult, setScanResult] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sources, setSources] = useState<ParsedResult[]>([]);
  const [autoPulse, setAutoPulse] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomCaps, setZoomCaps] = useState({ min: 1, max: 1, step: 0.1 });
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("verasli_web_search");
    return stored !== null ? stored === "true" : true;
  });

  // Sector detection state
  const [detectedSector, setDetectedSector] = useState<string>(contextMode);
  const [sectorLocked, setSectorLocked] = useState(false);

  // History
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sectorLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive accent from detected sector (falls back to contextMode, then construction)
  const activeSector = detectedSector || contextMode;
  const accentValues = getSectorAccent(activeSector);
  const accentColor = `oklch(${accentValues})`;
  const sectorDisplayName = getSectorLabel(activeSector);

  // Persist web search toggle
  const handleWebSearchToggle = (value: boolean) => {
    setWebSearchEnabled(value);
    localStorage.setItem("verasli_web_search", value.toString());
  };

  // ── Torch / Flash control ────────────────────────────────────────────────────

  const toggleTorch = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (!stream) {
        alert("Camera must be active to control flash.");
        return;
      }
      const track = stream.getVideoTracks()[0];
      if (!track) return;
      // Check torch capability (torch is not in the standard TS typings)
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
        torch?: boolean;
      };
      if (!capabilities.torch) {
        alert("Flash not supported on this browser.");
        return;
      }
      const newState = !isTorchOn;
      await track.applyConstraints({
        advanced: [{ torch: newState } as MediaTrackConstraintSet],
      });
      setIsTorchOn(newState);
    } catch {
      alert("Flash not supported on this browser.");
    }
  };

  // ── Zoom control ─────────────────────────────────────────────────────────────

  const handleZoom = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setZoomLevel(val);
    if (videoRef.current?.srcObject) {
      const track = (
        videoRef.current.srcObject as MediaStream
      ).getVideoTracks()[0];
      if (track) {
        try {
          await track.applyConstraints({
            advanced: [{ zoom: val } as MediaTrackConstraintSet],
          });
        } catch {
          // Zoom constraint not supported — silently ignore
        }
      }
    }
  };

  // ── Load history ────────────────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    if (!actor) return;
    setHistoryLoading(true);
    try {
      const results = await actor.getScanResults();
      const sectorResults = results.filter(
        (r) =>
          r.contextMode === contextMode ||
          r.contextMode === detectedSector ||
          // Include legacy mode names for backward compatibility
          r.contextMode === "environmental-command",
      );
      setHistory(
        [...sectorResults].sort((a, b) =>
          b.timestamp > a.timestamp ? 1 : b.timestamp < a.timestamp ? -1 : 0,
        ),
      );
    } catch {
      // silently fail
    } finally {
      setHistoryLoading(false);
    }
  }, [actor, contextMode, detectedSector]);

  useEffect(() => {
    if (actor && isActorReady) {
      void loadHistory();
    }
  }, [actor, isActorReady, loadHistory]);

  // Cleanup sector lock timer on unmount
  useEffect(() => {
    return () => {
      if (sectorLockTimerRef.current) {
        clearTimeout(sectorLockTimerRef.current);
      }
    };
  }, []);

  // ── Camera activation ───────────────────────────────────────────────────────

  const activateCamera = async () => {
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Check hardware capabilities (torch + zoom)
      const track = stream.getVideoTracks()[0];
      if (track) {
        const caps = track.getCapabilities() as MediaTrackCapabilities & {
          torch?: boolean;
          zoom?: { min: number; max: number; step: number };
        };
        if (caps.zoom) {
          setZoomCaps({
            min: caps.zoom.min,
            max: caps.zoom.max,
            step: caps.zoom.step,
          });
          setZoomLevel(caps.zoom.min);
        }
      }

      setCameraState("granted");
    } catch {
      setCameraState("denied");
    }
  };

  // ── Frame capture & agentic scan ─────────────────────────────────────────────

  const captureAndScan = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    // Compress frame and extract raw base64
    let base64: string;
    try {
      base64 = await compressFrameToBase64(video, canvas);
    } catch {
      setScanState("error");
      setScanResult("CAPTURE FAILED — Could not read camera frame.");
      return;
    }

    setScanState("detecting");
    setScanResult("");
    setSearchQuery("");
    setSources([]);

    // ── Phase 1: Vision Identification via Motoko backend proxy (CORS bypass) ──
    let imageDescription = "";
    let resolvedMode = contextMode;

    if (!actor) {
      setScanState("error");
      setScanResult("PHASE 1 FAILED — Actor not ready. Please wait and retry.");
      return;
    }

    try {
      setScanState("detecting");

      // Route through backend canister to bypass browser CORS block
      const rawResponse = await actor.visionScan(
        base64,
        getIdentificationPrompt(),
        contextMode,
      );

      // ── Parse Gemini response ────────────────────────────────────────────────────
      // The backend returns either:
      //   (a) Raw Gemini JSON: {"candidates":[{"content":{"parts":[{"text":"..."}]}},...]}
      //   (b) JSON-wrapped error from backend catch: {"error":"Vision scan failed: ..."}
      //   (c) Plain error prefix: "VISION SCAN FAILED: ..." or "GEMINI API ERROR: ..."
      //   (d) Already-extracted plain text (future: when backend parser is active)

      setScanState("identifying");

      // ── extractGeminiText ────────────────────────────────────────────────────
      // Fault-tolerant parser for all backend response shapes.
      //
      // Strategy (mirrors the Motoko character-walking approach):
      //   1. Handle plain error prefix strings immediately.
      //   2. Try JSON.parse for structured payloads (Gemini envelope or errors).
      //      If JSON.parse fails the body is already plain text.
      //   3. Inside JSON, walk `candidates[*].content.parts[*].text` collecting
      //      the first non-empty string.
      //   4. Fallback: character-walk the raw string looking for the literal
      //      key sequence `"text"` and extract its quoted value — this catches
      //      cases where JSON.parse itself might fail on a large body with
      //      embedded escape sequences.
      //   5. NEVER throw a generic message; always surface the real error text.
      const extractGeminiText = (raw: string): string => {
        // ── Case A: plain error prefix strings ─────────────────────────────────
        if (
          raw.startsWith("VISION SCAN FAILED:") ||
          raw.startsWith("GEMINI API ERROR:")
        ) {
          throw new Error(raw);
        }

        // ── Case B: try structured JSON parse ──────────────────────────────────
        let parsed: unknown = null;
        let jsonParseOk = false;
        try {
          parsed = JSON.parse(raw);
          jsonParseOk = true;
        } catch {
          // Not valid JSON — fall through to character-walk below
        }

        if (jsonParseOk && typeof parsed === "object" && parsed !== null) {
          const obj = parsed as Record<string, unknown>;

          // Case B1: JSON-wrapped backend error {"error":"Vision scan failed: ..."}
          if (typeof obj.error === "string") {
            throw new Error(obj.error as string);
          }

          // Case B2: Gemini nested error object
          // e.g. {"error":{"code":429,"message":"Resource exhausted","status":"..."}}
          if (typeof obj.error === "object" && obj.error !== null) {
            const errObj = obj.error as Record<string, unknown>;
            const msg =
              typeof errObj.message === "string"
                ? errObj.message
                : JSON.stringify(errObj);
            throw new Error(`GEMINI API ERROR: ${msg}`);
          }

          // Case B3: Gemini generateContent envelope
          // candidates[0].content.parts[0..n].text — collect first non-empty
          try {
            const candidates = obj.candidates as
              | Array<{
                  content?: { parts?: Array<{ text?: string }> };
                  finishReason?: string;
                }>
              | undefined;

            if (Array.isArray(candidates)) {
              for (const candidate of candidates) {
                const parts = candidate?.content?.parts;
                if (!Array.isArray(parts)) continue;
                for (const part of parts) {
                  if (
                    typeof part?.text === "string" &&
                    part.text.trim().length > 0
                  ) {
                    return part.text;
                  }
                }
              }
            }
          } catch {
            // malformed candidates structure — fall through
          }

          // Case B4: Ollama legacy formats
          const ollamaMsg = (obj as { message?: { content?: string } })?.message
            ?.content;
          const ollamaResp = (obj as { response?: string })?.response;
          if (typeof ollamaMsg === "string" && ollamaMsg.trim().length > 0)
            return ollamaMsg;
          if (typeof ollamaResp === "string" && ollamaResp.trim().length > 0)
            return ollamaResp;

          // Case B5: JSON parsed but no recognised text field found —
          // stringify what we have so the user sees something useful
          return JSON.stringify(obj).slice(0, 500);
        }

        // ── Case C: character-walk fallback ────────────────────────────────────
        // JSON.parse failed (e.g. truncated/malformed body) or body is plain text.
        // Walk the raw string looking for the literal key `"text"` up to 5 times.
        const charWalk = (s: string): string | null => {
          const KEY = '"text"';
          let searchFrom = 0;
          for (let attempt = 0; attempt < 5; attempt++) {
            const keyIdx = s.indexOf(KEY, searchFrom);
            if (keyIdx === -1) break;

            let p = keyIdx + KEY.length;

            // Skip whitespace
            while (p < s.length && " \n\r\t".includes(s[p])) p++;

            // Expect ':'
            if (p >= s.length || s[p] !== ":") {
              searchFrom = keyIdx + 1;
              continue;
            }
            p++;

            // Skip whitespace
            while (p < s.length && " \n\r\t".includes(s[p])) p++;

            // Expect opening '"'
            if (p >= s.length || s[p] !== '"') {
              searchFrom = keyIdx + 1;
              continue;
            }
            p++;

            // Walk the string value honouring escape sequences
            let value = "";
            let closed = false;
            while (p < s.length) {
              const c = s[p];
              if (c === '"') {
                closed = true;
                p++;
                break;
              }
              if (c === "\\") {
                p++;
                if (p >= s.length) break;
                const esc = s[p];
                const ESCAPES: Record<string, string> = {
                  n: "\n",
                  r: "\r",
                  t: "\t",
                  '"': '"',
                  "\\": "\\",
                  "/": "/",
                };
                value += esc in ESCAPES ? ESCAPES[esc] : esc;
                p++;
                continue;
              }
              value += c;
              p++;
            }

            if (closed && value.trim().length > 0) return value;
            searchFrom = keyIdx + 1;
          }
          return null;
        };

        const walked = charWalk(raw);
        if (walked !== null) return walked;

        // ── Case D: truly plain text or unrecognised format ────────────────────
        return raw;
      };

      const contentStr = extractGeminiText(rawResponse);

      // Strip markdown code fences if model wrapped JSON in them
      const cleaned = contentStr
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();

      // Try to parse sector JSON from the content
      try {
        const sectorJson = JSON.parse(cleaned) as {
          detected_mode?: string;
          image_description?: string;
        };

        if (
          sectorJson.detected_mode &&
          ALL_SECTOR_IDS.includes(sectorJson.detected_mode.toLowerCase())
        ) {
          resolvedMode = sectorJson.detected_mode.toLowerCase();
          imageDescription = sectorJson.image_description ?? cleaned;

          setDetectedSector(resolvedMode);
          setSectorLocked(true);
          if (sectorLockTimerRef.current)
            clearTimeout(sectorLockTimerRef.current);
          sectorLockTimerRef.current = setTimeout(() => {
            setSectorLocked(false);
            sectorLockTimerRef.current = null;
          }, 2000);
          onSectorDetected?.(resolvedMode);

          await new Promise<void>((resolve) => setTimeout(resolve, 2000));
        } else {
          imageDescription = sectorJson.image_description ?? cleaned;
        }
      } catch {
        // Content is plain text, not sector JSON — use directly
        imageDescription = cleaned || "No response from model.";
      }
    } catch (err: unknown) {
      setScanState("error");
      // Always surface the exact error — never swallow or replace with a generic message.
      // String(err) covers Error objects, ICP reject strings, and plain values alike.
      let msg: string;
      if (err instanceof Error) {
        // If message is the useless browser "Failed to fetch", include the full
        // toString() which may contain more context (e.g. TypeError: Failed to fetch)
        msg =
          err.message && err.message !== "Failed to fetch"
            ? err.message
            : `${err.name}: ${err.message} — ICP canister HTTPS outcall may have failed. Check API key and endpoint in backend.`;
      } else {
        msg = String(err);
      }
      console.error("[VERASLi] Phase 1 visionScan error:", err);
      setScanResult(`PHASE 1 FAILED: ${msg}`);
      return;
    }

    // If web search is disabled, save vision-only result
    if (!webSearchEnabled) {
      setScanResult(imageDescription);
      setScanState("synthesizing");

      if (actor) {
        const scanRecord: ScanResult = {
          id: generateId(),
          contextMode: resolvedMode,
          analysisText: imageDescription,
          timestamp: BigInt(Date.now()),
          thumbnailSummary: `Vision scan [${getSectorLabel(resolvedMode)}] — ${new Date().toLocaleTimeString()}`,
        };
        try {
          await actor.saveScanResult(scanRecord);
          await loadHistory();
        } catch {
          // non-fatal
        }
      }

      setScanState("success");
      return;
    }

    // ── Phase 2: Agentic Web Search ───────────────────────────────────────────
    setScanState("searching");
    const query = buildSearchQuery(imageDescription, resolvedMode);
    setSearchQuery(query);

    let parsedResults: ParsedResult[] = [];
    let webSearchFailed = false;

    try {
      parsedResults = await duckDuckGoSearch(query);
    } catch {
      webSearchFailed = true;
    }

    // ── Phase 3: Synthesis ────────────────────────────────────────────────────
    setScanState("synthesizing");

    let actionableSummary: string;
    if (webSearchFailed) {
      actionableSummary = `${imageDescription}\n\nWEB SEARCH UNAVAILABLE — Showing vision-only analysis.`;
    } else {
      actionableSummary = buildActionableSummary(query, parsedResults);
    }

    setScanResult(actionableSummary);
    setSources(parsedResults);

    // Call backend agenticScan for record-keeping
    if (actor) {
      try {
        await actor.agenticScan(imageDescription, resolvedMode);
      } catch {
        // non-fatal
      }

      const backendSources: SearchResult[] = parsedResults.map((r) => ({
        url: r.url,
        title: r.title,
        snippet: r.snippet,
      }));

      const scanRecord: ScanResult = {
        id: generateId(),
        contextMode: resolvedMode,
        analysisText: actionableSummary,
        timestamp: BigInt(Date.now()),
        thumbnailSummary: webSearchFailed
          ? `Vision-only scan [${getSectorLabel(resolvedMode)}] — ${new Date().toLocaleTimeString()}`
          : `Agentic scan (${backendSources.length} sources) [${getSectorLabel(resolvedMode)}] — ${new Date().toLocaleTimeString()}`,
      };

      try {
        await actor.saveScanResult(scanRecord);
        await loadHistory();
      } catch {
        // non-fatal — result still displayed
      }
    }

    setScanState("success");
  }, [contextMode, webSearchEnabled, loadHistory, actor, onSectorDetected]);

  // ── Auto-pulse interval ──────────────────────────────────────────────────────

  useEffect(() => {
    if (autoPulse && cameraState === "granted") {
      intervalRef.current = setInterval(() => {
        void captureAndScan();
      }, 5000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoPulse, cameraState, captureAndScan]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) {
          t.stop();
        }
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // ── Re-assign srcObject when camera is granted (handles late-mounted ref) ────

  useEffect(() => {
    if (cameraState === "granted" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraState]);

  // ── Delete history item ──────────────────────────────────────────────────────

  const handleDeleteResult = async (id: string) => {
    if (!actor) return;
    try {
      await actor.deleteScanResult(id);
      setHistory((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // silently fail
    }
  };

  // Determine if currently scanning (any active phase)
  const isScanning =
    scanState === "detecting" ||
    scanState === "identifying" ||
    scanState === "searching" ||
    scanState === "synthesizing";

  // ─── Render: idle ────────────────────────────────────────────────────────────

  if (cameraState === "idle") {
    return (
      <div
        data-ocid="hud.panel"
        className="boot-in flex flex-col items-center justify-center px-6"
        style={{ minHeight: "calc(100vh - 112px)" }}
      >
        {/* Icon */}
        <div className="mb-6 relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 40% 35%, oklch(0.28 0.012 250), oklch(0.15 0.006 250))",
              boxShadow: `0 0 0 1px oklch(var(--border)), 0 0 32px ${accentColor.replace(")", " / 0.12)")}`,
            }}
          >
            <Eye className="w-9 h-9" style={{ color: accentColor }} />
          </div>
          {/* Outer pulse ring decoration */}
          <div
            className="absolute inset-0 rounded-full border"
            style={{
              transform: "scale(1.3)",
              borderColor: accentColor.replace(")", " / 0.2)"),
            }}
            aria-hidden="true"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
          LIVE VISION HUD
        </h1>
        <p className="text-muted-foreground text-sm mb-2 font-data">
          Autonomous Sector Detection Module
        </p>
        <div className="flex items-center gap-2 mb-4">
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-data font-medium border select-none"
            style={{
              background: accentColor.replace(")", " / 0.1)"),
              color: accentColor,
              borderColor: accentColor.replace(")", " / 0.2)"),
            }}
          >
            [{getSectorLabel(contextMode)}]
          </span>
          <span className="text-muted-foreground text-xs font-data">
            Google Gemini Vision API :: Backend Proxy
          </span>
        </div>
        <div className="flex items-center gap-2 mb-8">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-data font-medium bg-muted/50 text-muted-foreground border border-border select-none">
            <Search className="w-2.5 h-2.5" />
            {webSearchEnabled ? "WEB SEARCH: ON" : "WEB SEARCH: OFF"}
          </span>
        </div>

        {/* Activate button */}
        <button
          type="button"
          data-ocid="hud.activate_button"
          onClick={() => void activateCamera()}
          className="flex items-center gap-2.5 px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          style={{
            background: accentColor,
            color: "oklch(0.1 0 0)",
            boxShadow: `0 4px 20px ${accentColor.replace(")", " / 0.3)")}`,
          }}
        >
          <ScanLine className="w-4 h-4" />
          ACTIVATE CAMERA
        </button>

        {/* Disclaimer */}
        <p className="mt-5 text-muted-foreground text-xs text-center max-w-xs leading-relaxed">
          This module accesses your device camera. Rear-facing camera will be
          preferred when available. Sector is auto-detected from the image.
        </p>

        {/* Scan history below */}
        <div className="w-full max-w-2xl mt-12">
          <ScanHistorySection
            history={history}
            loading={historyLoading}
            onDelete={handleDeleteResult}
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-muted-foreground text-xs text-center">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors duration-150 underline underline-offset-2"
          >
            Built with ♥ using caffeine.ai
          </a>
        </footer>
      </div>
    );
  }

  // ─── Render: requesting ───────────────────────────────────────────────────────

  if (cameraState === "requesting") {
    return (
      <div
        data-ocid="hud.panel"
        className="flex flex-col items-center justify-center gap-4 px-6"
        style={{ minHeight: "calc(100vh - 112px)" }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: accentColor }}
        />
        <p className="text-foreground font-data text-sm">
          Requesting camera access...
        </p>
        <p className="text-muted-foreground text-xs text-center max-w-xs">
          Please allow camera access in your browser prompt.
        </p>
      </div>
    );
  }

  // ─── Render: denied ───────────────────────────────────────────────────────────

  if (cameraState === "denied") {
    return (
      <div
        data-ocid="hud.panel"
        className="flex flex-col items-center justify-center px-6"
        style={{ minHeight: "calc(100vh - 112px)" }}
      >
        <div
          data-ocid="hud.error_state"
          className="border border-destructive/30 bg-destructive/5 rounded-lg p-8 max-w-md w-full text-center space-y-4"
        >
          <VideoOff className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-foreground font-semibold text-lg">
            Camera Access Denied
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The Live Vision HUD requires camera access to function. Please
            enable camera permissions in your browser settings and try again.
          </p>
          <div className="bg-surface-raised border border-border rounded px-4 py-3 text-left">
            <p className="text-muted-foreground text-xs font-data leading-relaxed">
              Chrome / Edge: Settings → Privacy → Camera → Allow
              <br />
              Firefox: Address bar lock icon → Permissions → Camera
              <br />
              Safari: Preferences → Websites → Camera
            </p>
          </div>
          <button
            type="button"
            data-ocid="hud.retry_button"
            onClick={() => void activateCamera()}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            style={{
              background: accentColor,
              color: "oklch(0.1 0 0)",
            }}
          >
            <ScanLine className="w-4 h-4" />
            RETRY CAMERA ACCESS
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: granted (main HUD view) ─────────────────────────────────────────

  return (
    <div data-ocid="hud.panel" className="flex flex-col">
      {/* ── Video container ──────────────────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden bg-black"
        style={{ height: "calc(100vh - 112px)" }}
      >
        {/* Live video */}
        <video
          ref={videoRef}
          data-ocid="hud.video_feed"
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            backgroundColor: "#000",
            minWidth: 0,
            minHeight: 0,
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          }}
          aria-label="Live camera feed"
        />

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Corner brackets — tactical HUD effect with sector accent */}
        <CornerBracket
          position="tl"
          color={accentColor.replace(")", " / 0.5)")}
        />
        <CornerBracket
          position="tr"
          color={accentColor.replace(")", " / 0.5)")}
        />
        <CornerBracket
          position="bl"
          color={accentColor.replace(")", " / 0.5)")}
        />
        <CornerBracket
          position="br"
          color={accentColor.replace(")", " / 0.5)")}
        />

        {/* Sector lock notification — slides in briefly then fades */}
        <SectorLockBadge
          sectorName={sectorDisplayName}
          accent={accentValues}
          visible={sectorLocked}
        />

        {/* Pulse ring when auto-monitoring is active */}
        {autoPulse && (
          <div
            className="absolute top-4 right-4 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <div
              className="absolute w-3.5 h-3.5 rounded-full opacity-80"
              style={{ background: accentColor }}
            />
            <div
              className="w-3.5 h-3.5 rounded-full border-2 hud-pulse-ring"
              style={{
                borderColor: accentColor,
                boxShadow: `0 0 8px ${accentColor.replace(")", " / 0.6)")}`,
              }}
            />
          </div>
        )}

        {/* Scan sweep animation */}
        {isScanning && (
          <div
            className="absolute left-0 right-0 h-px hud-scan-sweep pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${accentColor.replace(")", " / 0.6)")}, transparent)`,
            }}
            aria-hidden="true"
          />
        )}

        {/* ── Top HUD bar ────────────────────────────────────────────── */}
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 bg-black/40 backdrop-blur-sm border-b border-white/10"
          style={{ pointerEvents: "auto", zIndex: 9998 }}
        >
          {/* Left: status label */}
          <div className="flex items-center gap-2.5">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: accentColor }}
              aria-hidden="true"
            />
            <span
              className="text-xs font-data font-medium tracking-widest uppercase"
              style={{ color: accentColor }}
            >
              {sectorDisplayName} :: VISION ACTIVE
            </span>
            {autoPulse && (
              <span
                className="flex items-center gap-1 text-[10px] font-data"
                style={{ color: accentColor }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full hud-blink"
                  style={{ background: accentColor }}
                />
                AUTO-PULSE
              </span>
            )}
            {webSearchEnabled && (
              <span className="flex items-center gap-1 text-white/50 text-[10px] font-data">
                <Search className="w-2.5 h-2.5" />
                WEB
              </span>
            )}
          </div>

          {/* Right: toggles */}
          <div className="flex items-center gap-4">
            {/* Web Search toggle */}
            <div className="flex items-center gap-2">
              <Label
                htmlFor="web-search-toggle"
                className="text-white/70 text-xs font-data cursor-pointer select-none"
              >
                WEB SEARCH
              </Label>
              <Switch
                id="web-search-toggle"
                data-ocid="hud.web_search_toggle"
                checked={webSearchEnabled}
                onCheckedChange={handleWebSearchToggle}
                aria-label="Toggle web search"
              />
            </div>

            {/* Auto-pulse toggle */}
            <div className="flex items-center gap-2">
              <Label
                htmlFor="auto-pulse-toggle"
                className="text-white/70 text-xs font-data cursor-pointer select-none"
              >
                AUTO-PULSE
              </Label>
              <Switch
                id="auto-pulse-toggle"
                data-ocid="hud.auto_pulse_toggle"
                checked={autoPulse}
                onCheckedChange={(v) => setAutoPulse(v)}
                aria-label="Toggle continuous monitoring"
              />
            </div>
          </div>
        </div>

        {/* ── Zoom slider (right side, hardware zoom only) ───────── */}
        {zoomCaps.max > 1 && (
          <div
            className="absolute right-3 flex flex-col items-center gap-1.5"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 9998,
              pointerEvents: "auto",
            }}
            aria-label="Hardware zoom control"
          >
            <span
              className="text-[9px] font-data font-semibold tracking-widest uppercase select-none"
              style={{
                color: accentColor,
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              ZOOM
            </span>
            <input
              type="range"
              data-ocid="hud.zoom_slider"
              min={zoomCaps.min}
              max={zoomCaps.max}
              step={zoomCaps.step}
              value={zoomLevel}
              onChange={(e) => void handleZoom(e)}
              aria-label={`Zoom level: ${zoomLevel.toFixed(1)}x`}
              className="appearance-none cursor-pointer"
              style={{
                writingMode: "vertical-lr",
                direction: "rtl",
                width: "28px",
                height: "120px",
                background: `linear-gradient(to top, ${accentColor.replace(")", " / 0.7)")}, ${accentColor.replace(")", " / 0.15)")})`,
                borderRadius: "4px",
                outline: "none",
                border: `1px solid ${accentColor.replace(")", " / 0.3)")}`,
                WebkitAppearance: "slider-vertical",
              }}
            />
            <span
              className="text-[9px] font-data select-none"
              style={{ color: accentColor }}
            >
              {zoomLevel.toFixed(1)}x
            </span>
          </div>
        )}

        {/* ── Bottom HUD bar (results + scan button) ──────────────── */}
        <div
          data-ocid="hud.result_overlay"
          className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-black/60 backdrop-blur-md border-t border-white/10"
          style={{ pointerEvents: "none" }}
        >
          {/* Phase status / result display */}
          <div className="mb-3 min-h-[3rem]">
            {/* Scanning phases */}
            {isScanning && (
              <PhaseStatusLabel state={scanState} accentColor={accentColor} />
            )}

            {/* Success: agentic result */}
            {scanState === "success" &&
              scanResult &&
              (searchQuery ? (
                <AgenticResultDisplay
                  summary={scanResult}
                  searchQuery={searchQuery}
                  sources={sources}
                />
              ) : (
                <p className="text-white/90 text-xs font-data leading-relaxed line-clamp-4">
                  {scanResult}
                </p>
              ))}

            {/* Error */}
            {scanState === "error" && (
              <p
                data-ocid="hud.error_state"
                className="text-status-warning text-xs font-data"
              >
                {scanResult ||
                  "SCAN FAILED — Check Gemini API key in backend settings"}
              </p>
            )}

            {/* Idle */}
            {scanState === "idle" && (
              <p
                className="text-xs font-data italic"
                style={{
                  color: actorError
                    ? "oklch(0.72 0.2 25)"
                    : "oklch(1 0 0 / 0.3)",
                }}
              >
                {actorError
                  ? actorError
                  : !isActorReady || !actor
                    ? "Establishing connection to backend canister..."
                    : webSearchEnabled
                      ? "No analysis yet — tap INITIALIZE SCAN to begin agentic web search."
                      : "No analysis yet — tap INITIALIZE SCAN to begin (vision-only mode)."}
              </p>
            )}
          </div>

          {/* Scan button row */}
          <div
            className="flex items-center gap-3 flex-wrap"
            style={{ pointerEvents: "auto" }}
          >
            <button
              type="button"
              data-ocid="hud.scan_button"
              onClick={() => void captureAndScan()}
              disabled={isScanning || !isActorReady || !actor || !!actorError}
              className="flex items-center gap-2 px-4 py-2 rounded text-[11px] font-data font-semibold tracking-widest uppercase transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                position: "relative",
                zIndex: 9999,
                cursor:
                  isScanning || !isActorReady || !actor || !!actorError
                    ? "not-allowed"
                    : "pointer",
                pointerEvents: "auto",
                background: actorError
                  ? "oklch(0.55 0.18 25 / 0.25)"
                  : isScanning || !isActorReady || !actor
                    ? accentColor.replace(")", " / 0.25)")
                    : accentColor.replace(")", " / 0.9)"),
                color: actorError ? "oklch(0.72 0.2 25)" : "oklch(0.08 0 0)",
                boxShadow: `0 2px 12px ${accentColor.replace(")", " / 0.3)")}`,
                border: `1px solid ${actorError ? "oklch(0.55 0.18 25 / 0.4)" : accentColor.replace(")", " / 0.4)")}`,
              }}
            >
              {actorError ? (
                <>
                  <span className="w-3.5 h-3.5 flex-shrink-0 text-base leading-none">
                    ✕
                  </span>
                  BACKEND CONNECTION FAILED
                </>
              ) : !isActorReady || !actor ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  CONNECTING TO BACKEND...
                </>
              ) : isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {scanState === "detecting"
                    ? "DETECTING..."
                    : scanState === "identifying"
                      ? "IDENTIFYING..."
                      : scanState === "searching"
                        ? "SEARCHING..."
                        : "SYNTHESIZING..."}
                </>
              ) : (
                <>
                  <ScanLine className="w-3.5 h-3.5" />
                  {webSearchEnabled
                    ? "INITIALIZE SCAN + SEARCH"
                    : "INITIALIZE SCAN"}
                </>
              )}
            </button>

            {/* Torch / Flash toggle */}
            <button
              type="button"
              data-ocid="hud.torch_toggle"
              onClick={() => void toggleTorch()}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-[11px] font-data font-semibold tracking-widest uppercase transition-all duration-150 focus:outline-none focus-visible:ring-2"
              style={{
                position: "relative",
                zIndex: 9999,
                cursor: "pointer",
                pointerEvents: "auto",
                background: isTorchOn
                  ? "oklch(0.72 0.18 85 / 0.9)"
                  : "oklch(1 0 0 / 0.08)",
                color: isTorchOn ? "oklch(0.1 0 0)" : "oklch(1 0 0 / 0.7)",
                border: `1px solid ${isTorchOn ? "oklch(0.72 0.18 85 / 0.6)" : "oklch(1 0 0 / 0.15)"}`,
              }}
            >
              {isTorchOn ? "🔦 FLASH: ON" : "🔦 FLASH: OFF"}
            </button>

            {scanState === "success" && (
              <span
                className="text-[10px] font-data flex items-center gap-1.5"
                style={{ color: accentColor }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: accentColor }}
                />
                {searchQuery ? "AGENTIC SCAN COMPLETE" : "SCAN COMPLETE"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Scan history section ─────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto w-full">
        <ScanHistorySection
          history={history}
          loading={historyLoading}
          onDelete={handleDeleteResult}
        />

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-border text-muted-foreground text-xs">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors duration-150 underline underline-offset-2"
          >
            Built with ♥ using caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}

// ─── Scan History Section ─────────────────────────────────────────────────────

interface ScanHistorySectionProps {
  history: ScanResult[];
  loading: boolean;
  onDelete: (id: string) => void;
}

function ScanHistorySection({
  history,
  loading,
  onDelete,
}: ScanHistorySectionProps) {
  return (
    <section>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-data font-medium bg-muted text-muted-foreground border border-border select-none">
          [SYS]
        </span>
        <h2 className="text-sm font-semibold text-foreground">SCAN HISTORY</h2>
        <div className="flex-1 h-px bg-border" />
        {!loading && (
          <span className="text-muted-foreground text-[11px] font-data">
            {history.length} record{history.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div
          data-ocid="hud.loading_state"
          className="text-muted-foreground text-xs py-4 font-data"
        >
          Loading scan history...
        </div>
      ) : history.length === 0 ? (
        <div
          data-ocid="hud.history_empty_state"
          className="border border-dashed border-border rounded-lg text-muted-foreground text-sm py-10 px-6 text-center space-y-1"
        >
          <ScanLine className="w-6 h-6 mx-auto mb-2 opacity-30" />
          <p className="font-medium">No scans recorded.</p>
          <p className="text-xs">Initialize scan to begin.</p>
        </div>
      ) : (
        <div data-ocid="hud.history_list" className="space-y-3">
          {history.map((result, idx) => (
            <HistoryItem
              key={result.id}
              result={result}
              index={idx + 1}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
