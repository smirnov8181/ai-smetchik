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
import { FileSpreadsheet, AlertTriangle, Loader2, Info, TrendingUp, Share2, Check, Link, PieChart, Hammer, Package, Receipt } from "lucide-react";

interface EstimateResultProps {
  result: EstimateResultType;
  estimateId: string;
  shareToken?: string | null;
  isPublic?: boolean; // true when viewing via share link
}

function formatPrice(amount: number): string {
  return amount.toLocaleString("ru-RU");
}

function formatPercent(part: number, total: number): number {
  return Math.round((part / total) * 100);
}

// Quality tiers for materials
type QualityTier = "economy" | "standard" | "comfort";

const qualityTiers: Record<QualityTier, {
  label: string;
  multiplier: number;
  description: string;
  recommendation: string;
}> = {
  economy: {
    label: "Эконом",
    multiplier: 0.7,
    description: "Бюджетные материалы, базовое качество",
    recommendation: "⚠️ Не экономьте на плитке в мокрых зонах и на электрике — это безопасность.",
  },
  standard: {
    label: "Стандарт",
    multiplier: 1.0,
    description: "Средний сегмент, оптимальное соотношение цена/качество",
    recommendation: "✓ Оптимальный выбор для большинства квартир. Хорошее качество без переплат.",
  },
  comfort: {
    label: "Комфорт",
    multiplier: 1.5,
    description: "Качественные материалы, повышенный комфорт",
    recommendation: "Разница особенно заметна в плитке, сантехнике и напольных покрытиях.",
  },
};

// Confidence levels with human-friendly explanations
const confidenceConfig: Record<string, {
  label: string;
  shortLabel: string;
  variant: "default" | "secondary" | "destructive";
  variance: number;
  humanExplanation: string;
  whatItMeans: string;
  nextStep: string;
}> = {
  high: {
    label: "Высокая точность",
    shortLabel: "±10%",
    variant: "default",
    variance: 10,
    humanExplanation: "Мы уверены в этой оценке",
    whatItMeans: "Все работы из вашего запроса есть в нашей базе цен. Расчёт основан на реальных рыночных данных.",
    nextStep: "Можете показывать эту смету подрядчикам и сравнивать с их предложениями.",
  },
  medium: {
    label: "Средняя точность",
    shortLabel: "±20%",
    variant: "secondary",
    variance: 20,
    humanExplanation: "Хорошая оценка, но есть нюансы",
    whatItMeans: "Большинство позиций рассчитаны точно, но некоторые — по аналогам. Итоговая цена может отличаться.",
    nextStep: "Используйте как ориентир. Уточните детали у 2-3 подрядчиков перед финальным решением.",
  },
  low: {
    label: "Ориентировочная оценка",
    shortLabel: "±35%",
    variant: "destructive",
    variance: 35,
    humanExplanation: "Грубая прикидка",
    whatItMeans: "Недостаточно данных для точного расчёта. Нужны замеры и уточнение объёмов работ.",
    nextStep: "Рекомендуем вызвать замерщика. Эта сумма — только для понимания порядка цен.",
  },
};

// Generate human summary based on sections
function generateHumanSummary(sections: EstimateResultType["sections"]): string {
  const categories = sections.map(s => s.category.toLowerCase());
  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);

  const hasPrep = categories.some(c => c.includes("подготов"));
  const hasWalls = categories.some(c => c.includes("стен"));
  const hasFloor = categories.some(c => c.includes("пол"));
  const hasCeiling = categories.some(c => c.includes("потол"));
  const hasPlumbing = categories.some(c => c.includes("сантех"));
  const hasElectric = categories.some(c => c.includes("электр"));

  const parts: string[] = [];
  if (hasPrep) parts.push("подготовительные работы");
  if (hasWalls) parts.push("отделка стен");
  if (hasFloor) parts.push("полы");
  if (hasCeiling) parts.push("потолки");
  if (hasPlumbing) parts.push("сантехника");
  if (hasElectric) parts.push("электрика");

  if (parts.length === 0) {
    return `В смету включено ${totalItems} позиций работ с материалами.`;
  }

  const worksList = parts.length > 2
    ? parts.slice(0, -1).join(", ") + " и " + parts[parts.length - 1]
    : parts.join(" и ");

  return `В смету входят: ${worksList}. Всего ${totalItems} позиций с учётом материалов.`;
}

