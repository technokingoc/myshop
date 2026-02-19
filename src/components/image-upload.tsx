"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { uploadImage } from "@/lib/upload";
import { useLanguage } from "@/lib/language";

const dict = {
  en: {
    drop: "Drop image or click to browse",
    uploading: "Uploading…",
    replace: "Replace",
    remove: "Remove",
    maxSize: "Max 5 MB · JPEG, PNG, WebP, GIF",
    error: "Upload failed",
  },
  pt: {
    drop: "Arraste uma imagem ou clique para escolher",
    uploading: "A carregar…",
    replace: "Substituir",
    remove: "Remover",
    maxSize: "Máx 5 MB · JPEG, PNG, WebP, GIF",
    error: "Falha no envio",
  },
};

type Props = {
  currentUrl?: string;
  onUrlChange: (url: string) => void;
  className?: string;
};

export function ImageUpload({ currentUrl, onUrlChange, className }: Props) {
  const { lang } = useLanguage();
  const t = dict[lang];
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(currentUrl || "");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    setPreview(currentUrl || "");
  }, [currentUrl]);

  const handleFile = useCallback(
    async (file: File) => {
      setError("");
      setProgress(0);
      // Local preview
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      try {
        const url = await uploadImage(file, setProgress);
        setPreview(url);
        onUrlChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.error);
        setPreview(currentUrl || "");
      } finally {
        setProgress(null);
      }
    },
    [currentUrl, onUrlChange, t.error],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const remove = () => {
    setPreview("");
    onUrlChange("");
    setError("");
  };

  if (preview && progress === null) {
    return (
      <div className={`relative inline-block ${className || ""}`}>
        <img
          src={preview}
          alt=""
          className="h-24 w-24 rounded-xl object-cover border border-slate-200"
          onError={() => {
            /* keep preview even if broken — user can replace */
          }}
        />
        <button
          type="button"
          onClick={remove}
          className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white shadow hover:bg-red-600 transition"
          title={t.remove}
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-1.5 text-xs text-green-600 hover:underline"
        >
          {t.replace}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition ${
          dragging
            ? "border-green-400 bg-green-50"
            : "border-slate-300 bg-slate-50 hover:border-green-400 hover:bg-green-50"
        }`}
      >
        {progress !== null ? (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
            <span className="text-xs font-medium text-green-600">
              {t.uploading} {progress}%
            </span>
            <div className="h-1 w-full max-w-[160px] overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-green-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-slate-400" />
            <span className="text-sm text-slate-600">{t.drop}</span>
            <span className="text-[11px] text-slate-400">{t.maxSize}</span>
          </>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-rose-600">{error}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
