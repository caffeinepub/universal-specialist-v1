import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Loader2,
  LogOut,
  Settings,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ScanResult } from "../backend";
import { type SectorItem, TAXONOMY, getSectorAccent } from "../data/taxonomy";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Broadened to `string` to accommodate all taxonomy sector IDs */
export type ContextMode = string;

export interface DashboardProps {
  onSectorSelect: (sector: ContextMode) => void;
  onSignOut: () => void;
  onGoToHistory?: () => void;
  onOpenSettings?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncatePrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 8)}...${principal.slice(-4)}`;
}

function relativeTime(timestamp: bigint): string {
  const now = Date.now();
  const ts = Number(timestamp / 1_000_000n);
  const diffMs = now - ts;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

// ─── Sector Sub-button ────────────────────────────────────────────────────────

interface SectorSubButtonProps {
  sector: SectorItem;
  globalIndex: number;
  onSelect: (id: string) => void;
}

function SectorSubButton({
  sector,
  globalIndex,
  onSelect,
}: SectorSubButtonProps) {
  const accentColor = `oklch(${sector.accent})`;

  return (
    <button
      type="button"
      data-ocid={`dashboard.sector_button.${globalIndex}`}
      onClick={() => onSelect(sector.id)}
      className="group relative w-full text-left flex items-center gap-3 rounded-lg px-4 py-3.5 border border-border bg-card/60 hover:bg-card hover:border-transparent transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 overflow-hidden"
      style={
        {
          "--sector-accent": accentColor,
        } as React.CSSProperties
      }
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg opacity-70 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: accentColor }}
        aria-hidden="true"
      />

      {/* Icon */}
      <span
        className="flex-shrink-0 text-lg leading-none ml-1"
        aria-hidden="true"
        style={{ color: accentColor }}
      >
        {sector.icon}
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className="text-foreground font-semibold text-sm leading-tight"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          {sector.name}
        </p>
        <p className="text-muted-foreground text-[11px] font-data leading-snug mt-0.5 line-clamp-1">
          {sector.description}
        </p>
      </div>

      {/* Arrow */}
      <ArrowRight
        className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 text-muted-foreground"
        aria-hidden="true"
      />

      {/* Hover glow — bottom edge */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-40 transition-opacity duration-200"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
        aria-hidden="true"
      />
    </button>
  );
}

// ─── Theme Card (Accordion) ───────────────────────────────────────────────────

interface ThemeCardProps {
  theme: (typeof TAXONOMY)[number];
  themeIndex: number;
  sectorStartIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  onSectorSelect: (id: string) => void;
}

function ThemeCard({
  theme,
  themeIndex,
  sectorStartIndex,
  isOpen,
  onToggle,
  onSectorSelect,
}: ThemeCardProps) {
  const accentColor = `oklch(${theme.accent})`;
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200"
      style={{
        borderColor: isOpen ? `oklch(${theme.accent} / 0.35)` : undefined,
        boxShadow: isOpen
          ? `0 0 0 1px oklch(${theme.accent} / 0.15), 0 4px 24px oklch(0 0 0 / 0.25)`
          : "0 1px 4px oklch(0 0 0 / 0.18)",
      }}
    >
      {/* Theme header toggle */}
      <button
        type="button"
        data-ocid={`dashboard.theme_card.${themeIndex}`}
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full text-left flex items-center gap-4 px-5 py-4 group outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset transition-colors duration-150 hover:bg-surface-raised/50"
      >
        {/* Theme icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl leading-none transition-all duration-200"
          style={{
            background: isOpen
              ? `oklch(${theme.accent} / 0.15)`
              : `oklch(${theme.accent} / 0.08)`,
            border: `1px solid oklch(${theme.accent} / ${isOpen ? "0.3" : "0.15"})`,
            color: accentColor,
          }}
          aria-hidden="true"
        >
          {theme.icon}
        </div>

        {/* Theme text */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-foreground font-bold text-base tracking-tight leading-tight"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {theme.name}
          </h3>
          <p className="text-muted-foreground text-xs font-data mt-0.5 leading-snug">
            {theme.description}
            <span
              className="ml-2 font-medium text-[10px]"
              style={{ color: `oklch(${theme.accent} / 0.7)` }}
            >
              {theme.sectors.length} sector
              {theme.sectors.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>

        {/* Chevron */}
        <ChevronDown
          className="w-4 h-4 flex-shrink-0 transition-transform duration-300 text-muted-foreground"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            color: isOpen ? accentColor : undefined,
          }}
          aria-hidden="true"
        />
      </button>

      {/* Expandable sector grid */}
      <div
        style={{
          maxHeight: isOpen ? `${contentHeight + 32}px` : "0px",
          overflow: "hidden",
          transition: "max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        aria-hidden={!isOpen}
      >
        <div ref={contentRef} className="px-4 pb-4 pt-1">
          {/* Divider */}
          <div
            className="h-px mb-3"
            style={{
              background: `linear-gradient(90deg, oklch(${theme.accent} / 0.25), transparent)`,
            }}
            aria-hidden="true"
          />
          {/* 2-col on mobile, 3-col on md+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {theme.sectors.map((sector, i) => (
              <SectorSubButton
                key={sector.id}
                sector={sector}
                globalIndex={sectorStartIndex + i}
                onSelect={onSectorSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Item ────────────────────────────────────────────────────────────

function ActivityItem({
  result,
  index,
}: {
  result: ScanResult;
  index: number;
}) {
  const accent = getSectorAccent(result.contextMode);
  const accentColor = `oklch(${accent})`;

  return (
    <div
      data-ocid={`dashboard.activity_item.${index}`}
      className="flex items-start gap-3 py-3 border-b border-border last:border-0"
    >
      {/* Sector badge */}
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-data font-bold tracking-widest border flex-shrink-0 mt-0.5"
        style={{
          color: accentColor,
          borderColor: `oklch(${accent} / 0.3)`,
          background: `oklch(${accent} / 0.08)`,
        }}
      >
        {result.contextMode.toUpperCase().slice(0, 4)}
      </span>

      {/* Summary */}
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-xs font-medium leading-snug line-clamp-2">
          {result.thumbnailSummary ||
            result.analysisText?.slice(0, 80) ||
            "Scan completed"}
        </p>
        <p className="text-muted-foreground text-[10px] font-data mt-0.5">
          {relativeTime(result.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard({
  onSectorSelect,
  onSignOut,
  onGoToHistory,
  onOpenSettings,
}: DashboardProps) {
  const { identity, clear } = useInternetIdentity();
  const { actor } = useActor();

  const [scanResults, setScanResults] = useState<ScanResult[] | null>(null);
  const [isLoadingScans, setIsLoadingScans] = useState(true);
  const [copied, setCopied] = useState(false);

  /** ID of the currently-expanded theme, or null if all collapsed */
  const [openThemeId, setOpenThemeId] = useState<string | null>(null);

  const principalId = identity?.getPrincipal().toString() ?? "";
  const truncatedPrincipal = truncatePrincipal(principalId);

  // Fetch recent scan results on mount
  useEffect(() => {
    if (!actor) return;
    setIsLoadingScans(true);
    actor
      .getScanResults()
      .then((results) => {
        const sorted = [...results].sort((a, b) =>
          b.timestamp > a.timestamp ? 1 : -1,
        );
        setScanResults(sorted);
      })
      .catch(() => {
        setScanResults([]);
      })
      .finally(() => {
        setIsLoadingScans(false);
      });
  }, [actor]);

  const handleCopyPrincipal = async () => {
    if (!principalId) return;
    try {
      await navigator.clipboard.writeText(principalId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  const handleSignOut = () => {
    clear();
    onSignOut();
  };

  const handleThemeToggle = (themeId: string) => {
    setOpenThemeId((prev) => (prev === themeId ? null : themeId));
  };

  const recentScans = scanResults?.slice(0, 3) ?? [];

  // Compute per-theme sector start indices for deterministic data-ocid numbering
  let sectorCounter = 1;
  const themeSectorStartIndices: Record<string, number> = {};
  for (const theme of TAXONOMY) {
    themeSectorStartIndices[theme.id] = sectorCounter;
    sectorCounter += theme.sectors.length;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── System Status Header ─────────────────────────────────────── */}
      <header
        data-ocid="dashboard.header"
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 sm:px-6 border-b border-border bg-surface"
        style={{
          boxShadow:
            "0 1px 0 oklch(var(--border)), 0 2px 20px oklch(0 0 0 / 0.4)",
        }}
      >
        {/* Left: brand */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src="/assets/generated/verasli-neural-v-icon-transparent.dim_64x64.png"
            alt="VERASLi Neural V"
            width={28}
            height={28}
            className="flex-shrink-0 opacity-90"
            style={{ imageRendering: "crisp-edges" }}
          />
          <span
            className="text-foreground font-bold text-lg tracking-tight leading-none"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            VERASLi™
          </span>
        </div>

        {/* Center: connection badge */}
        <div className="hidden sm:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: "oklch(0.72 0.18 145)",
              boxShadow: "0 0 6px oklch(0.72 0.18 145 / 0.8)",
            }}
          />
          <span
            className="text-[11px] font-data font-semibold tracking-widest uppercase"
            style={{ color: "oklch(0.72 0.18 145)" }}
          >
            CONNECTION: SECURE
          </span>
        </div>

        {/* Right: principal + history + settings + sign out */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Principal ID copy */}
          <button
            type="button"
            data-ocid="dashboard.principal_copy_button"
            onClick={handleCopyPrincipal}
            title={copied ? "Copied!" : `Copy Principal ID: ${principalId}`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface-raised hover:border-primary/40 transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-primary/50 group"
          >
            <span className="text-muted-foreground text-[10px] font-data tracking-wide">
              {truncatedPrincipal}
            </span>
            {copied ? (
              <CheckCircle2
                className="w-3 h-3 flex-shrink-0"
                style={{ color: "oklch(0.72 0.18 145)" }}
              />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
            )}
          </button>

          {/* History button */}
          {onGoToHistory && (
            <button
              type="button"
              data-ocid="navbar.history_button"
              onClick={onGoToHistory}
              title="Session History"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/10 transition-all duration-150 text-muted-foreground hover:text-foreground text-[11px] font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
            >
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden md:inline">HISTORY</span>
            </button>
          )}

          {/* Settings button */}
          {onOpenSettings && (
            <button
              type="button"
              data-ocid="navbar.settings_button"
              onClick={onOpenSettings}
              title="Settings"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/10 transition-all duration-150 text-muted-foreground hover:text-foreground text-[11px] font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
            >
              <Settings className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden md:inline">SETTINGS</span>
            </button>
          )}

          {/* Sign out */}
          <button
            type="button"
            data-ocid="dashboard.sign_out_button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-all duration-150 text-muted-foreground text-[11px] font-medium outline-none focus-visible:ring-1 focus-visible:ring-destructive/50"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">SIGN OUT</span>
          </button>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 pt-14 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Page title */}
          <div className="mb-6 boot-in">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-data text-muted-foreground tracking-widest uppercase">
                [CMD]
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <h1
              className="text-foreground text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              SECTOR COMMAND
            </h1>
            <p className="text-muted-foreground text-sm mt-1 font-data">
              Select a deployment theme to reveal its sector environments
            </p>
          </div>

          {/* Mobile: Connection badge */}
          <div className="sm:hidden mb-4 flex items-center gap-2 boot-in">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: "oklch(0.72 0.18 145)",
                boxShadow: "0 0 6px oklch(0.72 0.18 145 / 0.8)",
              }}
            />
            <span
              className="text-[11px] font-data font-semibold tracking-widest uppercase"
              style={{ color: "oklch(0.72 0.18 145)" }}
            >
              CONNECTION: SECURE
            </span>
          </div>

          {/* Mobile: Principal ID */}
          <div className="sm:hidden mb-6 boot-in">
            <button
              type="button"
              data-ocid="dashboard.principal_copy_button"
              onClick={handleCopyPrincipal}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card w-full outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
            >
              <span className="text-muted-foreground text-[10px] font-data flex-1 text-left truncate">
                {truncatedPrincipal}
              </span>
              {copied ? (
                <CheckCircle2
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "oklch(0.72 0.18 145)" }}
                />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              )}
            </button>
          </div>

          {/* ── Theme Accordion ──────────────────────────────────────── */}
          <ul
            data-ocid="dashboard.sector_grid"
            className="space-y-3 mb-10 boot-in list-none m-0 p-0"
            style={{ animationDelay: "0.08s" }}
            aria-label="Sector themes"
          >
            {TAXONOMY.map((theme, themeIdx) => (
              <li key={theme.id}>
                <ThemeCard
                  theme={theme}
                  themeIndex={themeIdx + 1}
                  sectorStartIndex={themeSectorStartIndices[theme.id]}
                  isOpen={openThemeId === theme.id}
                  onToggle={() => handleThemeToggle(theme.id)}
                  onSectorSelect={onSectorSelect}
                />
              </li>
            ))}
          </ul>

          {/* ── Recent Activity ──────────────────────────────────────── */}
          <div
            data-ocid="dashboard.activity_panel"
            className="boot-in"
            style={{ animationDelay: "0.16s" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-data text-muted-foreground tracking-widest uppercase">
                  [ACT]
                </span>
                <div className="h-px w-8 bg-border" />
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <h2
                  className="text-foreground font-semibold text-sm tracking-wider uppercase"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  RECENT ACTIVITY
                </h2>
                {scanResults !== null && scanResults.length > 0 && (
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-data font-bold"
                    style={{
                      background: "oklch(var(--primary) / 0.15)",
                      color: "oklch(var(--primary))",
                      border: "1px solid oklch(var(--primary) / 0.3)",
                    }}
                  >
                    {scanResults.length}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden card-shadow">
              {/* Loading skeleton */}
              {isLoadingScans && (
                <div
                  data-ocid="dashboard.activity_loading_state"
                  className="p-5 flex flex-col gap-3"
                >
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 animate-pulse"
                    >
                      <div className="h-4 w-10 rounded bg-muted flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 rounded bg-muted w-full" />
                        <div className="h-2.5 rounded bg-muted w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isLoadingScans &&
                (!scanResults || scanResults.length === 0) && (
                  <div
                    data-ocid="dashboard.activity_empty_state"
                    className="p-8 flex flex-col items-center gap-3 text-center"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-border"
                      style={{ background: "oklch(var(--surface-raised))" }}
                    >
                      <Activity className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        No scans recorded yet.
                      </p>
                      <p className="text-muted-foreground text-xs font-data mt-1">
                        Activate a sector to begin.
                      </p>
                    </div>
                  </div>
                )}

              {/* Activity list */}
              {!isLoadingScans && recentScans.length > 0 && (
                <div className="px-4 py-1 divide-y divide-transparent">
                  {recentScans.map((result, i) => (
                    <ActivityItem
                      key={result.id}
                      result={result}
                      index={i + 1}
                    />
                  ))}
                </div>
              )}

              {/* Show more hint */}
              {!isLoadingScans &&
                scanResults !== null &&
                scanResults.length > 3 && (
                  <div className="px-4 py-2 border-t border-border">
                    <p className="text-muted-foreground text-[11px] font-data text-center">
                      +{scanResults.length - 3} more scan
                      {scanResults.length - 3 !== 1 ? "s" : ""} — select a
                      sector to view full history
                    </p>
                  </div>
                )}
            </div>
          </div>

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

      {/* Loading state for actor */}
      {!actor && (
        <div className="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-muted-foreground text-xs font-data shadow-lg">
          <Loader2 className="w-3 h-3 animate-spin" />
          Connecting to backend...
        </div>
      )}
    </div>
  );
}
