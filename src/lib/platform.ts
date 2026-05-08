
const ua =
  typeof navigator !== "undefined"
    ? `${navigator.platform || ""} ${navigator.userAgent || ""}`
    : "";

export const IS_MAC = /Mac|iPhone|iPad|iPod/i.test(ua);
export const IS_WINDOWS = /Win/i.test(ua) && !IS_MAC;
export const IS_LINUX = /Linux/i.test(ua) && !IS_MAC && !IS_WINDOWS;


export const MOD_LABEL = IS_MAC ? "⌘" : "Ctrl";


const MAC_SYMBOLS: Record<string, string> = {
  ctrl: "⌘",
  cmd: "⌘",
  shift: "⇧",
  alt: "⌥",
  opt: "⌥",
  enter: "↵",
  return: "↵",
  esc: "⎋",
  escape: "⎋",
  tab: "⇥",
  del: "⌫",
  delete: "⌫",
  backspace: "⌫",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

const PC_LABELS: Record<string, string> = {
  ctrl: "Ctrl",
  cmd: "Ctrl",
  shift: "Shift",
  alt: "Alt",
  opt: "Alt",
  enter: "Enter",
  return: "Enter",
  esc: "Esc",
  escape: "Esc",
  tab: "Tab",
  del: "Del",
  delete: "Del",
  backspace: "Backspace",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

export function shortcutParts(spec: string): string[] {
  const map = IS_MAC ? MAC_SYMBOLS : PC_LABELS;
  return spec.split("+").map((p) => {
    const lower = p.trim().toLowerCase();
    return map[lower] ?? p.trim();
  });
}

export function formatShortcut(spec: string): string {
  const parts = shortcutParts(spec);
  return IS_MAC ? parts.join("") : parts.join("+");
}
