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
import { Download, FileSpreadsheet, AlertTriangle, Loader2 } from "lucide-react";

interface EstimateResultProps {
  result: EstimateResultType;
  estimateId: string;
}

function formatPrice(amount: number): string {
  return amount.toLocaleString("ru-RU");
}

const confidenceLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  high: { label: "Высокая точность", variant: "default" },
  medium: { label: "Средняя точность", variant: "secondary" },
  low: { label: "Низкая точность", variant: "destructive" },
};

export function EstimateResult({ result, estimateId }: EstimateResultProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const handleExport = async (format: "pdf" | "csv") => {
    const setExporting = format === "pdf" ? setIsExportingPdf : setIsExportingCsv;
    setExporting(true);
    try {
      const response = await fetch(`/api/estimates/${estimateId}/export?format=${format}`, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smeta-${estimateId.slice(0, 8)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => handleExport("pdf");
  const handleExportCsv = () => handleExport("csv");

  const conf = confidenceLabels[result.confidence] || confidenceLabels.medium;

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

          {/* Totals */}
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
              <p className="text-2xl font-bold text-primary">
                {formatPrice(result.total)} руб.
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex gap-2">
            <Button onClick={handleExportPdf} disabled={isExportingPdf}>
              {isExportingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Скачать PDF
            </Button>
            <Button onClick={handleExportCsv} disabled={isExportingCsv} variant="outline">
              {isExportingCsv ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              Скачать CSV
            </Button>
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
