"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VerificationResult as VerificationResultType } from "@/lib/supabase/types";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface VerificationResultProps {
  result: VerificationResultType;
  verificationId: string;
  isPaid: boolean;
}

function formatPrice(amount: number): string {
  return amount.toLocaleString("ru-RU");
}

const verdictConfig = {
  fair: {
    label: "Справедливая цена",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    icon: CheckCircle,
    badge: "default" as const,
  },
  slightly_overpriced: {
    label: "Немного завышена",
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
    icon: AlertTriangle,
    badge: "secondary" as const,
  },
  overpriced: {
    label: "Завышена",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800",
    icon: ShieldAlert,
    badge: "destructive" as const,
  },
  ripoff: {
    label: "Сильно завышена",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    icon: XCircle,
    badge: "destructive" as const,
  },
};

const statusIcons = {
  ok: <CheckCircle className="h-4 w-4 text-green-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  overpay: <XCircle className="h-4 w-4 text-red-500" />,
};

export function VerificationResult({
  result,
  verificationId,
  isPaid,
}: VerificationResultProps) {
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  const verdict = verdictConfig[result.verdict];
  const VerdictIcon = verdict.icon;

  const handlePay = async () => {
    setIsPaymentLoading(true);
    try {
      const res = await fetch(`/api/verify/${verificationId}/pay`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.already_paid) {
        window.location.reload();
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  // Show only top 3 items free, rest behind paywall
  const freePreviewCount = 3;
  const overpayItems = [...result.items]
    .filter((i) => i.status !== "ok")
    .sort((a, b) => b.overpay_amount - a.overpay_amount);
  const okItems = result.items.filter((i) => i.status === "ok");

  return (
    <div className="space-y-6">
      {/* Verdict Card — always visible */}
      <Card className={`border ${verdict.bg}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <VerdictIcon className={`h-8 w-8 ${verdict.color}`} />
              <div>
                <CardTitle className={verdict.color}>{verdict.label}</CardTitle>
                <CardDescription>
                  Проверено {result.items.length} позиций
                </CardDescription>
              </div>
            </div>
            <Badge variant={verdict.badge} className="text-lg px-4 py-1">
              {result.overpay_percent > 0 ? `+${result.overpay_percent}%` : "OK"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Смета подрядчика</p>
              <p className="text-lg font-semibold">
                {formatPrice(result.total_contractor)} руб.
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Рыночная цена</p>
              <p className="text-lg font-semibold">
                {formatPrice(result.total_market_avg)} руб.
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Переплата</p>
              <p className="text-lg font-bold text-red-600">
                {result.total_overpay > 0
                  ? `${formatPrice(result.total_overpay)} руб.`
                  : "Нет"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Завышенных позиций</p>
              <p className="text-lg font-semibold">
                {overpayItems.length} из {result.items.length}
              </p>
            </div>
          </div>

          <p className="text-muted-foreground">{result.summary}</p>
        </CardContent>
      </Card>

      {/* Free preview: top overpriced items */}
      {overpayItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Позиции с завышенной ценой
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Работа</TableHead>
                    <TableHead className="text-right">Подрядчик</TableHead>
                    <TableHead className="text-right">Рынок (ср.)</TableHead>
                    <TableHead className="text-right">Переплата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overpayItems.slice(0, freePreviewCount).map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{statusIcons[item.status]}</TableCell>
                      <TableCell className="font-medium">{item.work}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.contractor_price)} руб./{item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.market_avg)} руб./{item.unit}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        +{item.overpay_percent}%
                        <span className="block text-xs font-normal">
                          {formatPrice(item.overpay_amount)} руб.
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Blurred/locked rows */}
                  {!isPaid &&
                    overpayItems.length > freePreviewCount &&
                    overpayItems
                      .slice(freePreviewCount, freePreviewCount + 2)
                      .map((_, i) => (
                        <TableRow key={`locked-${i}`} className="opacity-30">
                          <TableCell>
                            <Lock className="h-4 w-4" />
                          </TableCell>
                          <TableCell className="blur-sm">Работа скрыта</TableCell>
                          <TableCell className="text-right blur-sm">
                            *** руб.
                          </TableCell>
                          <TableCell className="text-right blur-sm">
                            *** руб.
                          </TableCell>
                          <TableCell className="text-right blur-sm">
                            +**%
                          </TableCell>
                        </TableRow>
                      ))}

                  {/* Show all if paid */}
                  {isPaid &&
                    overpayItems.slice(freePreviewCount).map((item, i) => (
                      <TableRow key={`paid-${i}`}>
                        <TableCell>{statusIcons[item.status]}</TableCell>
                        <TableCell className="font-medium">
                          {item.work}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPrice(item.contractor_price)} руб./{item.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPrice(item.market_avg)} руб./{item.unit}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          +{item.overpay_percent}%
                          <span className="block text-xs font-normal">
                            {formatPrice(item.overpay_amount)} руб.
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paywall */}
      {!isPaid && overpayItems.length > freePreviewCount && (
        <Card className="border-primary">
          <CardContent className="py-8 text-center">
            <Lock className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">
              Ещё {overpayItems.length - freePreviewCount + okItems.length} позиций скрыто
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Получите полный отчёт: детальный разбор каждой позиции, рыночные
              цены (мин/средн/макс) и рекомендации для разговора с подрядчиком
            </p>
            <Button
              size="lg"
              className="text-lg px-8"
              onClick={handlePay}
              disabled={isPaymentLoading}
            >
              {isPaymentLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-5 w-5" />
              )}
              Получить полный отчёт — 990 руб.
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Разовый платёж. Оплата через Stripe.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Full results if paid */}
      {isPaid && okItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Позиции с адекватной ценой
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Работа</TableHead>
                    <TableHead className="text-right">Подрядчик</TableHead>
                    <TableHead className="text-right">Рынок (ср.)</TableHead>
                    <TableHead className="text-right">Оценка</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {okItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{statusIcons[item.status]}</TableCell>
                      <TableCell className="font-medium">{item.work}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.contractor_price)} руб./{item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.market_avg)} руб./{item.unit}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        OK
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations if paid */}
      {isPaid && result.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Рекомендации</CardTitle>
            <CardDescription>
              Используйте эти аргументы при обсуждении с подрядчиком
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.recommendations.map((rec, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm p-3 rounded-md bg-muted/50"
                >
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
