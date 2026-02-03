"use client";

import { useCallback, useState } from "react";
import { Upload, X, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

export function FileUpload({
  files,
  onFilesChange,
  maxFiles = 10,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

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
          f.type.startsWith("image/") || f.type === "application/pdf"
      );

      const newFiles = [...files, ...droppedFiles].slice(0, maxFiles);
      onFilesChange(newFiles);
    },
    [files, onFilesChange, maxFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selected = Array.from(e.target.files);
        const newFiles = [...files, ...selected].slice(0, maxFiles);
        onFilesChange(newFiles);
      }
    },
    [files, onFilesChange, maxFiles]
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
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-2">
          Перетащите файлы сюда или нажмите для выбора
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          PDF, JPG, PNG (макс. {maxFiles} файлов)
        </p>
        <label>
          <Button variant="outline" size="sm" asChild>
            <span>Выбрать файлы</span>
          </Button>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileSelect}
          />
        </label>
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
