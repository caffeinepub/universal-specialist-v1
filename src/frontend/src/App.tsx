import { useState } from "react";
import LiveVisionHUD from "./components/LiveVisionHUD";
import TacticalMechanicView from "./components/TacticalMechanicView";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContextMode =
  | "healthcare"
  | "technology"
  | "education"
  | "construction"
  | "mechanics";

interface TabConfig {
  id: ContextMode;
  label: string;
  displayName: string;
  shortCode: string;
  dataOcid: string;
  /** OKLCH accent — raw L C H values (no wrapper) */
  accent: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: TabConfig[] = [
  {
    id: "healthcare",
    label: "Healthcare",
    displayName: "Healthcare",
    shortCode: "HC-01",
    dataOcid: "context.tab.1",
    accent: "0.78 0.15 195",
  },
  {
    id: "technology",
    label: "Technology",
    displayName: "Technology",
    shortCode: "TC-02",
    dataOcid: "context.tab.2",
    accent: "0.65 0.18 250",
  },
  {
    id: "education",
    label: "Education",
    displayName: "Education",
    shortCode: "ED-03",
    dataOcid: "context.tab.3",
    accent: "0.78 0.16 85",
  },
  {
    id: "construction",
    label: "Construction",
    displayName: "Construction",
    shortCode: "CS-04",
    dataOcid: "context.tab.4",
    accent: "0.72 0.18 45",
  },
  {
    id: "mechanics",
    label: "Mechanics",
    displayName: "Mechanics",
    shortCode: "MC-05",
    dataOcid: "context.tab.5",
    accent: "0.72 0.18 145",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Small monospace badge for system/context prefixes */
function SysBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-data font-medium bg-muted text-muted-foreground border border-border select-none whitespace-nowrap">
      {label}
    </span>
  );
}

function PlaceholderContent({ mode }: { mode: TabConfig }) {
  const currentYear = new Date().getFullYear();
  const accentColor = `oklch(${mode.accent})`;

  return (
    <div data-ocid="placeholder.section" className="boot-in px-6 py-10">
      {/* Status messages */}
      <div className="space-y-3 text-sm max-w-2xl">
        <div className="flex items-center gap-2.5">
          <SysBadge label="[SYS]" />
          <span className="text-muted-foreground">
            VERASLi™ v2.0 — Universal Specialist Active
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <SysBadge label="[CTX]" />
          <span className="text-muted-foreground">
            Sector Module Load → {mode.shortCode}
          </span>
        </div>

        <div className="mt-6 flex items-start gap-2.5">
          <span className="font-semibold mt-0.5" style={{ color: accentColor }}>
            ›
          </span>
          <span className="text-foreground font-semibold">
            Sector: {mode.displayName} Initialized.
          </span>
        </div>

        <div className="flex items-start gap-2.5">
          <span className="text-status-warning font-semibold mt-0.5">›</span>
          <span className="text-status-warning font-medium">
            Awaiting Knowledge Drop...
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2.5">
          <SysBadge label="[RDY]" />
          <span className="text-muted-foreground text-xs">
            System Ready — Drag &amp; drop knowledge files or open data grid
          </span>
        </div>
      </div>

      {/* Status metric cards */}
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
        <StatusCell
          label="Sector"
          value={mode.shortCode}
          color="ok"
          accent={mode.accent}
        />
        <StatusCell label="Knowledge Sink" value="Empty" color="warning" />
        <StatusCell label="Data Grid" value="Standby" color="offline" />
        <StatusCell label="Logic Feed" value="Offline" color="offline" />
        <StatusCell label="Telemetry" value="Simulated" color="warning" />
        <StatusCell label="Ollama API" value="Not Linked" color="offline" />
      </div>

      {/* Footer attribution */}
      <footer className="mt-16 pt-4 border-t border-border text-muted-foreground text-xs">
        © {currentYear}.{" "}
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

interface StatusCellProps {
  label: string;
  value: string;
  color: "ok" | "warning" | "offline";
  /** Optional OKLCH raw values for accent color override (L C H) */
  accent?: string;
}

function StatusCell({ label, value, color, accent }: StatusCellProps) {
  const dotClass =
    color === "ok"
      ? "status-dot-ok"
      : color === "warning"
        ? "status-dot-warning"
        : "status-dot-offline";

  const valueClass =
    color === "ok"
      ? accent
        ? ""
        : "text-status-ok"
      : color === "warning"
        ? "text-status-warning"
        : "text-muted-foreground";

  const valueStyle =
    color === "ok" && accent ? { color: `oklch(${accent})` } : undefined;

  return (
    <div className="border border-border bg-card card-shadow-sm rounded-lg p-3.5">
      <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`}
          style={
            color === "ok" && accent
              ? { background: `oklch(${accent})` }
              : undefined
          }
        />
        <span
          className={`font-data font-semibold text-xs ${valueClass}`}
          style={valueStyle}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<ContextMode>("healthcare");

  const activeMode = TABS.find((t) => t.id === activeTab)!;

  /** Called by LiveVisionHUD when the model auto-detects a sector */
  const handleSectorDetected = (sector: string) => {
    const normalized = sector.toLowerCase().trim();
    const match = TABS.find((t) => t.id === normalized);
    if (match) {
      setActiveTab(match.id);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        data-ocid="header.section"
        className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border h-14 flex items-center px-4 sm:px-6"
        style={{
          boxShadow:
            "0 1px 0 oklch(var(--border)), 0 2px 16px oklch(0 0 0 / 0.4)",
        }}
      >
        {/* Left: icon + title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src="/assets/generated/verasli-neural-v-icon-transparent.dim_64x64.png"
            alt="VERASLi Neural V"
            width={32}
            height={32}
            className="flex-shrink-0 opacity-90"
            style={{ imageRendering: "crisp-edges" }}
          />
          <div className="flex items-baseline gap-2.5 min-w-0">
            <span
              className="text-foreground font-bold text-[20px] tracking-tight leading-none truncate"
              aria-label="VERASLi"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              VERASLi™
            </span>
            <span className="hidden sm:inline text-muted-foreground text-[11px] font-medium leading-none whitespace-nowrap">
              Universal Specialist
            </span>
          </div>
        </div>

        {/* Right: version tag */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="text-muted-foreground text-[11px] font-data whitespace-nowrap">
            v2.0
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
            Sector Routing Active
          </span>
        </div>
      </header>

      {/* ── Context Switcher Tab Bar ────────────────────────────────── */}
      <nav
        className="fixed top-14 left-0 right-0 z-40 bg-surface border-b border-border"
        aria-label="Sector switcher"
      >
        <div className="flex items-stretch overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const accentColor = `oklch(${tab.accent})`;
            return (
              <button
                type="button"
                key={tab.id}
                data-ocid={tab.dataOcid}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "relative flex-1 min-w-fit px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-primary/50",
                  isActive ? "" : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
                style={isActive ? { color: accentColor } : undefined}
                aria-selected={isActive}
                role="tab"
              >
                {/* Short code prefix */}
                <span
                  className="mr-1.5 text-[10px] font-data opacity-60"
                  aria-hidden="true"
                >
                  {tab.shortCode}
                </span>
                {tab.label}
                {/* Active indicator bar with sector accent */}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{
                      background: accentColor,
                      animation: "tab-activate 0.2s ease-out forwards",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <main
        data-ocid="main.panel"
        className="flex-1 pt-28 overflow-auto"
        role="tabpanel"
        aria-label={`${activeMode.displayName} sector`}
      >
        {activeTab === "mechanics" ? (
          <TacticalMechanicView key="mechanics" />
        ) : activeTab === "construction" ? (
          <LiveVisionHUD
            key="construction"
            contextMode="construction"
            onSectorDetected={handleSectorDetected}
          />
        ) : (
          <PlaceholderContent key={activeTab} mode={activeMode} />
        )}
      </main>
    </div>
  );
}
