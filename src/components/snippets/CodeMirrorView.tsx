import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { EditorState, type Extension } from "@codemirror/state";
import { useUiStore } from "@/store/ui";

interface Props {
  value: string;
  onChange?: (value: string) => void;
  language: string;
  readOnly?: boolean;
  height?: string;
}

function getExtension(lang: string): Extension[] {
  switch (lang) {
    case "typescript":
    case "tsx":
      return [javascript({ typescript: true, jsx: lang === "tsx" })];
    case "javascript":
    case "jsx":
      return [javascript({ jsx: lang === "jsx" })];
    case "python":   return [python()];
    case "rust":     return [rust()];
    case "sql":      return [sql()];
    case "html":     return [html()];
    case "css":      return [css()];
    case "json":     return [json()];
    case "markdown": return [markdown()];
    case "java":     return [java()];
    case "cpp":
    case "c":        return [cpp()];
    default:         return [];
  }
}

const baseTheme = EditorView.theme({
  "&": { backgroundColor: "transparent" },
  ".cm-content": { paddingTop: "12px", paddingBottom: "12px" },
  ".cm-line": { paddingLeft: "16px", paddingRight: "16px" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "1px solid var(--color-border)",
    color: "var(--color-text-subtle)",
  },
});

export function CodeMirrorView({
  value,
  onChange,
  language,
  readOnly = false,
  height = "100%",
}: Props) {
  const { fontSize, wordWrap, showLineNumbers, tabSize } = useUiStore();

  const extensions = useMemo<Extension[]>(
    () => [
      baseTheme,
      ...getExtension(language),
      keymap.of(defaultKeymap),
      indentUnit.of(" ".repeat(tabSize)),
      EditorState.tabSize.of(tabSize),
      ...(wordWrap ? [EditorView.lineWrapping] : []),
      ...(readOnly ? [EditorView.editable.of(false)] : []),
    ],
    [language, tabSize, wordWrap, readOnly]
  );

  return (
    <CodeMirror
      value={value}
      height={height}
      theme={dracula}
      extensions={extensions}
      onChange={onChange}
      basicSetup={{
        lineNumbers: showLineNumbers,
        highlightActiveLine: !readOnly,
        foldGutter: showLineNumbers,
        autocompletion: !readOnly,
        bracketMatching: true,
        indentOnInput: true,
      }}
      style={{ height, fontSize: `${fontSize}px` }}
    />
  );
}
