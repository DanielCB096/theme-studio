import { useRef, useState, type ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadPageAsset } from "@/features/page-builder/pageAssets";
import { usePageBuilderStore } from "@/features/page-builder/pageBuilderStore";

interface LogoUploadProps {
  currentAlt: string;
  brand: string;
  onUploaded: (url: string, alt: string) => void;
}

export function LogoUpload({ currentAlt, brand, onUploaded }: LogoUploadProps) {
  const savedId = usePageBuilderStore((state) => state.savedId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setStatus(null);

    try {
      const url = await uploadPageAsset(file, savedId);
      onUploaded(url, currentAlt || brand);
      setStatus("Imagen subida y aplicada.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="logo-upload">Subir logo</Label>
      <Input
        ref={inputRef}
        id="logo-upload"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={uploading}
        onChange={(event) => void handleFile(event)}
        className="h-auto cursor-pointer py-2 text-xs file:mr-2 file:rounded-sm file:border-0 file:bg-background file:px-2 file:py-1 file:text-xs file:text-fg"
      />
      <p className="text-xs text-muted">
        PNG, JPEG o WebP · máximo 1 MB. Se guarda en tu carpeta privada de Storage.
      </p>
      {uploading ? (
        <p role="status" className="text-xs text-muted">
          Subiendo…
        </p>
      ) : null}
      {status ? (
        <p role="status" className="text-xs text-success">
          {status}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
