"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { EstimateResult } from "@/components/estimate-result";
import { AnalysisProgress } from "@/components/analysis-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type {
  Estimate,
  EstimateResult as EstimateResultType,
} from "@/lib/supabase/types";

const POLLING_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

export default function EstimateDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const justPaid = searchParams.get("paid") === "true";
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const pollingStartRef = useRef<number>(0);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    setError(null);
    try {
      const res = await fetch(`/api/estimates/${id}/retry`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Не удалось перезапустить обработку");
        setRetrying(false);
        return;
      }
      // Read first SSE chunk then drain
      const reader = res.body?.getReader();
      if (reader) {
        reader.read().catch(() => {});
        // Fire-and-forget drain
        (async () => { try { while (!(await reader.read()).done); } catch {} })();
      }
      // Reset estimate to processing and restart polling
      setEstimate((prev) => prev ? { ...prev, status: "processing", error_message: null } as Estimate : prev);
      setRetrying(false);
      pollingStartRef.current = Date.now();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
      setRetrying(false);
    }
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    pollingStartRef.current = Date.now();

    const fetchEstimate = async () => {
      try {
        const res = await fetch(`/api/estimates/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error);
          setLoading(false);
          return;
        }

        setEstimate(data.estimate);
        if (data.isAdmin) setIsAdmin(true);
        setLoading(false);

        // Keep polling if still processing
        if (data.estimate.status === "processing") {
          interval = setInterval(async () => {
            // Client-side timeout: stop polling after 3 minutes
            if (Date.now() - pollingStartRef.current > POLLING_TIMEOUT_MS) {
              clearInterval(interval);
              setEstimate((prev) =>
                prev ? { ...prev, status: "error", error_message: "Обработка заняла слишком долго. Нажмите «Повторить» чтобы попробовать снова." } as Estimate : prev
              );
              return;
            }
            try {
              const res = await fetch(`/api/estimates/${id}`);
              const data = await res.json();
              if (res.ok) {
                setEstimate(data.estimate);
                if (data.estimate.status !== "processing") {
                  clearInterval(interval);
                }
              }
            } catch {
              // Network error — continue polling
            }
          }, 3000);
        }
      } catch {
        setError("Failed to load estimate");
        setLoading(false);
      }
    };

    fetchEstimate();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ошибка</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/ru/dashboard">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад к сметам
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!estimate) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ru/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Назад
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Смета</h1>
        <Badge variant="secondary">
          {new Date(estimate.created_at).toLocaleDateString("ru-RU")}
        </Badge>
      </div>

      {estimate.status === "processing" && (
        <AnalysisProgress type="estimate" />
      )}

      {estimate.status === "error" && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-1">
                  Ошибка обработки
                </h3>
                <p className="text-sm text-muted-foreground">
                  {estimate.error_message ||
                    "Произошла ошибка при обработке сметы. Попробуйте ещё раз."}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleRetry}
                    disabled={retrying}
                  >
                    <RefreshCw className={`mr-1 h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
                    {retrying ? "Повторяем..." : "Повторить"}
                  </Button>
                  <Link href="/ru/dashboard/estimates/new">
                    <Button variant="outline" size="sm">
                      Создать новую
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {estimate.status === "ready" && estimate.result && (
        <EstimateResult
          result={estimate.result as EstimateResultType}
          estimateId={estimate.id}
          isPaid={estimate.is_paid || justPaid || isAdmin}
          shareToken={estimate.share_token}
        />
      )}

      {/* Input preview */}
      {estimate.input_text && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Исходные данные</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {estimate.input_text}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
