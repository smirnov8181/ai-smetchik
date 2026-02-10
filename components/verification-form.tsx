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
import { createClient } from "@/lib/supabase/client";

export function VerificationForm() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
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
      // Step 1: Upload files directly to Supabase Storage
      const filePaths: { path: string; name: string; type: string; size: number }[] = [];

      if (files.length > 0) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Не авторизован");

        const tempId = crypto.randomUUID();

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadProgress(`Загрузка файла ${i + 1} из ${files.length}...`);

          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const storagePath = `${user.id}/${tempId}/${safeName}`;

          const { error: uploadError } = await supabase.storage
            .from("estimate-files")
            .upload(storagePath, file, { contentType: file.type });

          if (uploadError) {
            throw new Error(`Ошибка загрузки файла ${file.name}: ${uploadError.message}`);
          }

          filePaths.push({
            path: storagePath,
            name: file.name,
            type: file.type,
            size: file.size,
          });
        }
      }

      // Step 2: Send API request — fire and forget (don't read SSE body, let server process)
      setUploadProgress("Запускаем AI анализ...");

      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim() || null,
          filePaths,
          region: "moscow",
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Ошибка сервера");
      }

      // Read the first SSE chunk to get the verification ID
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let verificationId = "";

      const { done, value } = await reader.read();
      if (!done && value) {
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.id) verificationId = data.id;
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }
      }

      if (verificationId) {
        // Continue reading the stream in background to keep the Vercel function alive
        const drainStream = async () => {
          try {
            while (true) {
              const { done } = await reader.read();
              if (done) break;
            }
          } catch {
            // Connection lost — server writes to DB independently
          }
        };
        drainStream(); // fire-and-forget

        // Redirect immediately to result page
        router.push(`/ru/dashboard/verify/${verificationId}`);
      } else {
        throw new Error("Не удалось создать проверку");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
      setUploadProgress("");
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
                {uploadProgress || "AI анализирует... (30-60 сек)"}
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
