"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { ContractorWorkItem } from "@/lib/supabase/types";

interface ParsedItemsTableProps {
  items: ContractorWorkItem[];
}

function formatPrice(amount: number): string {
  return amount.toLocaleString("ru-RU");
}

export function ParsedItemsTable({ items }: ParsedItemsTableProps) {
  // Group by category
  const grouped = items.reduce((acc, item) => {
    const cat = item.category || "Другое";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ContractorWorkItem[]>);

  const total = items.reduce((sum, item) => sum + item.contractor_total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Распознанные позиции сметы
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category}>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">
              {category}
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[45%]">Работа</TableHead>
                    <TableHead className="text-right">Кол-во</TableHead>
                    <TableHead className="text-right">Цена/ед.</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.work}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.contractor_price)} руб.
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(item.contractor_total)} руб.
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center pt-4 border-t">
          <span className="font-semibold">Итого по смете подрядчика:</span>
          <span className="text-xl font-bold">{formatPrice(total)} руб.</span>
        </div>
      </CardContent>
    </Card>
  );
}
