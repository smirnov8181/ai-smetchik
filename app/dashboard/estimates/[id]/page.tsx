"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { EstimateResult } from "@/components/estimate-result";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import type {
  Estimate,
  EstimateResult as EstimateResultType,
} from "@/lib/supabase/types";

export default function EstimateDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

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
        setLoading(false);

        // Keep polling if still processing
        if (data.estimate.status === "processing") {
          interval = setInterval(async () => {
            const res = await fetch(`/api/estimates/${id}`);
            const data = await res.json();
            if (res.ok) {
              setEstimate(data.estimate);
              if (data.estimate.status !== "processing") {
                clearInterval(interval);
              }
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
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ошибка</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/dashboard">
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Обработка сметы
            </CardTitle>
            <CardDescription>
              AI анализирует ваши данные и составляет смету. Обычно это занимает
              30-60 секунд.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={33} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              Анализ данных и расчёт цен...
            </p>
          </CardContent>
        </Card>
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
                <Link href="/dashboard/estimates/new" className="mt-3 inline-block">
                  <Button variant="outline" size="sm">
                    Создать новую смету
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {estimate.status === "ready" && estimate.result && (
        <EstimateResult
          result={estimate.result as EstimateResultType}
          estimateId={estimate.id}
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
