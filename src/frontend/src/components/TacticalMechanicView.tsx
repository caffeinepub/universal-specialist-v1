import { useCallback, useEffect, useRef, useState } from "react";
import type { DataRow, KnowledgeDoc } from "../backend";
import { useActor } from "../hooks/useActor";

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveStatus = "idle" | "saving" | "ok" | "error";

// ─── Utility ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

function matchesSearch(query: string, ...fields: string[]): boolean {
  if (!query.trim()) return true;
  const lower = query.toLowerCase();
  return fields.some((f) => f.toLowerCase().includes(lower));
}

// ─── Terminal-styled components ───────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-terminal-green-dim text-[10px] tracking-widest uppercase select-none">
        [SYS]
      </span>
      <span className="text-terminal-green-dim text-[11px] tracking-widest uppercase font-semibold">
        {children}
      </span>
      <div className="flex-1 h-px bg-terminal-border" />
    </div>
  );
}

interface TerminalInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  "data-ocid"?: string;
}

function TerminalInput({ className = "", ...props }: TerminalInputProps) {
  return (
    <input
      {...props}
      className={[
        "w-full bg-terminal-bg border border-terminal-border text-terminal-green placeholder-terminal-muted",
        "px-3 py-2 text-xs font-mono tracking-wide",
        "focus:outline-none focus:border-terminal-green focus:ring-1 focus:ring-terminal-green/30",
        "transition-colors duration-150",
        className,
      ].join(" ")}
    />
  );
}

interface TerminalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "green" | "amber" | "muted";
  "data-ocid"?: string;
}

