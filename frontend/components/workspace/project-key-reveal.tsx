"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ProjectKeyRevealContextValue = {
  storeProjectKey: (projectId: string, key: string) => void;
  takeProjectKey: (projectId: string) => string | null;
};

const ProjectKeyRevealContext = createContext<ProjectKeyRevealContextValue | null>(null);

/** Holds a newly generated key only while the user completes this page flow.
 * It is deliberately not backed by localStorage, sessionStorage, a URL, or a
 * React Query cache. A refresh makes the key unavailable, as intended.
 */
export function ProjectKeyRevealProvider({ children }: { children: React.ReactNode }) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const storeProjectKey = useCallback((projectId: string, key: string) => {
    setKeys((current) => ({ ...current, [projectId]: key }));
  }, []);
  const takeProjectKey = useCallback((projectId: string) => {
    const revealed = keys[projectId] || null;
    if (revealed) {
      setKeys((current) => {
        const { [projectId]: _discarded, ...remaining } = current;
        return remaining;
      });
    }
    return revealed;
  }, [keys]);
  return <ProjectKeyRevealContext.Provider value={{ storeProjectKey, takeProjectKey }}>{children}</ProjectKeyRevealContext.Provider>;
}

export function useProjectKeyReveal() {
  const value = useContext(ProjectKeyRevealContext);
  if (!value) throw new Error("useProjectKeyReveal must be used within ProjectKeyRevealProvider");
  return value;
}
