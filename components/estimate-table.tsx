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
          <div className="border rounded-lg overflow-x-auto md:overflow-x-visible">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Работа</TableHead>
                  <TableHead className="hidden lg:table-cell">Комната</TableHead>
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
                    <TableCell className="font-medium">
                      {item.work}
                      <span className="block lg:hidden text-xs text-muted-foreground font-normal">
                        {item.room}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {item.room}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
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
                  <TableCell colSpan={5} className="hidden lg:table-cell"></TableCell>
                  <TableCell className="font-semibold text-right lg:hidden" colSpan={4}>
                    Итого:
                  </TableCell>
                  <TableCell className="font-semibold text-right hidden lg:table-cell">
                    Итого по разделу:
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatPrice(section.subtotal)} ₽
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
