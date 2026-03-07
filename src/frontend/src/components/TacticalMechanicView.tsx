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

// ─── Enterprise UI Components ─────────────────────────────────────────────────

/** Small monospace badge for system labels like [SYS], [TM-01] */
function SysBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-data font-medium bg-muted text-muted-foreground border border-border select-none whitespace-nowrap">
      {label}
    </span>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <SysBadge label="[SYS]" />
      <h2 className="text-sm font-semibold text-foreground">{children}</h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// Enterprise input — slate bg, subtle border, 6px radius, soft shadow, blue focus ring
interface EnterpriseInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  "data-ocid"?: string;
}

function EnterpriseInput({ className = "", ...props }: EnterpriseInputProps) {
  return (
    <input
      {...props}
      className={[
        "w-full bg-input border border-border text-foreground placeholder-muted-foreground",
        "px-3 py-2 text-sm font-data",
        "rounded-md shadow-input",
        "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
        "transition-colors duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
    />
  );
}

// Enterprise button variants
type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";

interface EnterpriseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  "data-ocid"?: string;
}

function EnterpriseButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: EnterpriseButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-40 disabled:cursor-not-allowed select-none";

  const sizeClass =
    size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm";

  const variantClass = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 shadow-card-sm",
    secondary:
      "bg-secondary text-secondary-foreground border border-border hover:bg-surface-raised",
    destructive:
      "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20",
    ghost:
      "text-muted-foreground hover:text-foreground hover:bg-surface-raised",
  }[variant];

  return (
    <button
      type="button"
      {...props}
      className={[base, sizeClass, variantClass, className].join(" ")}
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
        title: title.trim() || "Untitled Document",
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
      <SectionHeader>Primary Knowledge Drop (VERASLi™ Indexing)</SectionHeader>

      {/* Upload form card */}
      <div
        data-ocid="knowledge.dropzone"
        className="border border-border bg-card card-shadow rounded-lg p-6 space-y-4"
      >
        {/* Title input */}
        <div>
          <label
            htmlFor="knowledge-title"
            className="block text-xs font-medium text-muted-foreground mb-1.5"
          >
            Document Title
          </label>
          <EnterpriseInput
            id="knowledge-title"
            data-ocid="knowledge.title_input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 09 Camry 2AZ-FE Engine Spec..."
          />
        </div>

        {/* Content textarea */}
        <div>
          <label
            htmlFor="knowledge-content"
            className="block text-xs font-medium text-muted-foreground mb-1.5"
          >
            Knowledge Content
          </label>
          <textarea
            id="knowledge-content"
            data-ocid="knowledge.textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste manual excerpt, spec sheet, or diagnostic text..."
            rows={6}
            className={[
              "w-full bg-input border border-border text-foreground placeholder-muted-foreground",
              "px-3 py-2 text-sm font-data leading-relaxed resize-y",
              "rounded-md shadow-input",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
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
          <EnterpriseButton
            data-ocid="knowledge.upload_button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload File
          </EnterpriseButton>

          <EnterpriseButton
            data-ocid="knowledge.submit_button"
            variant="primary"
            onClick={() => void handleSubmit()}
            disabled={saveStatus === "saving" || !content.trim() || !actor}
          >
            {saveStatus === "saving" ? "Indexing..." : "Index Document"}
          </EnterpriseButton>

          {saveStatus === "ok" && (
            <span
              data-ocid="knowledge.success_state"
              className="flex items-center gap-1.5 text-status-ok text-xs font-medium"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full status-dot-ok" />
              Document indexed successfully
            </span>
          )}
          {saveStatus === "error" && (
            <span
              data-ocid="knowledge.error_state"
              className="flex items-center gap-1.5 text-status-warning text-xs font-medium"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full status-dot-warning" />
              Save failed — please retry
            </span>
          )}
        </div>
      </div>

      {/* Document list */}
      <div className="mt-4">
        <div className="text-xs font-medium text-muted-foreground mb-3">
          Indexed Documents — {loadingDocs ? "..." : filteredDocs.length} record
          {!loadingDocs && filteredDocs.length !== 1 ? "s" : ""}
        </div>

        {isFetching || loadingDocs ? (
          <div
            data-ocid="knowledge.loading_state"
            className="text-muted-foreground text-xs py-4 font-data"
          >
            Loading...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div
            data-ocid="knowledge.empty_state"
            className="border border-dashed border-border rounded-lg text-muted-foreground text-sm py-8 px-6 text-center"
          >
            No documents indexed. Paste content above or upload a file to begin.
          </div>
        ) : (
          <ul data-ocid="knowledge.list" className="space-y-2">
            {filteredDocs.map((doc, idx) => (
              <li
                key={doc.id}
                data-ocid={`knowledge.item.${idx + 1}`}
                className="border border-border bg-card card-shadow-sm rounded-lg p-4 flex items-start gap-4 hover:bg-surface-raised transition-colors duration-150"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-foreground text-sm font-semibold truncate mb-1">
                    {doc.title}
                  </div>
                  <div className="text-muted-foreground text-xs font-data leading-relaxed line-clamp-2">
                    {doc.content.slice(0, 120)}
                    {doc.content.length > 120 ? "..." : ""}
                  </div>
                </div>
                <EnterpriseButton
                  data-ocid={`knowledge.delete_button.${idx + 1}`}
                  variant="destructive"
                  size="sm"
                  onClick={() => void handleDelete(doc.id)}
                  className="flex-shrink-0"
                >
                  Delete
                </EnterpriseButton>
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
        Master Data Blocks — Structured Specification Grid
      </SectionHeader>

      {/* Add row form card */}
      <div className="border border-border bg-card card-shadow rounded-lg p-6 mb-4">
        <p className="text-xs font-medium text-muted-foreground mb-4">
          Add Specification Block
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label
              htmlFor="datagrid-component"
              className="block text-xs font-medium text-muted-foreground mb-1.5"
            >
              Component
            </label>
            <EnterpriseInput
              id="datagrid-component"
              data-ocid="datagrid.component_input"
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              placeholder="e.g. Timing Chain"
            />
          </div>
          <div>
            <label
              htmlFor="datagrid-specification"
              className="block text-xs font-medium text-muted-foreground mb-1.5"
            >
              Specification
            </label>
            <EnterpriseInput
              id="datagrid-specification"
              data-ocid="datagrid.specification_input"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="e.g. 2AZ-FE, 2362cc, 110kW"
            />
          </div>
          <div>
            <label
              htmlFor="datagrid-tools"
              className="block text-xs font-medium text-muted-foreground mb-1.5"
            >
              Tools Required
            </label>
            <EnterpriseInput
              id="datagrid-tools"
              data-ocid="datagrid.tools_input"
              value={toolsRequired}
              onChange={(e) => setToolsRequired(e.target.value)}
              placeholder="e.g. 10mm, Timing Kit"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <EnterpriseButton
            data-ocid="datagrid.add_button"
            variant="primary"
            onClick={() => void handleAddRow()}
            disabled={
              addStatus === "saving" ||
              !actor ||
              (!component.trim() &&
                !specification.trim() &&
                !toolsRequired.trim())
            }
          >
            {addStatus === "saving" ? "Saving..." : "Add Block"}
          </EnterpriseButton>

          {addStatus === "ok" && (
            <span className="flex items-center gap-1.5 text-status-ok text-xs font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full status-dot-ok" />
              Block saved
            </span>
          )}
          {addStatus === "error" && (
            <span className="flex items-center gap-1.5 text-status-warning text-xs font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full status-dot-warning" />
              Save failed — please retry
            </span>
          )}
        </div>
      </div>

      {/* Data table */}
      {isFetching || loadingRows ? (
        <div
          data-ocid="datagrid.loading_state"
          className="text-muted-foreground text-xs py-4 font-data"
        >
          Loading...
        </div>
      ) : filteredRows.length === 0 ? (
        <div
          data-ocid="datagrid.empty_state"
          className="border border-dashed border-border rounded-lg text-muted-foreground text-sm py-8 px-6 text-center"
        >
          No data blocks loaded. Add master spec rows above.
        </div>
      ) : (
        <div
          data-ocid="datagrid.table"
          className="border border-border bg-card card-shadow rounded-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Component
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Specification
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Tools Required
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    data-ocid={`datagrid.row.${idx + 1}`}
                    className="border-b border-border/50 last:border-0 hover:bg-surface-raised transition-colors duration-100"
                  >
                    <td className="px-4 py-3 text-foreground font-data text-sm">
                      {row.component || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-data text-sm max-w-xs">
                      <span className="line-clamp-2">
                        {row.specification || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-data text-sm">
                      {row.toolsRequired || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <EnterpriseButton
                        data-ocid={`datagrid.delete_button.${idx + 1}`}
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDeleteRow(row.id)}
                      >
                        Delete
                      </EnterpriseButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Main Tactical Mechanic View ──────────────────────────────────────────────

export default function TacticalMechanicView() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="boot-in px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      {/* ── Module header ─────────────────────────────────────────── */}
      <div className="mb-7 space-y-2">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-data font-medium bg-primary/10 text-primary border border-primary/20 select-none">
            [MC-05]
          </span>
          <span className="text-muted-foreground">
            Mechanics Sector Module — Active
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-data font-medium bg-muted text-muted-foreground border border-border select-none">
            [VRS]
          </span>
          <span className="text-muted-foreground">
            VERASLi™ Indexing Engine Ready
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-xs pt-1">
          <span className="text-primary font-semibold">›</span>
          <span className="text-status-warning font-medium font-data">
            Context: 2009 Toyota Camry / 2AZ-FE Engine
          </span>
        </div>
      </div>

      {/* ── Search bar ───────────────────────────────────────────── */}
      <div className="mb-7">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            data-ocid="tactical.search_input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search VERASLi™ index — knowledge sink + data grid..."
            className={[
              "w-full bg-input border border-border text-foreground placeholder-muted-foreground",
              "pl-9 pr-10 py-2.5 text-sm font-sans",
              "rounded-lg card-shadow-sm",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
              "transition-colors duration-150",
            ].join(" ")}
            aria-label="Search VERASLi index"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs transition-colors p-1"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            Filtering: &quot;{searchQuery}&quot;
          </div>
        )}
      </div>

      {/* ── Knowledge Sink ───────────────────────────────────────── */}
      <KnowledgeSink searchQuery={searchQuery} />

      {/* ── Data Grid ────────────────────────────────────────────── */}
      <DataGrid searchQuery={searchQuery} />

      {/* ── Status legend ────────────────────────────────────────── */}
      <div className="mt-10 pt-4 border-t border-border flex flex-wrap gap-5">
        <span className="flex items-center gap-2 text-status-ok text-xs font-medium">
          <span className="inline-block w-2 h-2 rounded-full status-dot-ok" />
          Status: OK
        </span>
        <span className="flex items-center gap-2 text-status-warning text-xs font-medium">
          <span className="inline-block w-2 h-2 rounded-full status-dot-warning" />
          Warning
        </span>
        <span className="flex items-center gap-2 text-muted-foreground text-xs">
          <span className="inline-block w-2 h-2 rounded-full status-dot-offline" />
          Offline / Muted
        </span>
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="mt-10 pt-4 border-t border-border text-muted-foreground text-xs">
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
