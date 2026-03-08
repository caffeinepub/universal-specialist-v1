import { ArrowLeft, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { backendInterface } from "./backend";
import AuthLock from "./components/AuthLock";
import Dashboard, { type ContextMode } from "./components/Dashboard";
import LiveVisionHUD from "./components/LiveVisionHUD";
import { createActorWithConfig } from "./config";
import { ActorContext } from "./context/ActorContext";
import { ALL_SECTORS } from "./data/taxonomy";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppState = "locked" | "dashboard" | "sector";

// ─── Sector View (authenticated, sector selected) ─────────────────────────────

interface SectorViewProps {
  activeTab: ContextMode;
  setActiveTab: (tab: string) => void;
  onBackToDashboard: () => void;
  onSignOut: () => void;
  principalId: string;
  actor: backendInterface | null;
  isActorReady: boolean;
  actorError: string | null;
}

function SectorView({
  activeTab,
  setActiveTab,
  onBackToDashboard,
  onSignOut,
  principalId,
  actor,
  isActorReady,
  actorError,
}: SectorViewProps) {
  // Look up the active sector from taxonomy for display in the header
  const activeSector = ALL_SECTORS.find((s) => s.id === activeTab);

  /** Called by LiveVisionHUD when the model auto-detects a sector */
  const handleSectorDetected = (sector: string) => {
    const normalized = sector.toLowerCase().trim();
    const match = ALL_SECTORS.find((s) => s.id === normalized);
    if (match) {
      setActiveTab(match.id);
    }
  };

  // Truncate principal: first 5 + "..." + last 4
  const truncatedPrincipal =
    principalId.length > 12
      ? `${principalId.slice(0, 5)}...${principalId.slice(-4)}`
      : principalId;

  return (
    <ActorContext.Provider value={{ actor, isActorReady, actorError }}>
      <div className="min-h-screen bg-background font-sans flex flex-col">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <header
          data-ocid="header.section"
          className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border h-14 flex items-center px-3 sm:px-5 gap-2"
          style={{
            boxShadow:
              "0 1px 0 oklch(var(--border)), 0 2px 16px oklch(0 0 0 / 0.4)",
          }}
        >
          {/* Back to dashboard */}
          <button
            type="button"
            data-ocid="header.back_to_dashboard_button"
            onClick={onBackToDashboard}
            title="Back to Command Center"
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/10 transition-all duration-150 text-muted-foreground hover:text-foreground text-xs font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          {/* Center: icon + title + active sector */}
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
                className="text-foreground font-bold text-[18px] tracking-tight leading-none truncate"
                aria-label="VERASLi"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                VERASLi™
              </span>
              {activeSector && (
                <span
                  className="hidden sm:inline text-[11px] font-medium leading-none whitespace-nowrap font-data truncate"
                  style={{ color: `oklch(${activeSector.accent})` }}
                >
                  {activeSector.name}
                </span>
              )}
            </div>
          </div>

          {/* Right: actor status + auth status + principal + sign out */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* Actor connection status indicator */}
            <span
              data-ocid="header.actor_status"
              className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border font-data"
              title={actorError ?? undefined}
              style={
                actorError
                  ? {
                      background: "oklch(0.55 0.18 25 / 0.12)",
                      color: "oklch(0.72 0.2 25)",
                      borderColor: "oklch(0.55 0.18 25 / 0.3)",
                    }
                  : isActorReady
                    ? {
                        background: "oklch(0.55 0.18 145 / 0.12)",
                        color: "oklch(0.72 0.2 145)",
                        borderColor: "oklch(0.55 0.18 145 / 0.3)",
                      }
                    : {
                        background: "oklch(0.6 0.15 55 / 0.12)",
                        color: "oklch(0.75 0.18 55)",
                        borderColor: "oklch(0.6 0.15 55 / 0.3)",
                      }
              }
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{
                  background: actorError
                    ? "oklch(0.72 0.2 25)"
                    : isActorReady
                      ? "oklch(0.72 0.2 145)"
                      : "oklch(0.75 0.18 55)",
                  animation:
                    !isActorReady && !actorError
                      ? "pulse 1.5s infinite"
                      : "none",
                }}
              />
              {actorError
                ? "BACKEND: FAILED"
                : isActorReady
                  ? "BACKEND: READY"
                  : "CONNECTING..."}
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 font-data">
              AUTHENTICATED
            </span>
            <span className="hidden md:inline text-muted-foreground text-[10px] font-data whitespace-nowrap">
              {truncatedPrincipal}
            </span>
            <button
              type="button"
              data-ocid="header.sign_out_button"
              onClick={onSignOut}
              title="Sign out"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-all duration-150 text-muted-foreground text-xs font-medium outline-none focus-visible:ring-1 focus-visible:ring-destructive/50"
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* ── Main Content (no tab nav, directly renders HUD) ──────── */}
        <main
          data-ocid="main.panel"
          className="flex-1 pt-14 overflow-auto"
          aria-label={`${activeSector?.name ?? activeTab} sector`}
        >
          <LiveVisionHUD
            key={activeTab}
            contextMode={activeTab}
            onSectorDetected={handleSectorDetected}
          />
        </main>
      </div>
    </ActorContext.Provider>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const { identity, isInitializing, clear } = useInternetIdentity();

  const [appState, setAppState] = useState<AppState>("locked");
  const [activeSector, setActiveSector] = useState<ContextMode>("");

  // ── Actor state: initialized at App level, bound to auth identity ──────────
  const [actor, setActor] = useState<backendInterface | null>(null);
  const [isActorReady, setIsActorReady] = useState(false);
  const [actorError, setActorError] = useState<string | null>(null);
  // Track the principal string for which we last attempted init — stored in a
  // ref so the effect can read it without needing it as a reactive dependency.
  const lastInitializedPrincipalRef = useRef<string | null>(null);

  // Initialize actor whenever identity changes (including after login)
  useEffect(() => {
    if (isInitializing) return;

    // Reset actor when identity is gone (sign out)
    if (!identity || identity.getPrincipal().isAnonymous()) {
      setActor(null);
      setIsActorReady(false);
      setActorError(null);
      lastInitializedPrincipalRef.current = null;
      return;
    }

    const principalStr = identity.getPrincipal().toString();

    // Skip if we already successfully initialized for this exact principal
    if (lastInitializedPrincipalRef.current === principalStr) {
      return;
    }

    // Mark that we're initializing for this principal to prevent duplicate calls
    lastInitializedPrincipalRef.current = principalStr;
    setIsActorReady(false);
    setActorError(null);

    console.info("[VERASLi] Initializing actor for principal:", principalStr);

    // Explicitly create actor with the authenticated identity.
    // This ensures the HttpAgent uses the correct cryptographic delegation
    // rather than the anonymous identity present during initial page load.
    void (async () => {
      try {
        const newActor = await createActorWithConfig({
          agentOptions: { identity },
        });
        setActor(newActor);
        setIsActorReady(true);
        console.info("[VERASLi] Actor ready for principal:", principalStr);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[VERASLi] Actor initialization FAILED:", err);
        setActorError(`Backend Connection Failed: ${msg}`);
        setIsActorReady(false);
        // Reset so the next identity event (or re-mount) can retry
        lastInitializedPrincipalRef.current = null;
      }
    })();
  }, [identity, isInitializing]);

  // ── Auth state machine ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitializing) return; // Wait for auth client to finish loading
    if (identity && !identity.getPrincipal().isAnonymous()) {
      // Authenticated — move to dashboard only if currently on the lock screen
      setAppState((prev) => (prev === "locked" ? "dashboard" : prev));
    } else {
      // Not authenticated — always return to lock screen
      setAppState("locked");
    }
  }, [identity, isInitializing]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSectorSelect = (sector: string) => {
    setActiveSector(sector);
    setAppState("sector");
  };

  const handleSignOut = () => {
    clear();
    setAppState("locked");
    setActiveSector("");
    // Reset actor on sign out
    setActor(null);
    setIsActorReady(false);
    setActorError(null);
    lastInitializedPrincipalRef.current = null;
  };

  const handleBackToDashboard = () => {
    setAppState("dashboard");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (appState === "locked") {
    return <AuthLock />;
  }

  if (appState === "dashboard") {
    return (
      <Dashboard
        onSectorSelect={handleSectorSelect}
        onSignOut={handleSignOut}
      />
    );
  }

  // appState === "sector"
  return (
    <SectorView
      activeTab={activeSector}
      setActiveTab={setActiveSector}
      onBackToDashboard={handleBackToDashboard}
      onSignOut={handleSignOut}
      principalId={identity?.getPrincipal().toString() ?? ""}
      actor={actor}
      isActorReady={isActorReady}
      actorError={actorError}
    />
  );
}
