"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, ShieldCheck } from "lucide-react";

interface VerificationCardProps {
  verification: {
    id: string;
    status: string;
    total_contractor: number | null;
    overpay_percent: number | null;
    is_paid: boolean | null;
    created_at: string;
  };
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Черновик", variant: "outline" },
  processing: { label: "Обработка...", variant: "secondary" },
  ready: { label: "Готово", variant: "default" },
  error: { label: "Ошибка", variant: "destructive" },
};

export function VerificationCard({ verification }: VerificationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const status = statusLabels[verification.status] || statusLabels.draft;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Удалить эту проверку?")) return;

    setIsDeleting(true);
    try {
      console.log(`Deleting verification ${verification.id}`);
      const response = await fetch(`/api/verify/${verification.id}`, {
        method: "DELETE",
      });

      console.log(`Delete response status: ${response.status}`);
      const responseText = await response.text();
      console.log(`Delete response body: ${responseText}`);

      if (response.ok) {
        router.refresh();
      } else {
        let errorMsg = "Не удалось удалить проверку";
        try {
          const data = JSON.parse(responseText);
          errorMsg = data.error || errorMsg;
        } catch {
          errorMsg = responseText || errorMsg;
        }
        alert(`Ошибка: ${errorMsg} (status: ${response.status})`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert(`Ошибка при удалении: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Link href={`/dashboard/verify/${verification.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer group">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Проверка от{" "}
              {new Date(verification.created_at).toLocaleDateString("ru-RU")}
            </p>
            <p className="text-sm text-muted-foreground">
              {verification.total_contractor
                ? `Смета: ${Number(verification.total_contractor).toLocaleString("ru-RU")} руб.`
                : "Обработка..."}
            </p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            {verification.overpay_percent != null && Number(verification.overpay_percent) > 0 && (
              <span className="font-semibold text-red-600 whitespace-nowrap">
                +{Number(verification.overpay_percent).toFixed(0)}% переплата
              </span>
            )}
            {verification.is_paid && (
              <Badge variant="outline">Оплачено</Badge>
            )}
            <Badge variant={status.variant}>{status.label}</Badge>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
