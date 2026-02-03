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
import { Loader2, ShieldCheck } from "lucide-react";

export function VerificationForm() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim() && files.length === 0) {
      setError("Вставьте смету подрядчика или загрузите файл");
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

      const response = await fetch("/api/verify", {
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
        throw new Error(data.error || "Failed to create verification");
      }

      router.push(`/dashboard/verify/${data.verification.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Проверить смету подрядчика</CardTitle>
            <CardDescription>
              Загрузите смету от подрядчика — AI сравнит цены с рыночными и покажет где переплата
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="contractor-estimate">Смета подрядчика</Label>
            <Textarea
              id="contractor-estimate"
              placeholder={"Вставьте текст сметы, например:\n\nШтукатурка стен — 120 м² × 800 руб. = 96 000 руб.\nУкладка плитки на пол — 25 м² × 2500 руб. = 62 500 руб.\nНатяжной потолок — 55 м² × 1200 руб. = 66 000 руб.\n..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="resize-none font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Или загрузите файл сметы (PDF, фото, XLSX)</Label>
            <FileUpload files={files} onFilesChange={setFiles} maxFiles={5} />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Как это работает:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>AI распознаёт позиции и цены из вашей сметы</li>
              <li>Сравнивает каждую позицию с рыночными ценами</li>
              <li>Показывает общую сумму переплаты бесплатно</li>
              <li>Детальный разбор по каждой позиции — 990 руб.</li>
            </ol>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Анализируем смету...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Проверить смету
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
