"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { VerificationResult } from "@/components/verification-result";
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
import { ArrowLeft, AlertCircle, ShieldCheck, RefreshCw } from "lucide-react";
import type {
  Verification,
  VerificationResult as VerificationResultType,
} from "@/lib/supabase/types";

const POLLING_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

export default function VerificationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const justPaid = searchParams.get("paid") === "true";

  const [verification, setVerification] = useState<Verification | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const pollingStartRef = useRef<number>(0);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    setError(null);
    try {
      const res = await fetch(`/api/verify/${id}/retry`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Не удалось перезапустить обработку");
        setRetrying(false);
        return;
      }
      const reader = res.body?.getReader();
      if (reader) {
        reader.read().catch(() => {});
        (async () => { try { while (!(await reader.read()).done); } catch {} })();
      }
      setVerification((prev) => prev ? { ...prev, status: "processing", error_message: null } as Verification : prev);
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

    const fetchVerification = async () => {
      try {
        const res = await fetch(`/api/verify/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error);
          setLoading(false);
          return;
        }

        setVerification(data.verification);
        if (data.isAdmin) setIsAdmin(true);
        setLoading(false);

        if (data.verification.status === "processing") {
          interval = setInterval(async () => {
            // Client-side timeout
            if (Date.now() - pollingStartRef.current > POLLING_TIMEOUT_MS) {
              clearInterval(interval);
              setVerification((prev) =>
                prev ? { ...prev, status: "error", error_message: "Обработка заняла слишком долго. Нажмите «Повторить» чтобы попробовать снова." } as Verification : prev
              );
              return;
            }
            try {
              const res = await fetch(`/api/verify/${id}`);
              const data = await res.json();
              if (res.ok) {
                setVerification(data.verification);
                if (data.verification.status !== "processing") {
                  clearInterval(interval);
                }
              }
            } catch {
              // Network error — continue polling
            }
          }, 3000);
        }
      } catch {
        setError("Failed to load verification");
        setLoading(false);
      }
    };

    fetchVerification();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
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
            <Link href="/ru/dashboard">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verification) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ru/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Назад
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          Проверка сметы
        </h1>
        <Badge variant="secondary">
          {new Date(verification.created_at).toLocaleDateString("ru-RU")}
        </Badge>
      </div>

      {verification.status === "processing" && (
        <AnalysisProgress type="verification" />
      )}

      {verification.status === "error" && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-1">
                  Ошибка анализа
                </h3>
                <p className="text-sm text-muted-foreground">
                  {verification.error_message ||
                    "Не удалось распознать смету. Попробуйте загрузить в другом формате."}
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
                  <Link href="/ru/dashboard/verify/new">
                    <Button variant="outline" size="sm">
                      Загрузить заново
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {verification.status === "ready" && verification.result && (
        <VerificationResult
          result={verification.result as VerificationResultType}
          verificationId={verification.id}
          isPaid={verification.is_paid || justPaid || isAdmin}
          shareToken={verification.share_token}
        />
      )}

      {verification.input_text && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Исходная смета подрядчика</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/50 p-4 rounded-lg">
              {verification.input_text}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
