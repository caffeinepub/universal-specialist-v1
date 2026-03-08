import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CheckCircle2,
  Copy,
  Loader2,
  LogOut,
  Shield,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { backendInterface } from "../backend";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SettingsMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  principalId: string;
  onSignOut: () => void;
  actor: backendInterface | null;
}

// ─── SettingsMenu ─────────────────────────────────────────────────────────────

export default function SettingsMenu({
  open,
  onOpenChange,
  principalId,
  onSignOut,
  actor,
}: SettingsMenuProps) {
  const [copied, setCopied] = useState(false);
  const [isClearConfirming, setIsClearConfirming] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  // Truncate principal: first 8...last 4
  const truncatedPrincipal =
    principalId.length > 16
      ? `${principalId.slice(0, 8)}...${principalId.slice(-4)}`
      : principalId;

  // ── Copy principal to clipboard ──────────────────────────────────────────────
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

  // ── Clear all history ────────────────────────────────────────────────────────
  const handleClearAll = async () => {
    if (!actor) return;

    if (!isClearConfirming) {
      setIsClearConfirming(true);
      // Auto-reset confirmation after 4 seconds
      setTimeout(() => setIsClearConfirming(false), 4000);
      return;
    }

    setIsClearingAll(true);
    setIsClearConfirming(false);
    setClearError(null);

    try {
      const results = await actor.getScanResults();
      await Promise.all(results.map((r) => actor.deleteScanResult(r.id)));
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
    } catch (err: unknown) {
      setClearError(
        err instanceof Error ? err.message : "Failed to clear history.",
      );
    } finally {
      setIsClearingAll(false);
    }
  };

  // ── Sign out ─────────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    onOpenChange(false);
    onSignOut();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-ocid="settings.sheet"
        side="right"
        className="w-full sm:max-w-[360px] flex flex-col gap-0 p-0 border-l border-border overflow-y-auto"
        style={{ background: "oklch(var(--surface))" }}
      >
        {/* ── Sheet Header ──────────────────────────────────────────────── */}
        <SheetHeader className="px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/generated/verasli-neural-v-icon-transparent.dim_64x64.png"
              alt="VERASLi Neural V"
              width={22}
              height={22}
              className="flex-shrink-0 opacity-80"
              style={{ imageRendering: "crisp-edges" }}
            />
            <SheetTitle
              className="text-foreground font-bold tracking-tight text-base leading-none"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Settings
            </SheetTitle>
          </div>
          <SheetDescription className="text-muted-foreground text-xs font-data mt-1">
            VERASLi™ session configuration and data controls
          </SheetDescription>
        </SheetHeader>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* SECTION 1: Identity */}
          <section className="px-5 py-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-[10px] font-data text-muted-foreground tracking-widest uppercase font-semibold">
                Identity
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-data text-muted-foreground uppercase tracking-wider">
                PRINCIPAL ID
              </p>
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border"
                style={{ background: "oklch(var(--surface-raised))" }}
              >
                <code
                  className="flex-1 text-xs font-data text-foreground/80 truncate leading-none select-all"
                  title={principalId}
                >
                  {truncatedPrincipal || "Not authenticated"}
                </code>
                <button
                  type="button"
                  data-ocid="settings.principal_copy_button"
                  onClick={() => void handleCopyPrincipal()}
                  disabled={!principalId}
                  title={copied ? "Copied!" : "Copy full Principal ID"}
                  className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-primary/40 hover:bg-primary/10 transition-all duration-150 text-muted-foreground hover:text-primary outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {copied ? (
                    <CheckCircle2
                      className="w-3 h-3"
                      style={{ color: "oklch(0.72 0.18 145)" }}
                    />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span className="text-[9px] font-data hidden sm:inline">
                    {copied ? "COPIED" : "COPY"}
                  </span>
                </button>
              </div>
              {principalId && (
                <p className="text-[9px] font-data text-muted-foreground leading-relaxed">
                  This is your unique on-chain identity. All data is scoped
                  exclusively to this principal.
                </p>
              )}
            </div>
          </section>

          <Separator className="bg-border/60" />

          {/* SECTION 2: Data Management */}
          <section className="px-5 py-5">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-[10px] font-data text-muted-foreground tracking-widest uppercase font-semibold">
                Data Management
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-foreground/80 font-medium mb-1.5">
                  Clear Session History
                </p>
                <p className="text-[11px] text-muted-foreground font-data leading-relaxed mb-3">
                  Permanently deletes all recorded scan sessions from the
                  on-chain database. This action cannot be undone.
                </p>

                {/* Error */}
                {clearError && (
                  <p className="text-destructive text-[11px] font-data mb-2 leading-snug">
                    Error: {clearError}
                  </p>
                )}

                {/* Clear all button — 2-step confirmation */}
                {isClearConfirming ? (
                  <button
                    type="button"
                    data-ocid="settings.confirm_clear_button"
                    onClick={() => void handleClearAll()}
                    disabled={isClearingAll}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-destructive/60 bg-destructive/12 text-destructive font-semibold text-sm transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-destructive/50 hover:bg-destructive/18 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isClearingAll ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    CONFIRM — DELETE ALL HISTORY
                  </button>
                ) : (
                  <button
                    type="button"
                    data-ocid="settings.clear_history_button"
                    onClick={() => void handleClearAll()}
                    disabled={isClearingAll || !actor}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-destructive/50 disabled:opacity-40 disabled:pointer-events-none ${
                      clearSuccess
                        ? "border-green-500/40 bg-green-500/10 text-green-400"
                        : "border-border hover:border-destructive/40 hover:bg-destructive/8 text-muted-foreground hover:text-destructive"
                    }`}
                  >
                    {isClearingAll ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : clearSuccess ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    {clearSuccess ? "History Cleared" : "CLEAR ALL HISTORY"}
                  </button>
                )}

                {isClearConfirming && (
                  <p className="text-[10px] font-data text-destructive/70 mt-2 text-center">
                    Click again to confirm · This will delete all records
                    permanently
                  </p>
                )}
              </div>
            </div>
          </section>

          <Separator className="bg-border/60" />

          {/* SECTION 3: Session */}
          <section className="px-5 py-5">
            <div className="flex items-center gap-2 mb-3">
              <LogOut className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-[10px] font-data text-muted-foreground tracking-widest uppercase font-semibold">
                Session
              </span>
            </div>

            <div>
              <p className="text-[11px] text-muted-foreground font-data leading-relaxed mb-3">
                Sign out of VERASLi™ and return to the authentication gateway.
                Your data remains securely stored on-chain.
              </p>
              <button
                type="button"
                data-ocid="settings.sign_out_button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border hover:border-destructive/40 hover:bg-destructive/8 hover:text-destructive transition-all duration-150 text-muted-foreground font-medium text-sm outline-none focus-visible:ring-1 focus-visible:ring-destructive/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                SIGN OUT
              </button>
            </div>
          </section>
        </div>

        {/* ── Sheet footer: version tag ──────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-border flex-shrink-0">
          <p className="text-[9px] font-data text-muted-foreground/50 text-center tracking-widest uppercase">
            VERASLi™ Universal Specialist v2
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
