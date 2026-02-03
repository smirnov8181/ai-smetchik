"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EstimateSection } from "@/lib/supabase/types";

interface EstimateTableProps {
  sections: EstimateSection[];
}

function formatPrice(amount: number): string {
  return amount.toLocaleString("ru-RU");
}

export function EstimateTable({ sections }: EstimateTableProps) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.category}>
          <h3 className="font-semibold text-lg mb-3">{section.category}</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Работа</TableHead>
                  <TableHead>Комната</TableHead>
                  <TableHead className="text-right">Кол-во</TableHead>
                  <TableHead className="text-right">Цена/ед.</TableHead>
                  <TableHead className="text-right">Работа</TableHead>
                  <TableHead className="text-right">Материалы</TableHead>
                  <TableHead className="text-right">Итого</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {section.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.work}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.room}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(item.price_per_unit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(item.labor_cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(item.material_cost)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={6} className="font-semibold text-right">
                    Итого по разделу:
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatPrice(section.subtotal)} руб.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}
