"use client";

import { createContext, useContext } from "react";

// null = no highlighting active (normal view).
// a Set = "find me" mode is active; ids in the set are part of the selected
// person's direct line (their ancestors up through the patriarch, plus all
// of their own descendants) and should render at full opacity. Everything
// else dims.
export const HighlightContext = createContext<Set<string> | null>(null);

export function useHighlight() {
  return useContext(HighlightContext);
}
