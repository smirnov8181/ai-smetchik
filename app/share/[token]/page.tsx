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
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Share2 } from "lucide-react";
import type { EstimateResult as EstimateResultType } from "@/lib/supabase/types";

interface SharedEstimate {
  id: string;
  status: string;
  result: EstimateResultType;
  total_amount: number | null;
  created_at: string;
  input_preview: string | null;
}

export default function SharedEstimatePage() {
  const params = useParams();
  const token = params.token as string;
  const [estimate, setEstimate] = useState<SharedEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const res = await fetch(`/api/share/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Смета не найдена");
          setLoading(false);
          return;
        }

        setEstimate(data.estimate);
        setLoading(false);
      } catch {
        setError("Не удалось загрузить смету");
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Смета недоступна</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/">
              <Button variant="outline">На главную</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!estimate) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Share2 className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle>Смета на ремонт</CardTitle>
                <CardDescription>
                  Создана {new Date(estimate.created_at).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {estimate.input_preview && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {estimate.input_preview}...
              </p>
            </CardContent>
          )}
        </Card>

        {/* Estimate Result */}
        <EstimateResult
          result={estimate.result}
          estimateId={estimate.id}
          isPublic={true}
        />

        {/* CTA */}
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              Хотите создать свою смету на ремонт?
            </p>
            <Link href="/register">
              <Button>Создать бесплатно</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
