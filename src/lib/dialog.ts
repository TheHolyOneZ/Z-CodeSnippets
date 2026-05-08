import { confirm as tauriConfirm } from "@tauri-apps/plugin-dialog";

export async function confirm(
  message: string,
  title = "Z-Code Snippets"
): Promise<boolean> {
  return tauriConfirm(message, { title, kind: "warning" });
}
