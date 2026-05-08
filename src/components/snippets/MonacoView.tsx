import Editor, { type OnMount } from "@monaco-editor/react";
import { useUiStore } from "@/store/ui";

interface Props {
  value: string;
  onChange?: (value: string) => void;
  language: string;
  readOnly?: boolean;
  height?: string;
}

function toMonacoLang(lang: string): string {
  const map: Record<string, string> = {
    typescript: "typescript", tsx: "typescript",
    javascript: "javascript", jsx: "javascript",
    python: "python", rust: "rust", sql: "sql",
    html: "html", css: "css", json: "json",
    markdown: "markdown", java: "java",
    cpp: "cpp", c: "c", go: "go",
    bash: "shell", yaml: "yaml", toml: "ini",
  };
  return map[lang] ?? "plaintext";
}

export default function MonacoView({
  value,
  onChange,
  language,
  readOnly = false,
  height = "100%",
}: Props) {
  const { fontSize, wordWrap, showLineNumbers, tabSize } = useUiStore();

  const handleMount: OnMount = (editor) => {
    if (!readOnly) return;
    const node = editor.getDomNode();
    if (!node) return;
    node.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          e.stopImmediatePropagation();
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("zcs:copy-selected"));
        }
      },
      true,
    );
  };

  return (
    <Editor
      height={height}
      language={toMonacoLang(language)}
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      theme="vs-dark"
      onMount={handleMount}
      options={{
        readOnly,
        fontSize,
        fontFamily: '"JetBrains Mono Variable", "JetBrains Mono", "Fira Code", ui-monospace, monospace',
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: wordWrap ? "on" : "off",
        lineNumbers: showLineNumbers ? "on" : "off",
        tabSize,
        glyphMargin: false,
        folding: true,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: readOnly ? "none" : "line",
        readOnlyMessage: readOnly ? { value: "" } : undefined,
      }}
    />
  );
}
