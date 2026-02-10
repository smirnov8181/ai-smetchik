"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface EstimateCardProps {
  estimate: {
    id: string;
    status: string;
    input_text: string | null;
    total_amount: number | null;
    created_at: string;
  };
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Черновик", variant: "outline" },
  processing: { label: "Обработка...", variant: "secondary" },
  ready: { label: "Готово", variant: "default" },
  error: { label: "Ошибка", variant: "destructive" },
};

export function EstimateCard({ estimate }: EstimateCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const status = statusLabels[estimate.status] || statusLabels.draft;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Удалить эту смету?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/estimates/${estimate.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Не удалось удалить смету");
      }
    } catch {
      alert("Ошибка при удалении");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Link href={`/dashboard/estimates/${estimate.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer group">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {estimate.input_text?.slice(0, 80) ||
                `Смета от ${new Date(estimate.created_at).toLocaleDateString("ru-RU")}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(estimate.created_at).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            {estimate.total_amount && (
              <span className="font-semibold whitespace-nowrap">
                {Number(estimate.total_amount).toLocaleString("ru-RU")} руб.
              </span>
            )}
            <Badge variant={status.variant}>{status.label}</Badge>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
