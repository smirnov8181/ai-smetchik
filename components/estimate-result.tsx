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
import { FileSpreadsheet, AlertTriangle, Loader2, Info, TrendingUp, Share2, Check, Link, PieChart, Lightbulb } from "lucide-react";

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

// "What if" scenarios for decision simulation
interface WhatIfScenario {
  id: string;
  label: string;
  description: string;
  condition: (sections: EstimateResultType["sections"]) => boolean;
  impact: (sections: EstimateResultType["sections"]) => number; // negative = savings
}

const whatIfScenarios: WhatIfScenario[] = [
  {
    id: "shower-instead-of-bath",
    label: "Душ вместо ванны",
    description: "Душевая кабина дешевле и экономит место",
    condition: (sections) => sections.some(s =>
      s.items.some(i => i.work.toLowerCase().includes("ванн"))
    ),
    impact: () => -35000,
  },
  {
    id: "no-heated-floor",
    label: "Без тёплого пола",
    description: "Убрать электрический тёплый пол",
    condition: (sections) => sections.some(s =>
      s.items.some(i => i.work.toLowerCase().includes("тёплый пол") || i.work.toLowerCase().includes("теплый пол"))
    ),
    impact: (sections) => {
      const item = sections.flatMap(s => s.items).find(i =>
        i.work.toLowerCase().includes("тёплый пол") || i.work.toLowerCase().includes("теплый пол")
      );
      return item ? -item.total : -25000;
    },
  },
  {
    id: "paint-instead-of-wallpaper",
    label: "Покраска вместо обоев",
    description: "Покраска дешевле и проще в уходе",
    condition: (sections) => sections.some(s =>
      s.items.some(i => i.work.toLowerCase().includes("обои") || i.work.toLowerCase().includes("обоев"))
    ),
    impact: () => -15000,
  },
  {
    id: "laminate-instead-of-parquet",
    label: "Ламинат вместо паркета",
    description: "Качественный ламинат визуально не отличить",
    condition: (sections) => sections.some(s =>
      s.items.some(i => i.work.toLowerCase().includes("паркет"))
    ),
    impact: () => -40000,
  },
  {
    id: "no-ceiling-multi",
    label: "Простой потолок",
    description: "Одноуровневый вместо многоуровневого",
    condition: (sections) => sections.some(s =>
      s.items.some(i => i.work.toLowerCase().includes("потолок") &&
        (i.work.toLowerCase().includes("многоуров") || i.work.toLowerCase().includes("двухуров")))
    ),
    impact: () => -20000,
  },
  {
    id: "less-demolition",
    label: "Частичный демонтаж",
    description: "Оставить часть старого покрытия где возможно",
    condition: (sections) => sections.some(s =>
      s.category.toLowerCase().includes("демонтаж") ||
      s.items.some(i => i.work.toLowerCase().includes("демонтаж"))
    ),
    impact: (sections) => {
      const demolitionSection = sections.find(s => s.category.toLowerCase().includes("демонтаж"));
      return demolitionSection ? Math.round(-demolitionSection.subtotal * 0.3) : -10000;
    },
  },
  {
    id: "premium-tile",
    label: "Плитка премиум-класса",
    description: "Дизайнерская плитка для акцентных зон",
    condition: (sections) => sections.some(s =>
      s.items.some(i => i.work.toLowerCase().includes("плитк"))
    ),
    impact: (sections) => {
      const tileItems = sections.flatMap(s => s.items).filter(i =>
        i.work.toLowerCase().includes("плитк")
      );
      const tileMaterials = tileItems.reduce((sum, i) => sum + i.material_cost, 0);
      return Math.round(tileMaterials * 0.8); // +80% на материалы
    },
  },
  {
    id: "premium-plumbing",
    label: "Сантехника Grohe/Hansgrohe",
    description: "Немецкие бренды вместо среднего сегмента",
    condition: (sections) => sections.some(s =>
      s.category.toLowerCase().includes("сантех") ||
      s.items.some(i => i.work.toLowerCase().includes("смесител") || i.work.toLowerCase().includes("унитаз"))
    ),
    impact: () => 45000,
  },
];

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
  const [activeScenarios, setActiveScenarios] = useState<Set<string>>(new Set());

  // Filter applicable "what if" scenarios
  const applicableScenarios = whatIfScenarios.filter(s => s.condition(result.sections));

  // Calculate total impact from active scenarios
  const scenariosImpact = Array.from(activeScenarios).reduce((sum, id) => {
    const scenario = whatIfScenarios.find(s => s.id === id);
    return sum + (scenario ? scenario.impact(result.sections) : 0);
  }, 0);

  const toggleScenario = (id: string) => {
    setActiveScenarios(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Recalculate prices based on quality tier + scenarios
  const tierConfig = qualityTiers[qualityTier];
  const adjustedMaterials = Math.round(result.subtotal_materials * tierConfig.multiplier);
  const materialsDiff = adjustedMaterials - result.subtotal_materials;
  const baseTotal = result.subtotal_labor + adjustedMaterials + result.overhead;
  const adjustedOverhead = Math.round(baseTotal * 0.1);
  const totalBeforeScenarios = result.subtotal_labor + adjustedMaterials + adjustedOverhead;
  const finalTotal = totalBeforeScenarios + scenariosImpact;
  const totalDiff = finalTotal - result.total; // Total diff from original

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
      {/* Main Summary Card - Unified Price & Materials */}
      <Card className="overflow-hidden border-0 shadow-lg">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold tracking-tight">Смета готова</CardTitle>
              <CardDescription className="mt-1.5 text-sm">{humanSummary}</CardDescription>
            </div>
            <Badge variant={conf.variant} className="text-xs px-2.5 py-1">
              {conf.shortLabel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-8">
          {/* Unified Price Block with Materials Selector */}
          <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">

            {/* Material Tier Toggle Group */}
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center mb-4 font-medium">
                Уровень материалов
              </p>
              <div className="flex justify-center gap-3">
                {(Object.keys(qualityTiers) as QualityTier[]).map((tier) => {
                  const isSelected = qualityTier === tier;
                  return (
                    <button
                      key={tier}
                      onClick={() => setQualityTier(tier)}
                      className={`
                        relative flex-1 max-w-[140px] py-3 px-4 rounded-2xl transition-all duration-200
                        ${isSelected
                          ? "bg-white dark:bg-slate-800 shadow-lg ring-2 ring-primary/20 border border-primary/30"
                          : "bg-slate-100/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-transparent"
                        }
                      `}
                    >
                      <div className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-slate-600 dark:text-slate-300"}`}>
                        {qualityTiers[tier].label}
                      </div>
                      <div className={`text-xs mt-0.5 ${isSelected ? "text-primary/70" : "text-slate-400"}`}>
                        {formatPrice(tierPrices[tier])} ₽
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-slate-800" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-600 to-transparent mb-6" />

            {/* Main Price Display */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">
                Ориентировочная стоимость
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {formatPrice(finalTotal)}
                </span>
                <span className="text-2xl font-medium text-slate-400">₽</span>
              </div>

              {/* Diff indicator */}
              {totalDiff !== 0 && (
                <div className={`
                  inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-sm font-medium
                  ${totalDiff > 0
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                    : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  }
                `}>
                  {totalDiff > 0 ? "+" : ""}{formatPrice(totalDiff)} ₽
                </div>
              )}

              {/* Price range */}
              <p className="text-sm text-slate-400 mt-3">
                от {formatPrice(minPrice)} до {formatPrice(maxPrice)} ₽
              </p>

              {activeScenarios.size > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  с учётом {activeScenarios.size} {activeScenarios.size === 1 ? "изменения" : "изменений"}
                </p>
              )}
            </div>
          </div>

          {/* Recommendation pill */}
          <div className="flex items-start gap-3 bg-amber-50/80 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800/50">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
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

      {/* Summary Total - so user doesn't need to scroll up */}
      <Card className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Итого по смете</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {qualityTiers[qualityTier].label} • {result.sections.reduce((sum, s) => sum + s.items.length, 0)} позиций
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{formatPrice(finalTotal)}</span>
                <span className="text-lg text-muted-foreground">₽</span>
              </div>
              {totalDiff !== 0 && (
                <span className={`text-sm font-medium ${totalDiff > 0 ? "text-orange-500" : "text-green-500"}`}>
                  {totalDiff > 0 ? "+" : ""}{formatPrice(totalDiff)} ₽ от базовой
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What if scenarios - decision simulator */}
      {applicableScenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
              А что если...
            </CardTitle>
            <CardDescription>
              Посмотрите, как изменится стоимость при других решениях
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {applicableScenarios.map((scenario) => {
              const impact = scenario.impact(result.sections);
              const isActive = activeScenarios.has(scenario.id);
              const isSaving = impact < 0;

              return (
                <button
                  key={scenario.id}
                  onClick={() => toggleScenario(scenario.id)}
                  className={`
                    w-full text-left p-4 rounded-xl border transition-all
                    ${isActive
                      ? isSaving
                        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                        : "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700"
                      : "hover:bg-muted/50 border-border"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-6 h-6 rounded-lg border-2 flex items-center justify-center
                        ${isActive
                          ? isSaving
                            ? "bg-green-500 border-green-500 text-white"
                            : "bg-purple-500 border-purple-500 text-white"
                          : "border-muted-foreground/30"
                        }
                      `}>
                        {isActive && <Check className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{scenario.label}</p>
                        <p className="text-sm text-muted-foreground">{scenario.description}</p>
                      </div>
                    </div>
                    <span className={`
                      font-bold text-lg whitespace-nowrap
                      ${isSaving ? "text-green-600" : "text-purple-600"}
                    `}>
                      {isSaving ? "" : "+"}{formatPrice(impact)} ₽
                    </span>
                  </div>
                </button>
              );
            })}

            {activeScenarios.size > 0 && (
              <div className="mt-4 pt-4 border-t flex items-center justify-between bg-muted/30 rounded-xl p-4">
                <div>
                  <span className="text-sm text-muted-foreground">Итого по выбранным изменениям:</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Цена вверху обновляется автоматически
                  </p>
                </div>
                <span className={`font-bold text-xl ${scenariosImpact < 0 ? "text-green-600" : "text-purple-600"}`}>
                  {scenariosImpact < 0 ? "" : "+"}{formatPrice(scenariosImpact)} ₽
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
