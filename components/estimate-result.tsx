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
import { EstimateTable } from "@/components/estimate-table";
import { EstimateResult as EstimateResultType } from "@/lib/supabase/types";
import { FileSpreadsheet, AlertTriangle, Loader2, Info, TrendingUp } from "lucide-react";

interface EstimateResultProps {
  result: EstimateResultType;
  estimateId: string;
}

function formatPrice(amount: number): string {
  return amount.toLocaleString("ru-RU");
}

// Confidence levels with detailed explanations and variance
const confidenceConfig: Record<string, {
  label: string;
  variant: "default" | "secondary" | "destructive";
  variance: number; // percentage
  explanation: string;
  marketComment: string;
}> = {
  high: {
    label: "Высокая точность",
    variant: "default",
    variance: 10,
    explanation: "±10% — все позиции найдены в каталоге цен, расчёт основан на актуальных рыночных данных",
    marketComment: "Цены соответствуют рынку для среднего сегмента. Можно использовать для переговоров с подрядчиком.",
  },
  medium: {
    label: "Средняя точность",
    variant: "secondary",
    variance: 20,
    explanation: "±20% — часть позиций рассчитана по аналогам, рекомендуется уточнить у подрядчика",
    marketComment: "Ориентировочная оценка. Финальная цена может отличаться в зависимости от сложности работ и выбранных материалов.",
  },
  low: {
    label: "Низкая точность",
    variant: "destructive",
    variance: 35,
    explanation: "±35% — недостаточно данных для точного расчёта, требуется выезд замерщика",
    marketComment: "Предварительная оценка. Обязательно получите детальную смету от подрядчика перед началом работ.",
  },
};

export function EstimateResult({ result, estimateId }: EstimateResultProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/estimates/${estimateId}/export?format=csv`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smeta-${estimateId.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert(error instanceof Error ? error.message : "Ошибка экспорта");
    } finally {
      setIsExporting(false);
    }
  };

  const conf = confidenceConfig[result.confidence] || confidenceConfig.medium;

  // Calculate price range based on confidence variance
  const minPrice = Math.round(result.total * (1 - conf.variance / 100));
  const maxPrice = Math.round(result.total * (1 + conf.variance / 100));

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Результат сметы</CardTitle>
              <CardDescription>AI-анализ завершён</CardDescription>
            </div>
            <Badge variant={conf.variant}>{conf.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{result.summary}</p>

          {/* Main price with range */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Ориентировочная стоимость</p>
              <p className="text-3xl font-bold text-primary">
                {formatPrice(result.total)} руб.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                диапазон: {formatPrice(minPrice)} — {formatPrice(maxPrice)} руб.
              </p>
            </div>
          </div>

          {/* Accuracy explanation */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                  {conf.label} ({conf.explanation.split(" — ")[0]})
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {conf.explanation.split(" — ")[1]}
                </p>
              </div>
            </div>
          </div>

          {/* Market comment */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200 text-sm">
                  Оценка рынка
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {conf.marketComment}
                </p>
              </div>
            </div>
          </div>

          {result.caveats.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                <AlertTriangle className="h-4 w-4" />
                Важные примечания
              </div>
              <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                {result.caveats.map((caveat, i) => (
                  <li key={i}>{caveat}</li>
                ))}
              </ul>
            </div>
          )}

          <Separator className="my-4" />

          {/* Totals breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Работы</p>
              <p className="text-lg font-semibold">
                {formatPrice(result.subtotal_labor)} руб.
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Материалы</p>
              <p className="text-lg font-semibold">
                {formatPrice(result.subtotal_materials)} руб.
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Накладные (10%)</p>
              <p className="text-lg font-semibold">
                {formatPrice(result.overhead)} руб.
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Итого</p>
              <p className="text-lg font-semibold text-primary">
                {formatPrice(result.total)} руб.
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <Button onClick={handleExportCsv} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Скачать CSV
          </Button>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Детализация работ</CardTitle>
        </CardHeader>
        <CardContent>
          <EstimateTable sections={result.sections} />
        </CardContent>
      </Card>
    </div>
  );
}
