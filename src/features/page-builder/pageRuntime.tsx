/* eslint-disable react-refresh/only-export-components -- el contexto y su hook viven con el provider para mantener una sola API pública. */
import { createContext, useContext, type ReactNode } from "react";

export interface PageRuntime {
  mode: "builder" | "public";
  /** Id real de la página; `null` mientras el borrador no se ha guardado. */
  pageId: string | null;
}

const DEFAULT_RUNTIME: PageRuntime = { mode: "builder", pageId: null };

const PageRuntimeContext = createContext<PageRuntime>(DEFAULT_RUNTIME);

export function PageRuntimeProvider({
  runtime,
  children,
}: {
  runtime: PageRuntime;
  children: ReactNode;
}) {
  return <PageRuntimeContext.Provider value={runtime}>{children}</PageRuntimeContext.Provider>;
}

/** Indica al renderer si está en el builder o en una página publicada. */
export function usePageRuntime(): PageRuntime {
  return useContext(PageRuntimeContext);
}