export function EstimateResult({ result, estimateId, shareToken: initialShareToken, isPublic = false }: EstimateResultProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken || null);
  const [copied, setCopied] = useState(false);
  const [qualityTier, setQualityTier] = useState<QualityTier>("standard");

  // Recalculate prices based on quality tier
  const tierConfig = qualityTiers[qualityTier];
  const adjustedMaterials = Math.round(result.subtotal_materials * tierConfig.multiplier);
  const materialsDiff = adjustedMaterials - result.subtotal_materials;
  const adjustedTotal = result.subtotal_labor + adjustedMaterials + result.overhead;
  const adjustedOverhead = Math.round(adjustedTotal * 0.1); // Recalc overhead
  const finalTotal = result.subtotal_labor + adjustedMaterials + adjustedOverhead;

  const handleShare = async () => {
    if (shareToken) {
      // Already have token, just copy
      await copyShareLink(shareToken);
      return;
    }

    setIsSharing(true);
    try {
      const response = await fetch(`/api/estimates/${estimateId}/share`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create share link");
      }

      setShareToken(data.share_token);
      await copyShareLink(data.share_token);
    } catch (error) {
      console.error("Share error:", error);
      alert(error instanceof Error ? error.message : "Ошибка создания ссылки");
    } finally {
      setIsSharing(false);
    }
  };

  const copyShareLink = async (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  // Calculate price range based on confidence variance (using adjusted total)
  const minPrice = Math.round(finalTotal * (1 - conf.variance / 100));
  const maxPrice = Math.round(finalTotal * (1 + conf.variance / 100));

  // Calculate percentages for price structure (using adjusted values)
  const laborPercent = formatPercent(result.subtotal_labor, finalTotal);
  const materialsPercent = formatPercent(adjustedMaterials, finalTotal);
  const overheadPercent = formatPercent(adjustedOverhead, finalTotal);

  // Human summary
  const humanSummary = generateHumanSummary(result.sections);

  // Calculate prices for all tiers (for comparison display)
  const tierPrices = {
    economy: Math.round(result.subtotal_labor + result.subtotal_materials * 0.7 + result.overhead * 0.9),
    standard: result.total,
    comfort: Math.round(result.subtotal_labor + result.subtotal_materials * 1.5 + result.overhead * 1.2),
  };

  return (
    <div className="space-y-6">
      {/* Main Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Ваша смета готова</CardTitle>
              <CardDescription className="mt-1">{humanSummary}</CardDescription>
            </div>
            <Badge variant={conf.variant} className="text-xs">
              {conf.shortLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quality tier selector */}
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-sm font-medium text-center mb-3">Уровень материалов</p>
            <div className="flex gap-2 justify-center">
              {(Object.keys(qualityTiers) as QualityTier[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setQualityTier(tier)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${qualityTier === tier
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-background hover:bg-muted border border-border"
                    }
                  `}
                >
                  <div>{qualityTiers[tier].label}</div>
                  <div className={`text-xs ${qualityTier === tier ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {formatPrice(tierPrices[tier])} ₽
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {tierConfig.description}
            </p>
          </div>

          {/* Main price block */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Ориентировочная стоимость ремонта</p>
              <p className="text-4xl font-bold text-primary mb-1">
                {formatPrice(finalTotal)} ₽
                {qualityTier !== "standard" && (
                  <span className={`text-lg ml-2 ${materialsDiff > 0 ? "text-orange-500" : "text-green-500"}`}>
                    {materialsDiff > 0 ? "+" : ""}{formatPrice(materialsDiff)}
                  </span>
                )}
              </p>
              <p className="text-muted-foreground">
                от {formatPrice(minPrice)} до {formatPrice(maxPrice)} ₽
              </p>
            </div>
          </div>

          {/* Quality recommendation */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {tierConfig.recommendation}
            </p>
          </div>

          {/* Price structure - visual breakdown */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-sm">Из чего складывается цена</p>
            </div>

            {/* Visual bar */}
            <div className="h-4 rounded-full overflow-hidden flex mb-3">
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${laborPercent}%` }}
                title={`Работы: ${laborPercent}%`}
              />
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${materialsPercent}%` }}
                title={`Материалы: ${materialsPercent}%`}
              />
              <div
                className="bg-orange-400 transition-all"
                style={{ width: `${overheadPercent}%` }}
                title={`Накладные: ${overheadPercent}%`}
              />
            </div>

            {/* Legend with values */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground">Работы</p>
                  <p className="font-semibold">{formatPrice(result.subtotal_labor)} ₽</p>
                  <p className="text-xs text-muted-foreground">{laborPercent}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground">Материалы</p>
                  <p className="font-semibold">{formatPrice(adjustedMaterials)} ₽</p>
                  <p className="text-xs text-muted-foreground">{materialsPercent}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground">Накладные</p>
                  <p className="font-semibold">{formatPrice(adjustedOverhead)} ₽</p>
                  <p className="text-xs text-muted-foreground">{overheadPercent}%</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Accuracy explanation - human friendly */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${
                conf.variant === "default" ? "bg-green-100 text-green-700" :
                conf.variant === "secondary" ? "bg-blue-100 text-blue-700" :
                "bg-orange-100 text-orange-700"
              }`}>
                <Info className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{conf.humanExplanation}</p>
                <p className="text-sm text-muted-foreground mt-1">{conf.whatItMeans}</p>
                <p className="text-sm font-medium mt-2 text-primary">{conf.nextStep}</p>
              </div>
            </div>
          </div>

          {/* Caveats */}
          {result.caveats.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                <AlertTriangle className="h-4 w-4" />
                Обратите внимание
              </div>
              <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                {result.caveats.map((caveat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>{caveat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-2">
            {!isPublic && (
              <Button onClick={handleExportCsv} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                Скачать CSV
              </Button>
            )}

            {!isPublic && (
              <Button
                variant={shareToken ? "outline" : "secondary"}
                onClick={handleShare}
                disabled={isSharing}
              >
                {isSharing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : copied ? (
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                ) : shareToken ? (
                  <Link className="mr-2 h-4 w-4" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                {copied ? "Ссылка скопирована!" : shareToken ? "Копировать ссылку" : "Поделиться"}
              </Button>
            )}
          </div>
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
