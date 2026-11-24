import { EditorHeader, EditorPanel } from "@/features/editor/EditorPanel";
import { useThemeShortcuts } from "@/features/editor/useThemeShortcuts";
import { PreviewPanel } from "@/features/preview/PreviewPanel";

export default function App() {
  useThemeShortcuts();

  return (
    <div className="flex h-dvh flex-col bg-background">
      <EditorHeader />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <EditorPanel />
        <PreviewPanel />
      </div>
    </div>
  );
}
