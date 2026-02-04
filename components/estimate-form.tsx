"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { Loader2 } from "lucide-react";

export function EstimateForm() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim() && files.length === 0) {
      setError("Введите описание или загрузите файлы");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      if (text.trim()) {
        formData.append("text", text.trim());
      }
      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch("/api/estimates", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        console.error("Failed to parse response:", responseText);
        throw new Error("Ошибка сервера. Попробуйте позже.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to create estimate");
      }

      router.push(`/dashboard/estimates/${data.estimate.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Новая смета</CardTitle>
        <CardDescription>
          Опишите проект ремонта текстом и/или загрузите файлы (PDF, фото)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Описание проекта</Label>
            <Textarea
              id="description"
              placeholder="Например: 2-комнатная квартира 55м², косметический ремонт. Кухня 10м² — укладка плитки на пол и фартук, покраска стен. Комната 18м² — поклейка обоев, ламинат. Санузел 4м² — плитка на стены и пол."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Файлы (необязательно)</Label>
            <FileUpload files={files} onFilesChange={setFiles} />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI анализирует... (30-60 сек)
              </>
            ) : (
              "Рассчитать смету"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
