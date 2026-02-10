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
import {
  VerificationResult as VerificationResultType,
  VerifiedWorkItem,
} from "@/lib/supabase/types";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  Share2,
  Copy,
  MessageSquareText,
  Lightbulb,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ScaleIn } from "@/components/ui/animations";

interface VerificationResultProps {
  result: VerificationResultType;
  verificationId: string;
  isPaid: boolean;
  isPublic?: boolean;
  shareToken?: string | null;
}

function formatPrice(amount: number): string {
  return amount.toLocaleString("ru-RU");
}

interface GroupedCategory {
  category: string;
  items: VerifiedWorkItem[];
  subtotalContractor: number;
  subtotalMarket: number;
  subtotalOverpay: number;
  overpayCount: number;
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
  isPublic = false,
  shareToken: initialShareToken,
}: VerificationResultProps) {
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken ?? null);
  const [isSharing, setIsSharing] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

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
          const allowedDomains = ["stripe.com", "yoomoney.ru", "yookassa.ru"];
          const isAllowed = allowedDomains.some((d) =>
            url.hostname.endsWith(d)
          );
          if (isAllowed) {
            window.location.href = data.checkout_url;
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

  // Group items by category
  const groupedCategories = useMemo((): GroupedCategory[] => {
    const map = new Map<string, VerifiedWorkItem[]>();
    for (const item of items) {
      const cat = item.category || "Прочее";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return Array.from(map.entries())
      .map(([category, catItems]) => ({
        category,
        items: catItems.sort((a, b) => (b.overpay_amount || 0) - (a.overpay_amount || 0)),
        subtotalContractor: catItems.reduce((s, i) => s + i.contractor_total, 0),
        subtotalMarket: catItems.reduce((s, i) => s + i.market_avg * i.quantity, 0),
        subtotalOverpay: catItems.reduce((s, i) => s + (i.overpay_amount || 0), 0),
        overpayCount: catItems.filter((i) => i.status !== "ok").length,
      }))
      .sort((a, b) => b.subtotalOverpay - a.subtotalOverpay);
  }, [items]);

  // Group overpay items by category for free view
  const groupedOverpayCategories = useMemo((): GroupedCategory[] => {
    return groupedCategories
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => i.status !== "ok"),
      }))
      .filter((g) => g.items.length > 0);
  }, [groupedCategories]);

  const hasPaywall = !isPaid;

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // === Export handlers ===

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const BOM = "\uFEFF";
      const rows: string[] = [];
      rows.push("AI Сметчик — Проверка сметы");
      rows.push(`ID: ${verificationId.slice(0, 8)}`);
      rows.push(`Дата: ${new Date().toLocaleDateString("ru-RU")}`);
      rows.push(`Вердикт: ${verdict.label} (+${result.overpay_percent}%)`);
      rows.push("");
      rows.push("Категория;Работа;Ед.;Кол-во;Подрядчик (руб/ед);Рынок (руб/ед);Переплата (%);Статус");

      for (const item of items) {
        const status = item.status === "ok" ? "OK" : `+${item.overpay_percent}%`;
        rows.push(
          [
            item.category || "Прочее",
            `"${item.work.replace(/"/g, '""')}"`,
            item.unit,
            item.quantity,
            item.contractor_price,
            item.market_avg,
            item.overpay_percent,
            status,
          ].join(";")
        );
      }

      rows.push("");
      rows.push(`Итого подрядчик;${result.total_contractor}`);
      rows.push(`Итого рынок;${result.total_market_avg}`);
      rows.push(`Переплата;${result.total_overpay}`);

      const blob = new Blob([BOM + rows.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proverka-${verificationId.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV export error:", error);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Load fonts
      const fontRes = await fetch("/fonts/Roboto-Regular.ttf");
      const fontBuf = await fontRes.arrayBuffer();
      const fontB64 = btoa(new Uint8Array(fontBuf).reduce((d, b) => d + String.fromCharCode(b), ""));
      doc.addFileToVFS("Roboto-Regular.ttf", fontB64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

      const boldRes = await fetch("/fonts/Roboto-Bold.ttf");
      const boldBuf = await boldRes.arrayBuffer();
      const boldB64 = btoa(new Uint8Array(boldBuf).reduce((d, b) => d + String.fromCharCode(b), ""));
      doc.addFileToVFS("Roboto-Bold.ttf", boldB64);
      doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

      doc.setFont("Roboto", "normal");

      // Title
      doc.setFont("Roboto", "bold");
      doc.setFontSize(18);
      doc.text("AI Сметчик — Проверка сметы", 14, 20);
      doc.setFont("Roboto", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`#${verificationId.slice(0, 8)} | ${new Date().toLocaleDateString("ru-RU")}`, 14, 28);

      // Verdict
      doc.setFont("Roboto", "bold");
      doc.setFontSize(14);
      doc.setTextColor(result.overpay_percent > 25 ? 200 : result.overpay_percent > 10 ? 180 : 0, result.overpay_percent > 25 ? 0 : result.overpay_percent > 10 ? 100 : 128, 0);
      doc.text(`${verdict.label} (+${result.overpay_percent}%)`, 14, 38);

      // Summary stats
      doc.setFont("Roboto", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(`Смета подрядчика: ${formatPrice(result.total_contractor)} руб.  |  Рыночная цена: ${formatPrice(result.total_market_avg)} руб.  |  Переплата: ${formatPrice(result.total_overpay)} руб.`, 14, 46);

      let yOffset = 56;

      // Items by category
      for (const group of groupedCategories) {
        if (yOffset > 250) {
          doc.addPage();
          yOffset = 20;
        }

        doc.setFont("Roboto", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0);
        const catLabel = group.overpayCount > 0
          ? `${group.category} (${group.overpayCount} завышенных)`
          : group.category;
        doc.text(catLabel, 14, yOffset);
        doc.setFont("Roboto", "normal");
        yOffset += 5;

        const tableData = group.items.map((item) => [
          item.status === "ok" ? "OK" : "X",
          item.work,
          `${formatPrice(item.contractor_price)}/${item.unit}`,
          `${formatPrice(item.market_avg)}/${item.unit}`,
          item.status === "ok" ? "OK" : `+${item.overpay_percent}%`,
        ]);

        autoTable(doc, {
          startY: yOffset,
          head: [["", "Работа", "Подрядчик", "Рынок", "Оценка"]],
          body: tableData,
          theme: "grid",
          styles: { fontSize: 8, cellPadding: 2, font: "Roboto" },
          headStyles: { fillColor: [22, 22, 22], textColor: [255, 255, 255], font: "Roboto", fontStyle: "bold" },
          columnStyles: {
            0: { cellWidth: 8, halign: "center" as const },
            1: { cellWidth: 70 },
            2: { halign: "right" as const },
            3: { halign: "right" as const },
            4: { halign: "right" as const },
          },
          margin: { left: 14, right: 14 },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yOffset = ((doc as any).lastAutoTable?.finalY ?? yOffset + 30) + 8;
      }

      // Footer
      if (yOffset > 270) { doc.addPage(); }
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Создано в AI Сметчик | ai-smetcik.vercel.app", 14, 290);

      doc.save(`proverka-${verificationId.slice(0, 8)}.pdf`);
    } catch (error) {
      console.error("PDF export error:", error);
      alert("Ошибка экспорта PDF. Попробуйте ещё раз.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/ru/share/verify/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (shareToken) {
      copyShareLink(shareToken);
      return;
    }

    setIsSharing(true);
    try {
      const res = await fetch(`/api/verify/${verificationId}/share`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.share_token) {
        setShareToken(data.share_token);
        copyShareLink(data.share_token);
      }
    } catch {
      // silently fail
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyMessage = () => {
    if (result.contractor_message) {
      navigator.clipboard.writeText(result.contractor_message);
      setMessageCopied(true);
      setTimeout(() => setMessageCopied(false), 2000);
    }
  };

  // === Render helpers ===

  const renderCategoryTable = (group: GroupedCategory, showMarket: boolean) => {
    const isCollapsed = collapsedCategories.has(group.category);

    return (
      <div key={group.category} className="border rounded-lg overflow-hidden">
        {/* Category header — clickable */}
        <button
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
          onClick={() => toggleCategory(group.category)}
        >
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-semibold text-sm">{group.category}</span>
            {group.overpayCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                {group.overpayCount} завышенных
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{group.items.length} позиций</span>
          </div>
        </button>

        {!isCollapsed && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Работа</TableHead>
                <TableHead className="text-right">Подрядчик</TableHead>
                {showMarket && <TableHead className="text-right">Рынок</TableHead>}
                <TableHead className="text-right">Оценка</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>
                    {!showMarket ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      statusIcons[item.status]
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{item.work}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {item.quantity} {item.unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatPrice(item.contractor_price)}/{item.unit}
                  </TableCell>
                  {showMarket && (
                    <TableCell className="text-right whitespace-nowrap">
                      {formatPrice(item.market_avg)}/{item.unit}
                    </TableCell>
                  )}
                  <TableCell className="text-right whitespace-nowrap">
                    {!showMarket ? (
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
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

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
                    Проверено {items.length} позиций в {groupedCategories.length} категориях
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

      {/* === GROUPED ITEMS TABLE === */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            {hasPaywall ? "Позиции с завышенной ценой" : "Детализация по категориям"}
          </CardTitle>
          <CardDescription>
            {hasPaywall
              ? `Найдено ${overpayItems.length} завышенных из ${items.length} позиций`
              : "Нажмите на категорию чтобы свернуть/развернуть"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasPaywall ? (
            <>
              {groupedOverpayCategories.slice(0, 3).map((group) => renderCategoryTable(group, false))}
              {/* Locked hint */}
              <div className="text-center py-4 bg-muted/30 rounded-lg border">
                <span className="text-sm text-muted-foreground">
                  <Lock className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                  {groupedOverpayCategories.length > 3
                    ? `Ещё ${groupedOverpayCategories.length - 3} категорий с завышениями + ${okItems.length} адекватных позиций`
                    : `+ ${okItems.length} позиций с адекватной ценой`}
                  {" "}в полном отчёте
                </span>
              </div>
            </>
          ) : (
            groupedCategories.map((group) => renderCategoryTable(group, true))
          )}
        </CardContent>
      </Card>

      {/* === PAYWALL === */}
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
                Откройте полный отчёт: точные суммы, рыночные цены, советы по переговорам и готовый текст для подрядчика
              </p>

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
                  <span>Советы по переговорам</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Готовый текст подрядчику</span>
                </div>
              </div>

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

      {/* === RECOMMENDATIONS (paid) === */}
      {isPaid && result.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Где вы переплачиваете
            </CardTitle>
            <CardDescription>
              Позиции с наибольшим завышением цены
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.recommendations.map((rec, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm p-3 rounded-md bg-muted/50"
                >
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* === NEGOTIATION TIPS (paid) === */}
      {isPaid && result.negotiation_tips && result.negotiation_tips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Как обсуждать с подрядчиком
            </CardTitle>
            <CardDescription>
              Стратегия переговоров для снижения цены
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {result.negotiation_tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm p-3 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold text-xs shrink-0">
                    {i + 1}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* === READY MESSAGE FOR CONTRACTOR (paid) === */}
      {isPaid && result.contractor_message && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-primary" />
              Готовый текст для подрядчика
            </CardTitle>
            <CardDescription>
              Скопируйте и отправьте подрядчику в мессенджер или по email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="bg-muted/50 border rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed">
                {result.contractor_message}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleCopyMessage}
              >
                {messageCopied ? (
                  <>
                    <CheckCircle className="mr-1 h-3.5 w-3.5 text-green-500" />
                    Скопировано
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Копировать
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === EXPORT BUTTONS (paid, not public) === */}
      {isPaid && !isPublic && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={isExportingCsv}>
            {isExportingCsv ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
            Скачать CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={isExportingPdf}>
            {isExportingPdf ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileText className="mr-1 h-4 w-4" />}
            Скачать PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare} disabled={isSharing}>
            {isSharing ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Создаём ссылку...
              </>
            ) : copied ? (
              <>
                <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                Ссылка скопирована
              </>
            ) : (
              <>
                <Share2 className="mr-1 h-4 w-4" />
                Поделиться
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
