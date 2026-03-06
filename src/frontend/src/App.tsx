import { useState } from "react";
import TacticalMechanicView from "./components/TacticalMechanicView";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContextMode =
  | "tactical-mechanic"
  | "academic-auditor"
  | "environmental-command";

interface TabConfig {
  id: ContextMode;
  label: string;
  displayName: string;
  shortCode: string;
  dataOcid: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: TabConfig[] = [
  {
    id: "tactical-mechanic",
    label: "TACTICAL MECHANIC",
    displayName: "TACTICAL MECHANIC",
    shortCode: "TM-01",
    dataOcid: "context.tab.1",
  },
  {
    id: "academic-auditor",
    label: "ACADEMIC AUDITOR",
    displayName: "ACADEMIC AUDITOR",
    shortCode: "AA-02",
    dataOcid: "context.tab.2",
  },
  {
    id: "environmental-command",
    label: "ENVIRONMENTAL COMMAND",
    displayName: "ENVIRONMENTAL COMMAND",
    shortCode: "EC-03",
    dataOcid: "context.tab.3",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CursorBlink() {
  return (
    <span
      className="cursor-blink inline-block w-2 h-4 bg-current align-middle ml-0.5"
      aria-hidden="true"
    />
  );
}

function PlaceholderContent({ mode }: { mode: TabConfig }) {
  const currentYear = new Date().getFullYear();

  return (
    <div
      data-ocid="placeholder.section"
      className="boot-in px-6 py-8 font-mono"
    >
      {/* Terminal prompt lines */}
      <div className="space-y-2 text-sm sm:text-base">
        <div className="type-in-1 flex items-center gap-2">
          <span className="text-terminal-green-dim select-none">[SYS]</span>
          <span className="text-terminal-muted">
            VERASLI™ v1.0 — SPECIALIST MODE ACTIVE
          </span>
        </div>

        <div className="type-in-2 flex items-center gap-2">
          <span className="text-terminal-green-dim select-none">[CTX]</span>
          <span className="text-terminal-muted">
            CONTEXT MODULE LOAD → {mode.shortCode}
          </span>
        </div>

        <div className="type-in-3 mt-6 flex items-start gap-2">
          <span className="text-terminal-green select-none font-semibold">
            &gt;
          </span>
          <span className="text-terminal-green font-semibold text-glow-green">
            MODE: {mode.displayName} INITIALIZED.
          </span>
        </div>

        <div className="type-in-4 flex items-start gap-2">
          <span className="text-terminal-amber select-none font-semibold">
            &gt;
          </span>
          <span className="text-terminal-amber font-semibold text-glow-amber">
            AWAITING KNOWLEDGE DROP...
            <CursorBlink />
          </span>
        </div>

        <div className="type-in-5 mt-6 flex items-center gap-2">
          <span className="text-terminal-green-dim select-none">[RDY]</span>
          <span className="text-terminal-muted text-xs">
            SYSTEM READY — DRAG &amp; DROP KNOWLEDGE FILES OR OPEN DATA GRID
          </span>
        </div>
      </div>

      {/* Status grid — decorative terminal readout */}
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
        <StatusCell label="CONTEXT" value={mode.shortCode} color="green" />
        <StatusCell label="KNOWLEDGE SINK" value="EMPTY" color="amber" />
        <StatusCell label="DATA GRID" value="STANDBY" color="muted" />
        <StatusCell label="LOGIC FEED" value="OFFLINE" color="muted" />
        <StatusCell label="TELEMETRY" value="SIMULATED" color="amber" />
        <StatusCell label="OLLAMA API" value="NOT LINKED" color="muted" />
      </div>

      {/* Footer attribution */}
      <footer className="mt-16 pt-4 border-t border-terminal-border text-terminal-muted text-xs">
        © {currentYear}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-terminal-green transition-colors duration-150"
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
  color: "green" | "amber" | "muted";
}

function StatusCell({ label, value, color }: StatusCellProps) {
  const valueClass =
    color === "green"
      ? "text-terminal-green text-glow-green"
      : color === "amber"
        ? "text-terminal-amber"
        : "text-terminal-muted";

  return (
    <div className="border border-terminal-border bg-terminal-surface rounded p-2.5">
      <div className="text-terminal-muted text-[10px] uppercase tracking-widest mb-1">
        {label}
      </div>
      <div className={`font-semibold text-xs ${valueClass}`}>{value}</div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<ContextMode>("tactical-mechanic");

  const activeMode = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-terminal-bg terminal-bg-grid terminal-scanlines font-mono flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        data-ocid="header.section"
        className="fixed top-0 left-0 right-0 z-50 bg-terminal-surface border-b border-terminal-border h-14 flex items-center px-4 sm:px-6"
        style={{
          boxShadow:
            "0 1px 0 0 oklch(0.82 0.22 145 / 0.15), 0 2px 12px 0 oklch(0.08 0.005 145 / 0.8)",
        }}
      >
        {/* Left: icon + title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src="/assets/generated/verasli-neural-v-icon-transparent.dim_64x64.png"
            alt="VERASLi Neural V"
            width={36}
            height={36}
            className="flex-shrink-0"
            style={{ imageRendering: "crisp-edges" }}
          />
          <div className="flex items-baseline gap-2 min-w-0">
            <span
              className="text-terminal-green text-glow-green font-bold text-lg sm:text-xl tracking-tight leading-none truncate"
              aria-label="VERASLi"
            >
              VERASLi™
            </span>
            <span className="hidden sm:inline text-terminal-muted text-[11px] tracking-wider leading-none whitespace-nowrap">
              UNIVERSAL SPECIALIST
            </span>
          </div>
        </div>

        {/* Right: version tag */}
        <div className="flex-shrink-0 text-right">
          <span className="text-terminal-amber-dim text-[11px] tracking-widest leading-none whitespace-nowrap">
            v1.0 {"//"}{" "}
            <span className="text-terminal-amber">SPECIALIST MODE</span>
          </span>
        </div>
      </header>

      {/* ── Context Switcher Tab Bar ────────────────────────────────── */}
      <nav
        className="fixed top-14 left-0 right-0 z-40 bg-terminal-surface border-b border-terminal-border"
        aria-label="Context switcher"
        style={{
          boxShadow: "0 1px 0 0 oklch(0.82 0.22 145 / 0.1)",
        }}
      >
        <div className="flex items-stretch overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                data-ocid={tab.dataOcid}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "relative flex-1 min-w-fit px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold tracking-widest uppercase whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-terminal-green",
                  isActive
                    ? "text-terminal-green text-glow-green"
                    : "text-terminal-muted hover:text-terminal-green-dim",
                ].join(" ")}
                aria-selected={isActive}
                role="tab"
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-terminal-green"
                    style={{
                      boxShadow: "0 0 8px oklch(0.82 0.22 145 / 0.8)",
                      animation: "tab-activate 0.2s ease-out forwards",
                    }}
                  />
                )}
                {/* Bracket decoration on active */}
                <span
                  className={`transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0"}`}
                  aria-hidden="true"
                >
                  [
                </span>
                {tab.label}
                <span
                  className={`transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0"}`}
                  aria-hidden="true"
                >
                  ]
                </span>
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
        aria-label={`${activeMode.displayName} context`}
      >
        {activeTab === "tactical-mechanic" ? (
          <TacticalMechanicView key="tactical-mechanic" />
        ) : (
          <PlaceholderContent key={activeTab} mode={activeMode} />
        )}
      </main>
    </div>
  );
}
