"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";

interface AuthGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after successful conversion with the same user (data is preserved) */
  onSuccess: () => void;
}

/**
 * Modal that appears when an anonymous user clicks "Pay".
 * Converts anon session to a registered user via updateUser().
 * The user_id stays the same — all estimates/verifications are preserved.
 */
export function AuthGateModal({ open, onOpenChange, onSuccess }: AuthGateModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Заполните email и пароль");
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Convert anonymous user to a registered one
      // This preserves the same user_id — all data stays linked
      const { error: updateError } = await supabase.auth.updateUser({
        email,
        password,
      });

      if (updateError) {
        // Handle common errors
        if (updateError.message.includes("already registered") || updateError.message.includes("already been registered")) {
          setError("Этот email уже зарегистрирован. Войдите через страницу входа.");
        } else if (updateError.message.includes("invalid") && updateError.message.includes("email")) {
          setError("Некорректный email адрес");
        } else {
          setError(updateError.message);
        }
        setIsLoading(false);
        return;
      }

      // Success — user is now registered, proceed to payment
      onSuccess();
    } catch {
      setError("Произошла ошибка. Попробуйте ещё раз.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Регистрация для оплаты
          </DialogTitle>
          <DialogDescription>
            Создайте аккаунт чтобы оплатить отчёт. Все ваши данные сохранятся.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConvert} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="modal-email">Email</Label>
            <Input
              id="modal-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-password">Пароль</Label>
            <Input
              id="modal-password"
              type="password"
              placeholder="Минимум 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Регистрация...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Зарегистрироваться и оплатить
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/ru/login" className="text-primary hover:underline">
              Войти
            </Link>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
