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
    console.log("[Form] handleSubmit called", { text: text.trim(), filesCount: files.length });

    if (!text.trim() && files.length === 0) {
      console.log("[Form] Validation failed - no input");
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
        console.log("[Form] Appending file:", file.name, file.type, file.size);
      }

      console.log("[Form] Sending request to /api/verify...");
      const response = await fetch("/api/verify", {
        method: "POST",
        body: formData,
      });

      console.log("[Form] Response received:", response.status, response.ok);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Ошибка сервера");
      }

      // Handle streaming response (SSE)
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let verificationId = "";
      let finalStatus = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("[Form] Stream done");
          break;
        }

        const text = decoder.decode(value);
        console.log("[Form] Stream chunk:", text);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.id) verificationId = data.id;
              if (data.status === "ready" || data.status === "error") {
                finalStatus = data.status;
                if (data.error) {
                  throw new Error(data.error);
                }
              }
            } catch (parseErr) {
              // Ignore parse errors for heartbeats
              if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
                throw parseErr;
              }
            }
          }
        }
      }

      if (verificationId) {
        router.push(`/dashboard/verify/${verificationId}`);
      } else {
        throw new Error("Не удалось создать проверку");
      }
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
                AI анализирует... (30-60 сек)
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
