import { useState, useCallback } from "react";
import { toast } from "sonner";

const MAX_HISTORY = 30;

export function useFileHistory(initialFiles: Record<string, string>) {
  const [history, setHistory] = useState<Record<string, string>[]>([{ ...initialFiles }]);
  const [index, setIndex] = useState(0);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  const pushSnapshot = useCallback((files: Record<string, string>) => {
    setHistory((h) => {
      const trimmed = h.slice(0, index + 1);
      return [...trimmed, { ...files }].slice(-MAX_HISTORY);
    });
    setIndex((i) => i + 1);
  }, [index]);

  const undo = useCallback((): Record<string, string> | null => {
    if (index <= 0) return null;
    const newIndex = index - 1;
    setIndex(newIndex);
    const snapshot = history[newIndex];
    toast.info("↩️ Undo — état précédent restauré");
    return { ...snapshot };
  }, [index, history]);

  const redo = useCallback((): Record<string, string> | null => {
    if (index >= history.length - 1) return null;
    const newIndex = index + 1;
    setIndex(newIndex);
    const snapshot = history[newIndex];
    toast.info("↪️ Redo — état suivant restauré");
    return { ...snapshot };
  }, [index, history]);

  return { canUndo, canRedo, undo, redo, pushSnapshot };
}
