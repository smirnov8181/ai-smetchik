"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { FadeIn, ScaleIn } from "@/components/ui/animations";

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
        try {
          const url = new URL(data.checkout_url);
          // Allow Stripe (US) and YooKassa (RU) payment domains
          const allowedDomains = ["stripe.com", "yoomoney.ru", "yookassa.ru"];
          const isAllowed = allowedDomains.some((d) =>
            url.hostname.endsWith(d)
          );
          if (isAllowed) {
            window.location.href = data.checkout_url;
          } else {
            console.error("Invalid checkout URL domain:", url.hostname);
          }
        } catch {
          console.error("Invalid checkout URL");
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const items = result.items ?? [];

  const { overpayItems, okItems } = useMemo(() => {
    const overpay = [...items]
      .filter((i) => i.status !== "ok")
      .sort((a, b) => (b.overpay_amount || 0) - (a.overpay_amount || 0));
    const ok = items.filter((i) => i.status === "ok");
    return { overpayItems: overpay, okItems: ok };
  }, [items]);

  const hasPaywall = !isPaid;

  // All items sorted: overpay first, then ok
  const allItems = useMemo(() => {
    return [...overpayItems, ...okItems];
  }, [overpayItems, okItems]);

  return (
    <div className="space-y-6">
      {/* Verdict Card */}
      <ScaleIn>
      <Card className={`border ${verdict.bg}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <VerdictIcon className={`h-8 w-8 ${verdict.color}`} />
              <div>
                <CardTitle className={verdict.color}>{verdict.label}</CardTitle>
                <CardDescription>
                  Проверено {items.length} позиций
                </CardDescription>
              </div>
            </div>
            {hasPaywall ? (
              <Badge variant={verdict.badge} className="text-lg px-4 py-1">
                {result.verdict === "fair" ? "OK" : result.verdict === "slightly_overpriced" ? "Есть переплата" : "Переплата"}
              </Badge>
            ) : (
              <Badge variant={verdict.badge} className="text-lg px-4 py-1">
                {result.overpay_percent > 0 ? `+${result.overpay_percent}%` : "OK"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasPaywall ? (
            /* Free version: blurred totals */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Смета подрядчика</p>
                <p className="text-lg font-semibold blur-sm select-none">
                  {formatPrice(result.total_contractor)} руб.
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Рыночная цена</p>
                <p className="text-lg font-semibold blur-sm select-none">
                  {formatPrice(result.total_market_avg)} руб.
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Переплата</p>
                <p className="text-lg font-bold text-red-600 blur-sm select-none">
                  *** *** руб.
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Завышенных позиций</p>
                <p className="text-lg font-semibold">
                  {overpayItems.length} из {result.items.length}
                </p>
              </div>
            </div>
          ) : (
            /* Paid version: show everything */
            <>
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
                    {overpayItems.length} из {items.length}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground">{result.summary}</p>
            </>
          )}
        </CardContent>
      </Card>
      </ScaleIn>

      {/* Items table — always visible, but with limited info for free users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            {hasPaywall ? `Позиции с завышенной ценой` : "Все позиции сметы"}
          </CardTitle>
          <CardDescription>
            {hasPaywall
              ? `Найдено ${overpayItems.length} завышенных из ${items.length} позиций`
              : "Детальное сравнение каждой позиции с рыночными ценами"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Работа</TableHead>
                  <TableHead className="text-right">Подрядчик</TableHead>
                  {!hasPaywall && (
                    <TableHead className="text-right">Рынок (ср.)</TableHead>
                  )}
                  <TableHead className="text-right">Оценка</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(hasPaywall ? overpayItems.slice(0, 10) : allItems).map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {hasPaywall ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        statusIcons[item.status]
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.work}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatPrice(item.contractor_price)} руб./{item.unit}
                    </TableCell>
                    {!hasPaywall && (
                      <TableCell className="text-right whitespace-nowrap">
                        {formatPrice(item.market_avg)} руб./{item.unit}
                      </TableCell>
                    )}
                    <TableCell className="text-right whitespace-nowrap">
                      {hasPaywall ? (
                        <span className="blur-sm select-none text-muted-foreground">***</span>
                      ) : item.status === "ok" ? (
                        <span className="text-green-600 font-medium">OK</span>
                      ) : (
                        <span className="font-semibold text-red-600">
                          +{item.overpay_percent}%
                          <span className="block text-xs font-normal">
                            {formatPrice(item.overpay_amount)} руб.
                          </span>
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Show locked rows hint for remaining items */}
                {hasPaywall && (
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={3} className="text-center py-4">
                      <span className="text-sm text-muted-foreground">
                        <Lock className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                        {overpayItems.length > 10
                          ? `Ещё ${overpayItems.length - 10} завышенных + ${okItems.length} адекватных позиций`
                          : `+ ${okItems.length} позиций с адекватной ценой`}
                        {" "}в полном отчёте
                      </span>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Paywall block — for unpaid users */}
      {hasPaywall && (
        <Card className="border-primary/30 bg-gradient-to-b from-background to-muted/30">
          <CardContent className="pt-8 pb-8 px-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>

              <h3 className="text-xl font-bold mb-2">
                {overpayItems.length > 0
                  ? `Найдено ${overpayItems.length} завышенных позиций`
                  : "Анализ завершён"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Откройте полный отчёт: точная сумма переплаты, рыночные цены по каждой позиции и аргументы для торга с подрядчиком
              </p>

              {/* Benefits grid */}
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-6 text-left">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Точная сумма переплаты</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Рыночные цены для торга</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Сравнение по каждой позиции</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Рекомендации по экономии</span>
                </div>
              </div>

              {/* Social proof */}
              <div className="bg-muted/50 rounded-lg px-4 py-3 mb-6 max-w-md mx-auto">
                <p className="text-sm italic text-muted-foreground">
                  &laquo;Показал подрядчику отчёт — он сразу снизил цену на 40 000 руб.&raquo;
                </p>
              </div>

              <Button
                size="lg"
                className="text-lg px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-shadow"
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
                Разовый платёж &bull; Банковская карта &bull; Моментальный доступ
              </p>
            </div>
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
