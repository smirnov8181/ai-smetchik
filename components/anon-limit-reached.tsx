"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, UserPlus, LogIn } from "lucide-react";
import Link from "next/link";

interface AnonLimitReachedProps {
  used: number;
  limit: number;
}

export function AnonLimitReached({ used, limit }: AnonLimitReachedProps) {
  return (
    <Card className="border-orange-200 bg-gradient-to-b from-orange-50/50 to-white dark:from-orange-900/10 dark:to-slate-900">
      <CardContent className="py-12 px-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 mb-6">
            <Lock className="h-8 w-8 text-orange-500" />
          </div>

          <h2 className="text-2xl font-bold mb-2">
            Лимит бесплатных проверок исчерпан
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Вы использовали {used} из {limit} бесплатных проверок.
            Зарегистрируйтесь, чтобы продолжить пользоваться сервисом.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/ru/register">
                <UserPlus className="mr-2 h-5 w-5" />
                Зарегистрироваться
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8">
              <Link href="/ru/login">
                <LogIn className="mr-2 h-5 w-5" />
                Войти
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Регистрация бесплатна. Оплата только за полные отчёты.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
