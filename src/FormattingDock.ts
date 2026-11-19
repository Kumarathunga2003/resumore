import { createContext } from "react";
export const FormattingDock = createContext<{
  host: HTMLDivElement | null;
  active: string;
  suggestions: ReturnType<typeof import("./writing").writingSuggestions>;
  activate: React.Dispatch<React.SetStateAction<string>>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  font: string;
  size: number;
} | null>(null);
