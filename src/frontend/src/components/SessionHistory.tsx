import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  Loader2,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ScanResult } from "../backend";
import { useActorContext } from "../context/ActorContext";
import { getSectorAccent, getSectorLabel } from "../data/taxonomy";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(timestamp: bigint): string {
  return new Date(Number(timestamp)).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── History Card Item ────────────────────────────────────────────────────────

interface HistoryCardProps {
  result: ScanResult;
  index: number;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function HistoryCard({
  result,
  index,
  onDelete,
  isDeleting,
}: HistoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const accentRaw = getSectorAccent(result.contextMode);
  const accentColor = `oklch(${accentRaw})`;
  const sectorLabel = getSectorLabel(result.contextMode);

  const isAgenticResult = result.analysisText.startsWith("QUERY:");
  let findingsText = result.analysisText;
  let queryLine = "";

  if (isAgenticResult) {
    const parts = result.analysisText.split("\n\nFINDINGS:\n");
    queryLine = parts[0].replace("QUERY: ", "").trim();
    findingsText = parts[1] ?? result.analysisText;
  }

  const isLong = findingsText.length > 240;

  return (
    <div
      data-ocid={`history.item.${index}`}
      className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-border/80"
      style={{ boxShadow: "0 1px 8px oklch(0 0 0 / 0.2)" }}
    >
      {/* Card header */}
      <div className="flex items-start gap-3 px-4 py-3.5 border-b border-border/50">
        {/* Sector accent line */}
        <div
          className="flex-shrink-0 w-[3px] self-stretch rounded-full mt-0.5"
          style={{ background: accentColor }}
          aria-hidden="true"
        />

        {/* Sector badge + timestamp */}
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-data font-semibold tracking-wide border select-none flex-shrink-0"
            style={{
              background: `oklch(${accentRaw} / 0.1)`,
              color: accentColor,
              borderColor: `oklch(${accentRaw} / 0.28)`,
            }}
          >
            {sectorLabel}
          </span>

          {isAgenticResult && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-data border border-border bg-muted/50 text-muted-foreground select-none flex-shrink-0">
              <Search className="w-2.5 h-2.5" />
              AGENTIC SCAN
            </span>
          )}

          <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-data flex-shrink-0">
            <Clock className="w-2.5 h-2.5 flex-shrink-0" />
            <span>{formatTimestamp(result.timestamp)}</span>
          </div>
        </div>

        {/* Delete button */}
        <button
          type="button"
          data-ocid={`history.delete_button.${index}`}
          onClick={() => onDelete(result.id)}
          disabled={isDeleting}
          className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-destructive/25 text-destructive/70 hover:border-destructive/50 hover:bg-destructive/8 hover:text-destructive transition-all duration-150 text-xs font-medium outline-none focus-visible:ring-1 focus-visible:ring-destructive/50 disabled:opacity-50 disabled:pointer-events-none"
          aria-label={`Delete scan from ${sectorLabel}`}
        >
          {isDeleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
          <span className="hidden sm:inline text-[10px]">DELETE</span>
        </button>
      </div>

      {/* Card body */}
      <div className="px-4 py-3.5 space-y-2.5">
        {/* Thumbnail summary subtitle */}
        {result.thumbnailSummary && (
          <p className="text-muted-foreground text-xs font-data leading-snug">
            {result.thumbnailSummary}
          </p>
        )}

        {/* Query line for agentic scans */}
        {isAgenticResult && queryLine && (
          <div className="flex items-start gap-1.5">
            <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-data font-semibold bg-muted/50 text-muted-foreground border border-border select-none uppercase tracking-wider mt-0.5">
              QUERY
            </span>
            <span className="text-muted-foreground text-[10px] font-data leading-relaxed break-words">
              {queryLine}
            </span>
          </div>
        )}

        {/* Analysis text */}
        <div className="text-foreground/90 text-sm font-data leading-relaxed">
          <p className={!expanded && isLong ? "line-clamp-3" : ""}>
            {findingsText}
          </p>
          {isLong && (
            <button
              type="button"
              data-ocid={`history.show_more_button.${index}`}
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 flex items-center gap-1 text-primary text-xs hover:text-primary/80 transition-colors font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary/50 rounded"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show more
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div data-ocid="history.loading_state" className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card overflow-hidden animate-pulse"
        >
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50">
            <div className="w-[3px] h-5 rounded-full bg-muted flex-shrink-0" />
            <div className="flex gap-2 flex-1">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-28 rounded bg-muted" />
            </div>
            <div className="h-6 w-16 rounded bg-muted flex-shrink-0" />
          </div>
          <div className="px-4 py-3.5 space-y-2">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function HistoryEmptyState() {
  return (
    <div
      data-ocid="history.empty_state"
      className="flex flex-col items-center gap-4 py-20 text-center"
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center border border-border"
        style={{ background: "oklch(var(--surface-raised))" }}
      >
        <History className="w-6 h-6 text-muted-foreground" />
      </div>
      <div>
        <p
          className="text-foreground font-semibold text-sm"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          No scan history yet
        </p>
        <p className="text-muted-foreground text-xs font-data mt-1 leading-relaxed max-w-xs">
          Complete a visual scan in any sector to build your session history.
        </p>
      </div>
    </div>
  );
}

// ─── SessionHistory Props ─────────────────────────────────────────────────────

export interface SessionHistoryProps {
  principalId: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

// ─── SessionHistory ───────────────────────────────────────────────────────────

export default function SessionHistory({
  onBack,
  onOpenSettings,
}: SessionHistoryProps) {
  const { actor } = useActorContext();

  const [results, setResults] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isClearConfirming, setIsClearConfirming] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch scan results ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!actor) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    actor
      .getScanResults()
      .then((data) => {
        const sorted = [...data].sort((a, b) =>
          b.timestamp > a.timestamp ? 1 : b.timestamp < a.timestamp ? -1 : 0,
        );
        setResults(sorted);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setIsLoading(false));
  }, [actor]);

  // ── Delete single record ─────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!actor) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await actor.deleteScanResult(id);
      setResults((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // silently fail
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ── Clear all ────────────────────────────────────────────────────────────────
  const handleClearAll = async () => {
    if (!actor) return;

    if (!isClearConfirming) {
      setIsClearConfirming(true);
      // Auto-reset confirmation state after 4 seconds
      setTimeout(() => setIsClearConfirming(false), 4000);
      return;
    }

    setIsClearingAll(true);
    setIsClearConfirming(false);
    try {
      await Promise.all(results.map((r) => actor.deleteScanResult(r.id)));
      setResults([]);
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 2500);
    } catch {
      // silently fail
    } finally {
      setIsClearingAll(false);
    }
  };

  const hasResults = results.length > 0;

  return (
    <div
      data-ocid="history.panel"
      className="min-h-screen bg-background flex flex-col"
    >
      {/* ── Fixed Header ──────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 sm:px-6 border-b border-border bg-surface gap-3"
        style={{
          boxShadow:
            "0 1px 0 oklch(var(--border)), 0 2px 20px oklch(0 0 0 / 0.4)",
        }}
      >
        {/* Back button */}
        <button
          type="button"
          data-ocid="history.back_button"
          onClick={onBack}
          className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/10 transition-all duration-150 text-muted-foreground hover:text-foreground text-xs font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        {/* Center: brand + title */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <img
            src="/assets/generated/verasli-neural-v-icon-transparent.dim_64x64.png"
            alt="VERASLi Neural V"
            width={28}
            height={28}
            className="flex-shrink-0 opacity-90"
            style={{ imageRendering: "crisp-edges" }}
          />
          <div className="flex items-baseline gap-2 min-w-0">
            <span
              className="text-foreground font-bold text-[18px] tracking-tight leading-none"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              VERASLi™
            </span>
            <span className="hidden sm:inline text-[11px] font-data text-muted-foreground">
              SESSION HISTORY
            </span>
          </div>
        </div>

        {/* Right: clear all + settings */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasResults && !isLoading && (
            <button
              type="button"
              data-ocid="history.clear_all_button"
              onClick={() => void handleClearAll()}
              disabled={isClearingAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-destructive/50 disabled:opacity-50 disabled:pointer-events-none ${
                isClearConfirming
                  ? "border-destructive/60 bg-destructive/10 text-destructive"
                  : clearSuccess
                    ? "border-green-500/40 bg-green-500/10 text-green-400"
                    : "border-border hover:border-destructive/40 hover:bg-destructive/8 text-muted-foreground hover:text-destructive"
              }`}
            >
              {isClearingAll ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : clearSuccess ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">
                {isClearConfirming
                  ? "CONFIRM CLEAR"
                  : clearSuccess
                    ? "CLEARED"
                    : "CLEAR ALL"}
              </span>
            </button>
          )}

          <button
            type="button"
            data-ocid="history.settings_button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/10 transition-all duration-150 text-muted-foreground hover:text-foreground outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs font-medium">
              SETTINGS
            </span>
          </button>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 pt-14 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Page title row */}
          <div className="mb-6 boot-in">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-data text-muted-foreground tracking-widest uppercase">
                [HST]
              </span>
              <div className="h-px flex-1 bg-border" />
              {!isLoading && results.length > 0 && (
                <span
                  className="text-[10px] font-data font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: "oklch(var(--primary) / 0.12)",
                    color: "oklch(var(--primary))",
                    border: "1px solid oklch(var(--primary) / 0.25)",
                  }}
                >
                  {results.length} record{results.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <h1
              className="text-foreground text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              SESSION HISTORY
            </h1>
            <p className="text-muted-foreground text-sm mt-1 font-data">
              All recorded scans across all sectors, sorted by most recent.
            </p>
          </div>

          {/* Error state */}
          {error && (
            <div
              data-ocid="history.error_state"
              className="mb-6 flex items-start gap-3 px-4 py-3.5 rounded-xl border border-destructive/30 bg-destructive/5"
            >
              <span className="text-destructive text-xs font-data leading-relaxed">
                Failed to load history: {error}
              </span>
            </div>
          )}

          {/* Loading */}
          {isLoading && <HistorySkeleton />}

          {/* Empty state */}
          {!isLoading && !error && results.length === 0 && (
            <HistoryEmptyState />
          )}

          {/* Result cards */}
          {!isLoading && results.length > 0 && (
            <div className="space-y-3 boot-in">
              {results.map((result, i) => (
                <HistoryCard
                  key={result.id}
                  result={result}
                  index={i + 1}
                  onDelete={(id) => void handleDelete(id)}
                  isDeleting={deletingIds.has(result.id)}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <footer className="mt-12 pt-4 border-t border-border text-muted-foreground text-xs text-center">
            ©{new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.hostname : "",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors duration-150 underline underline-offset-2"
            >
              Built with ♥ using caffeine.ai
            </a>
          </footer>
        </div>
      </main>
    </div>
  );
}
