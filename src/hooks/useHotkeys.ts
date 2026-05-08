import { useEffect, useRef } from "react";


type HotkeyHandler = (e: KeyboardEvent) => void | false;
type HotkeyMap = Record<string, HotkeyHandler>;

export function useHotkeys(map: HotkeyMap, active = true) {
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    if (!active) return;

    const handler = (e: KeyboardEvent) => {
      const key = buildKey(e);
      if (!key) return;
      const fn = mapRef.current[key];
      if (!fn) return;
      const result = fn(e);
      if (result !== false) e.preventDefault();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active]);
}


function buildKey(e: KeyboardEvent): string {
  const k = e.key;
  if (k === "Control" || k === "Meta" || k === "Shift" || k === "Alt") return "";

  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("ctrl");
  if (e.shiftKey) parts.push("shift");
  if (e.altKey) parts.push("alt");
  parts.push(k.toLowerCase());
  return parts.join("+");
}
