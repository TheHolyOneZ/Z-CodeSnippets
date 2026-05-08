import { useState } from "react";
import {
  X, Palette, Code2, SlidersHorizontal, Info,
  Github, Globe, Zap, Download, Upload, ExternalLink, Check,
} from "lucide-react";
import { save as dialogSave, open as dialogOpen } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { useExportSnippets, useImportSnippets } from "@/hooks/useSnippets";
import { motion, AnimatePresence } from "framer-motion";
import { openUrl } from "@/lib/openUrl";
import {
  useUiStore,
  ACCENT_PRESETS,
  type EditorMode,
  type Theme,
  type TabSize,
  type ListDensity,
  type SortOrder,
} from "@/store/ui";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { LANGUAGES } from "@/lib/languages";
import { cn } from "@/lib/cn";

type Category = "appearance" | "editor" | "general" | "about";

const CATEGORIES: {
  id: Category;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
}[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "editor",     label: "Editor",     icon: Code2 },
  { id: "general",    label: "General",    icon: SlidersHorizontal },
  { id: "about",      label: "About",      icon: Info },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: Props) {
  const [category, setCategory] = useState<Category>("appearance");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-label="Settings"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{    opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className={cn(
              "fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-[720px] h-[560px] flex flex-col",
              "rounded-[var(--radius-lg)] overflow-hidden",
              "bg-[var(--color-bg-panel)]",
              "shadow-[var(--shadow-modal)]"
            )}
          >
            {}
            <div className="flex items-center justify-between px-5 h-12 border-b border-[var(--color-border-subtle)] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-press)] flex items-center justify-center shadow-[var(--shadow-accent)]">
                  <Zap size={12} className="text-white" />
                </div>
                <span className="text-[13px] font-semibold text-[var(--color-text)]">
                  Settings
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.12, rotate: 90 }}
                whileTap={{ scale: 0.85 }}
                onClick={onClose}
                className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)] transition-colors"
              >
                <X size={14} />
              </motion.button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {}
              <nav className="w-44 shrink-0 bg-[var(--color-bg-base)] border-r border-[var(--color-border-subtle)] py-2 px-1.5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = category === cat.id;
                  return (
                    <motion.button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      whileHover={{ x: active ? 0 : 1 }}
                      className={cn(
                        "relative flex items-center gap-2.5 w-full px-3 h-9 mb-0.5 text-[13px] text-left",
                        "rounded-[var(--radius-sm)] transition-colors focus-ring outline-none",
                        active
                          ? "text-[var(--color-accent)] font-semibold"
                          : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="settings-active-bg"
                          transition={{ type: "spring", damping: 26, stiffness: 360 }}
                          className="absolute inset-0 rounded-[var(--radius-sm)] bg-[var(--color-accent-subtle)]"
                        />
                      )}
                      <Icon size={14} className="relative z-10" />
                      <span className="relative z-10">{cat.label}</span>
                    </motion.button>
                  );
                })}
              </nav>

              {}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
                    className="p-6 flex flex-col gap-6"
                  >
                    {category === "appearance" && <AppearanceSettings />}
                    {category === "editor"     && <EditorSettings />}
                    {category === "general"    && <GeneralSettings />}
                    {category === "about"      && <AboutPage />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


function AppearanceSettings() {
  const { theme, setTheme, accentPresetId, setAccentPresetId, listDensity, setListDensity } =
    useUiStore();

  return (
    <>
      <Section title="Theme" description="Color mode for the workspace.">
        <SegmentedControl
          options={[
            { id: "dark",   label: "Dark" },
            { id: "light",  label: "Light" },
            { id: "system", label: "System" },
          ]}
          value={theme}
          onChange={(v) => setTheme(v as Theme)}
        />
      </Section>

      <Hairline />

      <Section title="Accent" description="Highlight color used across the app.">
        <div className="flex items-center gap-2 flex-wrap">
          {ACCENT_PRESETS.map((preset) => {
            const active = accentPresetId === preset.id;
            return (
              <motion.button
                key={preset.id}
                title={preset.label}
                onClick={() => setAccentPresetId(preset.id)}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", damping: 18, stiffness: 380 }}
                className={cn(
                  "relative w-7 h-7 rounded-full transition-shadow focus-ring outline-none",
                  active && "shadow-[0_0_0_2px_var(--color-bg-panel),0_0_0_4px_var(--color-text)]"
                )}
                style={{ backgroundColor: preset.color }}
              >
                <AnimatePresence>
                  {active && (
                    <motion.span
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: -90 }}
                      transition={{ type: "spring", damping: 20, stiffness: 380 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Check size={14} className="text-white drop-shadow" strokeWidth={3} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </Section>

      <Hairline />

      <Section title="Density" description="Vertical spacing in the library list.">
        <SegmentedControl
          options={[
            { id: "comfortable", label: "Comfortable" },
            { id: "compact",     label: "Compact" },
          ]}
          value={listDensity}
          onChange={(v) => setListDensity(v as ListDensity)}
        />
      </Section>
    </>
  );
}


function EditorSettings() {
  const {
    editorMode, setEditorMode,
    defaultLanguage, setDefaultLanguage,
    wordWrap, setWordWrap,
    fontSize, setFontSize,
    tabSize, setTabSize,
    showLineNumbers, setShowLineNumbers,
  } = useUiStore();

  return (
    <>
      <Section title="Default editor" description="Loaded when you open a snippet.">
        <SegmentedControl
          options={[
            { id: "codemirror", label: "CodeMirror" },
            { id: "monaco",     label: "Monaco" },
          ]}
          value={editorMode}
          onChange={(v) => setEditorMode(v as EditorMode)}
        />
      </Section>

      <Hairline />

      <Section title="Default language" description="Pre-selected for new snippets.">
        <CustomSelect
          value={defaultLanguage}
          onChange={setDefaultLanguage}
          options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))}
          compact
          className="w-44"
        />
      </Section>

      <Hairline />

      <Section title="Font size">
        <SegmentedControl
          options={[
            { id: "12", label: "12" },
            { id: "13", label: "13" },
            { id: "14", label: "14" },
            { id: "15", label: "15" },
          ]}
          value={String(fontSize)}
          onChange={(v) => setFontSize(Number(v))}
        />
      </Section>

      <Hairline />

      <Section title="Tab size">
        <SegmentedControl
          options={[
            { id: "2", label: "2 spaces" },
            { id: "4", label: "4 spaces" },
          ]}
          value={String(tabSize)}
          onChange={(v) => setTabSize(Number(v) as TabSize)}
        />
      </Section>

      <Hairline />

      <Toggle
        label="Word wrap"
        description="Wrap long lines in the editor."
        value={wordWrap}
        onChange={setWordWrap}
      />
      <Toggle
        label="Line numbers"
        description="Show line numbers in the gutter."
        value={showLineNumbers}
        onChange={setShowLineNumbers}
      />
    </>
  );
}


function GeneralSettings() {
  const { sortOrder, setSortOrder } = useUiStore();
  const exportMutation = useExportSnippets();
  const importMutation = useImportSnippets();

  const exportJson = async () => {
    const path = await dialogSave({
      title: "Export Snippets",
      defaultPath: "zcode-snippets.json",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!path) return;
    try {
      await exportMutation.mutateAsync(path);
      toast.success("Snippets exported successfully");
    } catch (e) {
      toast.error(`Export failed: ${e}`);
    }
  };

  const importJson = async () => {
    const result = await dialogOpen({
      title: "Import Snippets",
      filters: [{ name: "JSON", extensions: ["json"] }],
      multiple: false,
    });
    const path = Array.isArray(result) ? result[0] : result;
    if (!path) return;
    try {
      const count = await importMutation.mutateAsync(path);
      toast.success(`Imported ${count} snippet${count !== 1 ? "s" : ""}`);
    } catch (e) {
      toast.error(`Import failed: ${e}`);
    }
  };

  return (
    <>
      <Section title="Sort order" description="How snippets are ordered in the list.">
        <CustomSelect
          value={sortOrder}
          onChange={(v) => setSortOrder(v as SortOrder)}
          options={[
            { value: "last_used",    label: "Last used",    hint: "Most recently copied or edited" },
            { value: "created",      label: "Date created", hint: "Newest first" },
            { value: "alphabetical", label: "Alphabetical", hint: "A → Z by title" },
          ]}
          compact
          className="w-52"
        />
      </Section>

      <Hairline />

      <Section
        title="Data"
        description="Backup all snippets to JSON, or restore from a previous export. Collections are not preserved on import."
      >
        <div className="flex gap-2">
          <PrimaryButton
            size="sm"
            variant="outline"
            leading={<Download size={13} />}
            loading={exportMutation.isPending}
            onClick={exportJson}
          >
            Export
          </PrimaryButton>
          <PrimaryButton
            size="sm"
            variant="outline"
            leading={<Upload size={13} />}
            loading={importMutation.isPending}
            onClick={importJson}
          >
            Import
          </PrimaryButton>
        </div>
      </Section>
    </>
  );
}


function AboutPage() {
  const links = [
    { label: "GitHub repository", url: "https://github.com/TheHolyOneZ/Z-CodeSnippets", icon: Github },
    { label: "Project website",   url: "https://zsync.eu/zcodesnippets/",                icon: Globe },
    { label: "More projects",     url: "https://zsync.eu",                               icon: Zap },
    { label: "Developer profile", url: "https://github.com/TheHolyOneZ",                 icon: Github },
  ];

  const stack = [
    { name: "Rust",          desc: "Backend, SQLite layer, Tauri commands" },
    { name: "Tauri v2",      desc: "Native desktop shell" },
    { name: "React 19",      desc: "UI framework" },
    { name: "TypeScript",    desc: "Type safety across the frontend" },
    { name: "SQLite / FTS5", desc: "Local storage + full-text search" },
    { name: "CodeMirror 6",  desc: "Default code editor" },
    { name: "Monaco Editor", desc: "Optional editor (lazy-loaded)" },
    { name: "Tailwind v4",   desc: "Styling" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center shrink-0",
          "bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-press)]",
          "shadow-[var(--shadow-accent)]"
        )}>
          <span className="text-white text-[18px] font-black">Z</span>
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-[var(--color-text)]">Z-Code Snippets</h2>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 font-mono">v0.1.0 · MVP</p>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-2 leading-relaxed">
            A local-first, offline code snippet manager — no cloud, no accounts, no subscriptions.
            Store, search, and copy your code fragments in under a second.
          </p>
        </div>
      </div>

      <Hairline />

      <div>
        <Header>Audience</Header>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
          Developers who accumulate reusable code fragments — SQL queries, bash aliases, API templates,
          regex patterns, config boilerplate — and want one fast, keyboard-driven place for all of them.
        </p>
      </div>

      <Hairline />

      <div>
        <Header>Stack</Header>
        <div className="grid grid-cols-2 gap-1.5">
          {stack.map((s) => (
            <div
              key={s.name}
              className={cn(
                "flex items-start gap-2 p-2 rounded-[var(--radius-sm)]",
                "bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]"
              )}
            >
              <span className="text-[12px] font-semibold text-[var(--color-accent)] shrink-0 mt-0.5 min-w-[80px]">
                {s.name}
              </span>
              <span className="text-[12px] text-[var(--color-text-muted)]">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <Hairline />

      <div>
        <Header>Maker</Header>
        <p className="text-[13px] text-[var(--color-text)] font-semibold mb-3">TheHolyOneZ</p>
        <div className="flex flex-col gap-1.5">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <motion.button
                key={l.url}
                type="button"
                whileHover={{ x: 2 }}
                onClick={() => openUrl(l.url)}
                className={cn(
                  "flex items-center gap-2.5 px-3 h-9 rounded-[var(--radius-sm)] text-[12px]",
                  "bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]",
                  "text-[var(--color-text-muted)] hover:text-[var(--color-accent)]",
                  "hover:border-[var(--color-accent-border)] transition-colors group"
                )}
              >
                <Icon size={13} className="shrink-0" />
                <span className="flex-1 text-left">{l.label}</span>
                <span className="text-[11px] text-[var(--color-text-faint)] font-mono truncate max-w-[200px] group-hover:text-[var(--color-text-muted)] transition-colors">
                  {l.url.replace("https://", "")}
                </span>
                <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function Header({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-faint)] mb-3">
      {children}
    </h3>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="shrink-0 max-w-[220px]">
        <p className="text-[13px] font-semibold text-[var(--color-text)]">{title}</p>
        {description && (
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

function Hairline() {
  return <div className="hairline" />;
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[13px] font-semibold text-[var(--color-text)]">{label}</p>
        {description && (
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          "relative w-10 h-5.5 rounded-full transition-colors shrink-0 focus-ring outline-none",
          value
            ? "bg-[var(--color-accent)] shadow-[var(--shadow-accent)]"
            : "bg-[var(--color-bg-elevated)] border border-[var(--color-border)]"
        )}
        style={{ width: 38, height: 22 }}
      >
        <motion.span
          layout
          transition={{ type: "spring", damping: 24, stiffness: 380 }}
          className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow"
          style={{ left: value ? 18 : 2 }}
        />
      </button>
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "relative flex items-center p-0.5 gap-0.5 rounded-[var(--radius-sm)]",
        "bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]"
      )}
    >
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={cn(
              "relative px-3 h-7 rounded-[var(--radius-xs)] text-[12px] font-medium transition-colors focus-ring outline-none",
              active
                ? "text-white"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-active-${options.map((x) => x.id).join("-")}`}
                transition={{ type: "spring", damping: 26, stiffness: 380 }}
                className="absolute inset-0 rounded-[var(--radius-xs)] bg-[var(--color-accent)] shadow-[var(--shadow-accent)]"
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
