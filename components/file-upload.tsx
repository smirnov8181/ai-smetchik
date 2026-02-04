"use client";

import { useCallback, useState } from "react";
import { Upload, X, FileText, Image, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

// Compress image to max 1MB / 1920px
async function compressImage(file: File): Promise<File> {
  // Skip non-images
  if (!file.type.startsWith("image/")) return file;

  // Skip small images (< 500KB)
  if (file.size < 500 * 1024) return file;

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Max dimension 1920px
      const maxDim = 1920;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            console.log(`Compressed ${file.name}: ${(file.size/1024).toFixed(0)}KB -> ${(compressedFile.size/1024).toFixed(0)}KB`);
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.8 // 80% quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

export function FileUpload({
  files,
  onFilesChange,
  maxFiles = 10,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const processFiles = useCallback(async (newFiles: File[]) => {
    setIsCompressing(true);
    try {
      const processed = await Promise.all(newFiles.map(compressImage));
      onFilesChange([...files, ...processed].slice(0, maxFiles));
    } finally {
      setIsCompressing(false);
    }
  }, [files, onFilesChange, maxFiles]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (f) =>
          f.type.startsWith("image/") ||
          f.type === "application/pdf" ||
          f.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          f.name.endsWith(".xlsx")
      );

      processFiles(droppedFiles);
    },
    [processFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selected = Array.from(e.target.files);
        processFiles(selected);
      }
    },
    [processFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      onFilesChange(newFiles);
    },
    [files, onFilesChange]
  );

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isCompressing ? (
          <>
            <Loader2 className="mx-auto h-10 w-10 text-muted-foreground mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Сжимаем изображения...
            </p>
          </>
        ) : (
          <>
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Перетащите файлы сюда или нажмите для выбора
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              PDF, JPG, PNG, XLSX (макс. {maxFiles} файлов)
            </p>
            <label>
              <Button variant="outline" size="sm" asChild>
                <span>Выбрать файлы</span>
              </Button>
              <input
                type="file"
                className="hidden"
                multiple
                accept="image/*,.pdf,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileSelect}
              />
            </label>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
            >
              {file.type.startsWith("image/") ? (
                <Image className="h-4 w-4 text-blue-500" />
              ) : file.name.endsWith(".xlsx") || file.type.includes("spreadsheet") ? (
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
              ) : (
                <FileText className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm flex-1 truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => removeFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
