import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Upload } from "lucide-react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { motion, AnimatePresence } from "framer-motion";
import { FileImportModal } from "./FileImportModal";
import { cn } from "@/lib/cn";

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingPaths, setPendingPaths] = useState<string[] | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    getCurrentWebview()
      .onDragDropEvent((event) => {
        const type = event.payload.type;
        if (type === "enter")     setIsDragging(true);
        else if (type === "drop") {
          setIsDragging(false);
          const paths: string[] = (event.payload as { paths?: string[] }).paths ?? [];
          if (paths.length > 0) setPendingPaths(paths);
        } else setIsDragging(false);
      })
      .then((fn) => { unlisten = fn; });

    return () => { unlisten?.(); };
  }, []);

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" />

              <motion.div
                initial={{ scale: 0.9, y: 6 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 6 }}
                transition={{ type: "spring", damping: 22, stiffness: 320 }}
                className={cn(
                  "relative flex flex-col items-center gap-4 px-14 py-12 rounded-[var(--radius-xl)]",
                  "border-2 border-dashed glass"
                )}
                style={{
                  borderColor: "var(--color-accent)",
                  backgroundColor: "var(--color-accent-subtle)",
                  boxShadow: "var(--shadow-accent)",
                }}
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--color-accent)" }}
                >
                  <Upload size={28} className="text-white" />
                </motion.div>
                <div className="text-center">
                  <p className="text-[15px] font-semibold" style={{ color: "var(--color-accent)" }}>
                    Drop to import
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                    Text, code, and config files supported
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {pendingPaths && (
        <FileImportModal
          paths={pendingPaths}
          onClose={() => setPendingPaths(null)}
        />
      )}
    </>
  );
}