function TerminalButton({
  variant = "green",
  className = "",
  children,
  ...props
}: TerminalButtonProps) {
  const variantClass =
    variant === "green"
      ? "border-terminal-green text-terminal-green hover:bg-terminal-green/10 focus-visible:ring-terminal-green/40"
      : variant === "amber"
        ? "border-terminal-amber text-terminal-amber hover:bg-terminal-amber/10 focus-visible:ring-terminal-amber/40"
        : "border-terminal-border text-terminal-muted hover:bg-terminal-surface-raised focus-visible:ring-terminal-border/40";

  return (
    <button
      type="button"
      {...props}
      className={[
        "border px-3 py-1.5 text-[11px] font-mono font-semibold tracking-widest uppercase",
        "transition-colors duration-150 focus:outline-none focus-visible:ring-1",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variantClass,
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ─── Knowledge Sink Section ───────────────────────────────────────────────────

interface KnowledgeSinkProps {
  searchQuery: string;
}

function KnowledgeSink({ searchQuery }: KnowledgeSinkProps) {
  const { actor, isFetching } = useActor();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocs = useCallback(async () => {
    if (!actor) return;
    setLoadingDocs(true);
    try {
      const fetched = await actor.getKnowledgeDocs();
      setDocs(
        [...fetched].sort((a, b) =>
          b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0,
        ),
      );
    } catch {
      // silently fail on load
    } finally {
      setLoadingDocs(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor && !isFetching) {
      void loadDocs();
    }
  }, [actor, isFetching, loadDocs]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") {
        setContent(text);
        if (!title) {
          setTitle(file.name.replace(/\.(txt|md)$/i, ""));
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!actor || !content.trim()) return;
    setSaveStatus("saving");
    try {
      const doc: KnowledgeDoc = {
        id: generateId(),
        title: title.trim() || "UNTITLED DOCUMENT",
        content: content.trim(),
        createdAt: BigInt(Date.now()),
      };
      await actor.saveKnowledgeDoc(doc);
      setSaveStatus("ok");
      setTitle("");
      setContent("");
      await loadDocs();
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!actor) return;
    try {
      await actor.deleteKnowledgeDoc(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // silently fail
    }
  };

  const filteredDocs = docs.filter((doc) =>
    matchesSearch(searchQuery, doc.title, doc.content),
  );

  return (
    <section className="mb-8">
      <SectionHeader>PRIMARY KNOWLEDGE DROP (VERASLi™ INDEXING)</SectionHeader>

      {/* Upload form */}
      <div
        data-ocid="knowledge.dropzone"
        className="border border-terminal-border bg-terminal-surface p-4 space-y-3"
      >
        {/* Title input */}
        <div>
          <label
            htmlFor="knowledge-title"
            className="block text-[10px] text-terminal-muted tracking-widest uppercase mb-1"
          >
            DOCUMENT TITLE
          </label>
          <TerminalInput
            id="knowledge-title"
            data-ocid="knowledge.title_input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.G. 09 CAMRY 2AZ-FE ENGINE SPEC..."
          />
        </div>

        {/* Content textarea */}
        <div>
          <label
            htmlFor="knowledge-content"
            className="block text-[10px] text-terminal-muted tracking-widest uppercase mb-1"
          >
            KNOWLEDGE CONTENT
          </label>
          <textarea
            id="knowledge-content"
            data-ocid="knowledge.textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="PASTE MANUAL EXCERPT, SPEC SHEET, OR DIAGNOSTIC TEXT..."
            rows={6}
            className={[
              "w-full bg-terminal-bg border border-terminal-border text-terminal-green placeholder-terminal-muted",
              "px-3 py-2 text-xs font-mono tracking-wide resize-y",
              "focus:outline-none focus:border-terminal-green focus:ring-1 focus:ring-terminal-green/30",
              "transition-colors duration-150",
            ].join(" ")}
          />
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            className="hidden"
            onChange={handleFileUpload}
            aria-label="Upload .txt or .md file"
          />
          <TerminalButton
            data-ocid="knowledge.upload_button"
            variant="muted"
            onClick={() => fileInputRef.current?.click()}
          >
            [UPLOAD .TXT / .MD]
          </TerminalButton>

          <TerminalButton
            data-ocid="knowledge.submit_button"
            variant="green"
            onClick={() => void handleSubmit()}
            disabled={saveStatus === "saving" || !content.trim() || !actor}
          >
            {saveStatus === "saving" ? "[INDEXING...]" : "[INDEX DOCUMENT]"}
          </TerminalButton>

          {saveStatus === "ok" && (
            <span
              data-ocid="knowledge.success_state"
              className="text-terminal-green text-glow-green text-[11px] font-semibold tracking-widest"
            >
              ✓ STATUS: OK — DOCUMENT INDEXED
            </span>
          )}
          {saveStatus === "error" && (
            <span
              data-ocid="knowledge.error_state"
              className="text-terminal-amber text-glow-amber text-[11px] font-semibold tracking-widest"
            >
              ⚠ WARNING: SAVE FAILED
            </span>
          )}
        </div>
      </div>

      {/* Document list */}
      <div className="mt-4">
        <div className="text-[10px] text-terminal-muted tracking-widest uppercase mb-2">
          INDEXED DOCUMENTS — {loadingDocs ? "..." : filteredDocs.length} RECORD
          {!loadingDocs && filteredDocs.length !== 1 ? "S" : ""}
        </div>

        {isFetching || loadingDocs ? (
          <div
            data-ocid="knowledge.loading_state"
            className="text-terminal-muted text-xs py-4 tracking-widest"
          >
            [LOADING...]
          </div>
        ) : filteredDocs.length === 0 ? (
          <div
            data-ocid="knowledge.empty_state"
            className="border border-dashed border-terminal-border text-terminal-muted text-[11px] tracking-widest py-5 px-4"
          >
            [NO DOCUMENTS INDEXED. AWAITING KNOWLEDGE DROP...]
          </div>
        ) : (
          <ul data-ocid="knowledge.list" className="space-y-2">
            {filteredDocs.map((doc, idx) => (
              <li
                key={doc.id}
                data-ocid={`knowledge.item.${idx + 1}`}
                className="border border-terminal-border bg-terminal-surface p-3 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-terminal-green text-xs font-semibold tracking-wide truncate mb-0.5">
                    {doc.title}
                  </div>
                  <div className="text-terminal-muted text-[11px] leading-relaxed line-clamp-2">
                    {doc.content.slice(0, 100)}
                    {doc.content.length > 100 ? "..." : ""}
                  </div>
                </div>
                <TerminalButton
                  data-ocid={`knowledge.delete_button.${idx + 1}`}
                  variant="amber"
                  onClick={() => void handleDelete(doc.id)}
                  className="flex-shrink-0 text-[10px] px-2 py-1"
                >
                  [DEL]
                </TerminalButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ─── Data Grid Section ────────────────────────────────────────────────────────

interface DataGridProps {
  searchQuery: string;
}

function DataGrid({ searchQuery }: DataGridProps) {
  const { actor, isFetching } = useActor();
  const [component, setComponent] = useState("");
  const [specification, setSpecification] = useState("");
  const [toolsRequired, setToolsRequired] = useState("");
  const [addStatus, setAddStatus] = useState<SaveStatus>("idle");
  const [rows, setRows] = useState<DataRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);

  const loadRows = useCallback(async () => {
    if (!actor) return;
    setLoadingRows(true);
    try {
      const fetched = await actor.getDataRows();
      setRows(
        [...fetched].sort((a, b) =>
          b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0,
        ),
      );
    } catch {
      // silently fail
    } finally {
      setLoadingRows(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor && !isFetching) {
      void loadRows();
    }
  }, [actor, isFetching, loadRows]);

  const handleAddRow = async () => {
    if (!actor) return;
    if (!component.trim() && !specification.trim() && !toolsRequired.trim())
      return;
    setAddStatus("saving");
    try {
      const row: DataRow = {
        id: generateId(),
        component: component.trim(),
        specification: specification.trim(),
        toolsRequired: toolsRequired.trim(),
        createdAt: BigInt(Date.now()),
      };
      await actor.saveDataRow(row);
      setAddStatus("ok");
      setComponent("");
      setSpecification("");
      setToolsRequired("");
      await loadRows();
      setTimeout(() => setAddStatus("idle"), 3000);
    } catch {
      setAddStatus("error");
      setTimeout(() => setAddStatus("idle"), 4000);
    }
  };

  const handleDeleteRow = async (id: string) => {
    if (!actor) return;
    try {
      await actor.deleteDataRow(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // silently fail
    }
  };

  const filteredRows = rows.filter((row) =>
    matchesSearch(
      searchQuery,
      row.component,
      row.specification,
      row.toolsRequired,
    ),
  );

  return (
    <section>
      <SectionHeader>
        MASTER DATA BLOCKS — STRUCTURED SPECIFICATION GRID
      </SectionHeader>

      {/* Add row form */}
      <div className="border border-terminal-border bg-terminal-surface p-4 mb-4">
        <div className="text-[10px] text-terminal-muted tracking-widest uppercase mb-3">
          ADD SPECIFICATION BLOCK
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label
              htmlFor="datagrid-component"
              className="block text-[10px] text-terminal-muted tracking-widest uppercase mb-1"
            >
              COMPONENT
            </label>
            <TerminalInput
              id="datagrid-component"
              data-ocid="datagrid.component_input"
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              placeholder="E.G. TIMING CHAIN"
            />
          </div>
          <div>
            <label
              htmlFor="datagrid-specification"
              className="block text-[10px] text-terminal-muted tracking-widest uppercase mb-1"
            >
              SPECIFICATION
            </label>
            <TerminalInput
              id="datagrid-specification"
              data-ocid="datagrid.specification_input"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="E.G. 2AZ-FE, 2362CC, 110KW"
            />
          </div>
          <div>
            <label
              htmlFor="datagrid-tools"
              className="block text-[10px] text-terminal-muted tracking-widest uppercase mb-1"
            >
              TOOLS REQUIRED
            </label>
            <TerminalInput
              id="datagrid-tools"
              data-ocid="datagrid.tools_input"
              value={toolsRequired}
              onChange={(e) => setToolsRequired(e.target.value)}
              placeholder="E.G. 10MM, TIMING KIT"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <TerminalButton
            data-ocid="datagrid.add_button"
            variant="green"
            onClick={() => void handleAddRow()}
            disabled={
              addStatus === "saving" ||
              !actor ||
              (!component.trim() &&
                !specification.trim() &&
                !toolsRequired.trim())
            }
          >
            {addStatus === "saving" ? "[SAVING...]" : "[ADD BLOCK]"}
          </TerminalButton>

          {addStatus === "ok" && (
            <span className="text-terminal-green text-glow-green text-[11px] font-semibold tracking-widest">
              ✓ STATUS: OK — BLOCK SAVED
            </span>
          )}
          {addStatus === "error" && (
            <span className="text-terminal-amber text-glow-amber text-[11px] font-semibold tracking-widest">
              ⚠ WARNING: SAVE FAILED
            </span>
          )}
        </div>
      </div>

      {/* Data table */}
      {isFetching || loadingRows ? (
        <div
          data-ocid="datagrid.loading_state"
          className="text-terminal-muted text-xs py-4 tracking-widest"
        >
          [LOADING...]
        </div>
      ) : filteredRows.length === 0 ? (
        <div
          data-ocid="datagrid.empty_state"
          className="border border-dashed border-terminal-border text-terminal-muted text-[11px] tracking-widest py-5 px-4"
        >
          [NO DATA BLOCKS LOADED. ADD MASTER SPEC ROWS ABOVE.]
        </div>
      ) : (
        <div data-ocid="datagrid.table" className="overflow-x-auto">
          <table className="w-full border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-terminal-border">
                <th className="text-left text-[10px] text-terminal-green-dim tracking-widest uppercase px-3 py-2">
                  COMPONENT
                </th>
                <th className="text-left text-[10px] text-terminal-green-dim tracking-widest uppercase px-3 py-2">
                  SPECIFICATION
                </th>
                <th className="text-left text-[10px] text-terminal-green-dim tracking-widest uppercase px-3 py-2">
                  TOOLS REQUIRED
                </th>
                <th className="text-right text-[10px] text-terminal-green-dim tracking-widest uppercase px-3 py-2">
                  [DEL]
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => (
                <tr
                  key={row.id}
                  data-ocid={`datagrid.row.${idx + 1}`}
                  className="border-b border-terminal-border/50 hover:bg-terminal-surface-raised transition-colors duration-100"
                >
                  <td className="px-3 py-2.5 text-terminal-green">
                    {row.component || (
                      <span className="text-terminal-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-terminal-muted max-w-xs">
                    <span className="line-clamp-2">
                      {row.specification || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-terminal-muted">
                    {row.toolsRequired || (
                      <span className="text-terminal-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <TerminalButton
                      data-ocid={`datagrid.delete_button.${idx + 1}`}
                      variant="amber"
                      onClick={() => void handleDeleteRow(row.id)}
                      className="text-[10px] px-2 py-1"
                    >
                      [DEL]
                    </TerminalButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Main Tactical Mechanic View ──────────────────────────────────────────────

export default function TacticalMechanicView() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="boot-in px-4 sm:px-6 py-6 font-mono max-w-5xl mx-auto">
      {/* ── Boot header ──────────────────────────────────────────────── */}
      <div className="mb-6 space-y-1">
        <div className="type-in-1 flex items-center gap-2 text-xs">
          <span className="text-terminal-green-dim select-none">[TM-01]</span>
          <span className="text-terminal-muted">
            TACTICAL MECHANIC MODULE — ACTIVE
          </span>
        </div>
        <div className="type-in-2 flex items-center gap-2 text-xs">
          <span className="text-terminal-green-dim select-none">[VRS]</span>
          <span className="text-terminal-muted">
            VERASLi™ INDEXING ENGINE READY
          </span>
        </div>
        <div className="type-in-3 flex items-center gap-2 text-xs">
          <span className="text-terminal-green select-none font-semibold">
            &gt;
          </span>
          <span className="text-terminal-amber font-semibold text-glow-amber">
            CONTEXT: 2009 TOYOTA CAMRY / 2AZ-FE ENGINE
          </span>
        </div>
      </div>

      {/* ── Search bar ───────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 border border-terminal-green bg-terminal-bg px-3 py-2 focus-within:ring-1 focus-within:ring-terminal-green/30">
          <span className="text-terminal-green-dim text-[11px] tracking-widest select-none whitespace-nowrap">
            [SEARCH VERASLi™ INDEX]
          </span>
          <span className="text-terminal-border select-none">│</span>
          <input
            data-ocid="tactical.search_input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER KNOWLEDGE SINK + DATA GRID..."
            className="flex-1 bg-transparent text-terminal-green placeholder-terminal-muted text-xs font-mono tracking-wide focus:outline-none"
            aria-label="Search VERASLi index"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-terminal-muted hover:text-terminal-amber text-[11px] tracking-widest transition-colors"
              aria-label="Clear search"
            >
              [CLR]
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-1 text-[10px] text-terminal-muted tracking-widest">
            FILTERING: &quot;{searchQuery}&quot;
          </div>
        )}
      </div>

      {/* ── Knowledge Sink ───────────────────────────────────────────── */}
      <KnowledgeSink searchQuery={searchQuery} />

      {/* ── Data Grid ────────────────────────────────────────────────── */}
      <DataGrid searchQuery={searchQuery} />

      {/* ── Status legend ────────────────────────────────────────────── */}
      <div className="mt-10 pt-4 border-t border-terminal-border flex flex-wrap gap-4 text-[10px] tracking-widest">
        <span className="text-terminal-green text-glow-green">
          ◉ STATUS: OK
        </span>
        <span className="text-terminal-amber">⚠ WARNING</span>
        <span className="text-terminal-muted">○ OFFLINE / MUTED</span>
      </div>
    </div>
  );
}
