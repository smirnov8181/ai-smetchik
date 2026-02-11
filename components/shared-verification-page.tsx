"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VerificationResult } from "@/components/verification-result";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ShieldCheck } from "lucide-react";
import type { VerificationResult as VerificationResultType } from "@/lib/supabase/types";
import { FooterRu } from "@/components/footer-ru";

interface SharedVerification {
  id: string;
  status: string;
  result: VerificationResultType;
  total_contractor: number | null;
  total_market: number | null;
  overpay_amount: number | null;
  overpay_percent: number | null;
  created_at: string;
}

export function SharedVerificationContent({ token }: { token: string }) {
  const [verification, setVerification] = useState<SharedVerification | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const res = await fetch(`/api/share/verify/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Проверка не найдена");
          setLoading(false);
          return;
        }

        setVerification(data.verification);
        setLoading(false);
      } catch {
        setError("Не удалось загрузить проверку");
        setLoading(false);
      }
    };

    fetchVerification();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF4EC]">
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
      <div className="min-h-screen bg-[#FAF4EC] flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Проверка недоступна
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/ru">
              <Button variant="outline">На главную</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verification) return null;

  return (
    <div className="min-h-screen bg-[#FAF4EC] flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto p-6 space-y-6 w-full">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-[#33C791]" />
              <div>
                <CardTitle>Проверка сметы подрядчика</CardTitle>
                <CardDescription>
                  Проверена{" "}
                  {new Date(verification.created_at).toLocaleDateString(
                    "ru-RU",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                  {verification.overpay_percent != null &&
                    verification.overpay_percent > 0 && (
                      <span className="ml-2 text-[#FA5424] font-medium">
                        Переплата +{verification.overpay_percent}%
                      </span>
                    )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Verification Result */}
        <VerificationResult
          result={verification.result}
          verificationId={verification.id}
          isPaid={true}
          isPublic={true}
        />

        {/* CTA */}
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              Хотите проверить свою смету на завышенные цены?
            </p>
            <Link href="/ru/dashboard/verify/new">
              <Button className="bg-[#33C791] text-[#161616] hover:bg-[#33C791]/90">
                Попробовать бесплатно
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <FooterRu />
    </div>
  );
}
