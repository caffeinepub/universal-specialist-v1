import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// ─── AuthLock ─────────────────────────────────────────────────────────────────

/**
 * Mandatory full-screen authentication gateway.
 * Blocks access until the user authenticates via ICP Internet Identity.
 */
export default function AuthLock() {
  const { login, isInitializing, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();

  const isLoading = isInitializing || isLoggingIn;
  const loadingMessage = isInitializing
    ? "Initializing secure session..."
    : "Connecting to Internet Identity...";

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-4"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.22 0.018 230 / 0.4) 0%, oklch(var(--background)) 70%)",
      }}
    >
      {/* Subtle grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(oklch(var(--border) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, oklch(var(--border) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* Glow orb behind content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.62 0.14 230 / 0.08) 0%, transparent 70%)",
        }}
      />

      {/* Main card */}
      <div
        className="boot-in relative z-10 w-full max-w-md"
        style={{ animationDelay: "0.05s" }}
      >
        {/* Card shell */}
        <div
          className="rounded-2xl border border-border bg-card card-shadow overflow-hidden"
          style={{
            boxShadow:
              "0 0 0 1px oklch(var(--border)), 0 4px 40px oklch(0 0 0 / 0.5), 0 0 80px oklch(0.62 0.14 230 / 0.06)",
          }}
        >
          {/* Top accent bar */}
          <div
            className="h-0.5 w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(var(--primary)), transparent)",
            }}
          />

          <div className="px-8 py-10 flex flex-col items-center text-center gap-6">
            {/* Brand identity */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <img
                  src="/assets/generated/verasli-neural-v-icon-transparent.dim_64x64.png"
                  alt="VERASLi Neural V"
                  width={56}
                  height={56}
                  className="opacity-95"
                  style={{ imageRendering: "crisp-edges" }}
                />
                {/* Glow ring behind icon */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full -z-10 blur-xl opacity-40"
                  style={{ background: "oklch(var(--primary))" }}
                />
              </div>
              <div>
                <h1
                  className="text-foreground font-bold tracking-tight leading-none text-3xl"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  VERASLi™
                </h1>
                <p className="text-muted-foreground text-[11px] font-medium tracking-[0.2em] uppercase mt-1.5 font-data">
                  Universal Specialist v2
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-border opacity-60" />

            {/* Gateway header */}
            <div className="flex flex-col items-center gap-2">
              {/* Shield / Lock status icon */}
              <div
                className="flex items-center justify-center w-12 h-12 rounded-xl border border-primary/30 bg-primary/10"
                style={{
                  boxShadow: "0 0 20px oklch(var(--primary) / 0.15)",
                }}
              >
                {isLoading ? (
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "oklch(var(--primary))" }}
                  />
                ) : isLoginError ? (
                  <Lock
                    className="w-5 h-5"
                    style={{ color: "oklch(0.72 0.12 75)" }}
                  />
                ) : (
                  <ShieldCheck
                    className="w-5 h-5"
                    style={{ color: "oklch(var(--primary))" }}
                  />
                )}
              </div>

              <div>
                <h2
                  className="text-foreground font-semibold text-base tracking-wide"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  SECURE ACCESS GATEWAY
                </h2>
                <p className="text-muted-foreground text-xs mt-0.5 font-data tracking-wider">
                  {isLoading ? loadingMessage : "Authentication Required"}
                </p>
              </div>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div
                data-ocid="authlock.loading_state"
                className="w-full flex flex-col items-center gap-3"
              >
                {/* Progress bar */}
                <div className="w-full h-0.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: "oklch(var(--primary))",
                      width: "60%",
                      animation: "authlock-progress 1.5s ease-in-out infinite",
                    }}
                  />
                </div>
                <p className="text-muted-foreground text-xs font-data">
                  {loadingMessage}
                </p>
              </div>
            )}

            {/* Error state */}
            {isLoginError && !isLoading && (
              <div
                data-ocid="authlock.error_state"
                className="w-full rounded-lg border bg-card px-4 py-3 text-left"
                style={{
                  borderColor: "oklch(0.72 0.12 75 / 0.4)",
                  background: "oklch(0.72 0.12 75 / 0.06)",
                }}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="text-[10px] font-data font-bold tracking-wider mt-0.5 flex-shrink-0"
                    style={{ color: "oklch(0.72 0.12 75)" }}
                  >
                    [AUTH ERROR]
                  </span>
                  <p
                    className="text-xs font-data leading-relaxed"
                    style={{ color: "oklch(0.72 0.12 75)" }}
                  >
                    {loginError?.message ??
                      "Authentication failed. Please try again."}
                  </p>
                </div>
              </div>
            )}

            {/* Authenticate CTA */}
            <button
              type="button"
              data-ocid="authlock.authenticate_button"
              onClick={login}
              disabled={isLoading}
              className="w-full relative rounded-xl font-semibold text-sm py-3.5 px-6 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
              style={{
                background: isLoading
                  ? "oklch(var(--primary) / 0.4)"
                  : "oklch(var(--primary))",
                color: "oklch(var(--primary-foreground))",
                fontFamily: "'Sora', sans-serif",
                letterSpacing: "0.04em",
                boxShadow: isLoading
                  ? "none"
                  : "0 0 24px oklch(var(--primary) / 0.3), 0 2px 8px oklch(0 0 0 / 0.3)",
              }}
            >
              {/* Hover shimmer */}
              <span
                aria-hidden="true"
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 40%, oklch(1 0 0 / 0.08) 50%, transparent 60%)",
                }}
              />
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isInitializing ? "Initializing..." : "Authenticating..."}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    AUTHENTICATE VERASLi™
                  </>
                )}
              </span>
            </button>

            {/* Info blurb */}
            <p className="text-muted-foreground text-[11px] font-data leading-relaxed max-w-xs text-center">
              Authentication is handled by ICP Internet Identity.
              <br />
              No password required — uses cryptographic keys.
            </p>
          </div>

          {/* Bottom accent bar */}
          <div
            className="h-0.5 w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(var(--primary) / 0.4), transparent)",
            }}
          />
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-muted-foreground text-[11px] font-data tracking-wide">
          Powered by{" "}
          <span style={{ color: "oklch(var(--primary))" }}>
            ICP Internet Identity
          </span>
        </p>
      </div>

      {/* Bottom blurb */}
      <p className="absolute bottom-6 text-muted-foreground text-[10px] font-data tracking-widest uppercase opacity-50">
        VERASLi™ · All data scoped to your Principal ID
      </p>

      <style>{`
        @keyframes authlock-progress {
          0%   { transform: translateX(-100%); width: 60%; }
          50%  { transform: translateX(100%); width: 60%; }
          100% { transform: translateX(-100%); width: 60%; }
        }
      `}</style>
    </div>
  );
}
