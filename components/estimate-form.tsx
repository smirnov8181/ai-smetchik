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
import { AnonLimitReached } from "@/components/anon-limit-reached";
import { Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function EstimateForm() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [anonLimit, setAnonLimit] = useState<{ used: number; limit: number } | null>(null);
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
      // Step 1: Upload files directly to Supabase Storage (bypass Vercel payload limit)
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

      const response = await fetch("/api/estimates", {
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
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error === "anon_limit") {
            setAnonLimit({ used: errJson.used, limit: errJson.limit });
            setIsSubmitting(false);
            setUploadProgress("");
            return;
          }
          throw new Error(errJson.message || errJson.error || "Ошибка сервера");
        } catch (parseErr) {
          if (parseErr instanceof SyntaxError) {
            throw new Error(errText || "Ошибка сервера");
          }
          throw parseErr;
        }
      }

      // Read the first SSE chunk to get the estimate ID
      // IMPORTANT: We keep a reference to the response to prevent Vercel from killing the function
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let estimateId = "";

      const { done, value } = await reader.read();
      if (!done && value) {
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.id) estimateId = data.id;
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }
      }

      if (estimateId) {
        // Continue reading the stream in background to keep the Vercel function alive
        // (if we abandon the stream, Vercel may kill the serverless function)
        const drainStream = async () => {
          try {
            while (true) {
              const { done } = await reader.read();
              if (done) break;
            }
          } catch {
            // Connection lost — that's ok, server writes to DB independently
          }
        };
        drainStream(); // fire-and-forget — don't await

        // Redirect immediately to result page
        router.push(`/ru/dashboard/estimates/${estimateId}`);
      } else {
        throw new Error("Не удалось создать смету");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  if (anonLimit) {
    return <AnonLimitReached used={anonLimit.used} limit={anonLimit.limit} />;
  }

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

          <Link
            href="/ru/dashboard/verify/new"
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted transition-colors"
          >
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-medium">Уже есть смета от подрядчика?</span>
              <span className="text-muted-foreground"> Загрузите её в </span>
              <span className="font-medium text-primary">Проверку сметы</span>
              <span className="text-muted-foreground"> — мы найдём завышенные позиции.</span>
            </div>
          </Link>

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
              "Рассчитать смету"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
