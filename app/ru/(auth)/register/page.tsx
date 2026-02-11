"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FileText, Loader2, Mail, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { YandexAuthButton } from "@/components/yandex-auth-button";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Пароль должен быть не менее 8 символов");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/ru/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Try to sign in immediately (works when email confirmation is disabled)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError) {
      router.push("/ru/dashboard");
      return;
    }

    // If sign-in failed (email confirmation required), show confirmation screen
    setSuccess(true);
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/ru/dashboard`,
      },
    });
  };



  if (success) {
    return (
      <div className="min-h-screen bg-[#FAF4EC] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-[#161616]/10 border border-[#161616]/5 text-center">
            <div className="w-16 h-16 bg-[#33C791]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-[#33C791]" />
            </div>
            <h1 className="text-2xl font-bold text-[#161616] mb-2">Проверьте почту</h1>
            <p className="text-[#161616]/50 mb-6">
              Мы отправили письмо с подтверждением на <span className="font-medium text-[#161616]">{email}</span>. Перейдите по ссылке в письме для завершения регистрации.
            </p>
            <button
              onClick={() => router.push("/ru/login")}
              className="cursor-pointer w-full bg-[#0D8DFF] text-[#161616] font-semibold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              Перейти к входу
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF4EC] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/ru" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#161616] rounded-xl flex items-center justify-center">
            <FileText className="h-6 w-6 text-[#FAF4EC]" />
          </div>
          <span className="font-bold text-2xl text-[#161616]">AI Сметчик</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-[#161616]/10 border border-[#161616]/5">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#161616] mb-2">Создать аккаунт</h1>
            <p className="text-[#161616]/50">Зарегистрируйтесь и получите 3 бесплатные сметы</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#161616] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#161616]/30" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-[#161616]/10 bg-[#FAF4EC] text-[#161616] placeholder:text-[#161616]/30 focus:outline-none focus:ring-2 focus:ring-[#0D8DFF] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#161616] mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#161616]/30" />
                <input
                  id="password"
                  type="password"
                  placeholder="Минимум 8 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-[#161616]/10 bg-[#FAF4EC] text-[#161616] placeholder:text-[#161616]/30 focus:outline-none focus:ring-2 focus:ring-[#0D8DFF] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-[#FA5424] bg-[#FA5424]/10 p-4 rounded-xl border border-[#FA5424]/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer group w-full bg-[#33C791] text-[#161616] font-semibold py-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>Зарегистрироваться</span>
              {!loading && (
                <div className="-rotate-45 transition-all duration-200 group-hover:rotate-0">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#161616]/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-[#161616]/40">или</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoogleSignUp}
              className="cursor-pointer w-full bg-white border-2 border-[#161616]/10 text-[#161616] font-semibold py-4 rounded-xl hover:bg-[#FAF4EC] transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Зарегистрироваться через Google
            </button>

            <YandexAuthButton />
          </div>

          <p className="text-sm text-center text-[#161616]/50 mt-6">
            Уже есть аккаунт?{" "}
            <Link href="/ru/login" className="text-[#0D8DFF] font-medium hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
