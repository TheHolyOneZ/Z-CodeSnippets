export interface Language {
  id: string;
  label: string;
  color: string;
  bgColor: string;
}

export const LANGUAGES: Language[] = [
  { id: "typescript", label: "TypeScript", color: "#38bdf8", bgColor: "rgba(56,189,248,0.12)" },
  { id: "javascript", label: "JavaScript", color: "#fbbf24", bgColor: "rgba(251,191,36,0.12)" },
  { id: "tsx", label: "TSX", color: "#818cf8", bgColor: "rgba(129,140,248,0.12)" },
  { id: "jsx", label: "JSX", color: "#f59e0b", bgColor: "rgba(245,158,11,0.12)" },
  { id: "rust", label: "Rust", color: "#fb923c", bgColor: "rgba(251,146,60,0.12)" },
  { id: "python", label: "Python", color: "#60a5fa", bgColor: "rgba(96,165,250,0.12)" },
  { id: "go", label: "Go", color: "#2dd4bf", bgColor: "rgba(45,212,191,0.12)" },
  { id: "java", label: "Java", color: "#f87171", bgColor: "rgba(248,113,113,0.12)" },
  { id: "cpp", label: "C++", color: "#a78bfa", bgColor: "rgba(167,139,250,0.12)" },
  { id: "c", label: "C", color: "#94a3b8", bgColor: "rgba(148,163,184,0.12)" },
  { id: "sql", label: "SQL", color: "#38bdf8", bgColor: "rgba(56,189,248,0.12)" },
  { id: "html", label: "HTML", color: "#f97316", bgColor: "rgba(249,115,22,0.12)" },
  { id: "css", label: "CSS", color: "#818cf8", bgColor: "rgba(129,140,248,0.12)" },
  { id: "json", label: "JSON", color: "#a3e635", bgColor: "rgba(163,230,53,0.12)" },
  { id: "markdown", label: "Markdown", color: "#94a3b8", bgColor: "rgba(148,163,184,0.12)" },
  { id: "bash", label: "Bash", color: "#4ade80", bgColor: "rgba(74,222,128,0.12)" },
  { id: "yaml", label: "YAML", color: "#fb7185", bgColor: "rgba(251,113,133,0.12)" },
  { id: "toml", label: "TOML", color: "#fdba74", bgColor: "rgba(253,186,116,0.12)" },
  { id: "regex", label: "Regex", color: "#f472b6", bgColor: "rgba(244,114,182,0.12)" },
  { id: "plaintext", label: "Plain Text", color: "#64748b", bgColor: "rgba(100,116,139,0.12)" },
];

export const LANGUAGE_MAP = new Map(LANGUAGES.map((l) => [l.id, l]));

export function getLanguage(id: string): Language {
  return LANGUAGE_MAP.get(id) ?? LANGUAGES[LANGUAGES.length - 1];
}

export function detectLanguage(filename?: string, body?: string): string {
  if (filename) {
    const ext = filename.split(".").pop()?.toLowerCase();
    const extMap: Record<string, string> = {
      ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
      rs: "rust", py: "python", go: "go", java: "java",
      cpp: "cpp", cc: "cpp", c: "c", sql: "sql", html: "html",
      css: "css", json: "json", md: "markdown", sh: "bash",
      bash: "bash", yaml: "yaml", yml: "yaml", toml: "toml",
    };
    if (ext && extMap[ext]) return extMap[ext];
  }
  if (body) {
    if (body.includes("fn main()") || body.includes("impl ")) return "rust";
    if (body.startsWith("#!/bin/bash") || body.startsWith("#!/usr/bin/env bash")) return "bash";
    if (body.includes("SELECT ") || body.includes("INSERT INTO")) return "sql";
    if (body.startsWith("{") || body.startsWith("[")) return "json";
    if (body.startsWith("<!DOCTYPE html") || body.startsWith("<html")) return "html";
  }
  return "plaintext";
}
