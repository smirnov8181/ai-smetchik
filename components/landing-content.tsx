"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Upload,
  Brain,
  Table,
  Download,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const stats = [
  { value: "30 сек", label: "на проверку сметы" },
  { value: "120K+", label: "средняя переплата (руб.)" },
  { value: "3", label: "бесплатные сметы" },
  { value: "100+", label: "позиций в базе цен" },
];

const steps = [
  { num: "01", icon: Upload, title: "Загрузите", desc: "Текст, фото или PDF — принимаем любой формат", color: "bg-[#FA5424]" },
  { num: "02", icon: Brain, title: "AI анализ", desc: "GPT-4o извлекает работы, площади и материалы", color: "bg-[#0D8DFF]" },
  { num: "03", icon: Table, title: "Расчёт цен", desc: "Сравнение с актуальной базой цен Москвы", color: "bg-[#33C791]" },
  { num: "04", icon: Download, title: "Готово", desc: "Таблица работ с ценами и экспорт в PDF", color: "bg-[#161616]" },
];

export function LandingContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF4EC] text-[#161616] overflow-x-hidden font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF4EC]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#161616] rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#FAF4EC]" />
              </div>
              <span className="font-bold text-xl tracking-tight">AI Сметчик</span>
            </div>
            <div className="flex items-center gap-3">
              {!loading && (
                user ? (
                  <Link href="/ru/dashboard">
                    <button className="cursor-pointer bg-[#0D8DFF] text-[#161616] font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
                      В личный кабинет
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link href="/ru/login" className="hidden sm:block">
                      <button className="cursor-pointer text-[#161616]/70 hover:text-[#161616] font-medium px-4 py-2 transition-colors">
                        Войти
                      </button>
                    </Link>
                    <Link href="/ru/register">
                      <button className="cursor-pointer bg-[#33C791] text-[#161616] font-semibold px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded-full hover:opacity-90 transition-opacity">
                        Начать бесплатно
                      </button>
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-screen flex items-center pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#161616]/5 rounded-full px-4 py-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-[#33C791] animate-pulse" />
                <span className="text-sm font-medium">Бета-версия</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
                Смета на ремонт
                <br />
                <span className="text-[#0D8DFF]">за 2 минуты</span>
              </h1>

              <p className="text-xl lg:text-2xl text-[#161616]/60 mb-10 max-w-lg">
                Загрузите описание, фото или PDF — AI проанализирует и составит детальную смету с ценами на все работы и материалы.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/ru/register">
                  <button className="cursor-pointer group bg-[#0D8DFF] text-[#161616] font-semibold px-8 py-4 rounded-full text-lg hover:opacity-90 transition-all flex items-center gap-2">
                    Попробовать бесплатно
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-[#161616]/50">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#33C791]" />
                  Результат за 30 секунд
                </span>
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#0D8DFF]" />
                  3 сметы бесплатно
                </span>
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FA5424]" />
                  Экспорт в PDF
                </span>
              </div>
            </div>

            {/* Right: Demo Card */}
            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-[#161616]/10 border border-[#161616]/5">
                <div className="text-xs font-semibold text-[#161616]/40 uppercase tracking-wider mb-6">
                  Пример анализа
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#33C791]/10 border border-[#33C791]/20">
                    <span className="font-medium">Штукатурка стен</span>
                    <span className="text-[#33C791] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> 550 руб/м²
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FA5424]/10 border border-[#FA5424]/20">
                    <span className="font-medium">Укладка плитки</span>
                    <span className="text-[#FA5424] font-semibold">+40% переплата</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <span className="font-medium">Демонтаж обоев</span>
                    <span className="text-red-500 font-semibold">+316% переплата</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-[#161616]/10 flex justify-between items-center">
                  <span className="text-[#161616]/50">Переплата</span>
                  <span className="text-3xl font-bold text-red-500">~120 000 руб.</span>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -z-10 top-8 -right-8 w-full h-full bg-[#0D8DFF]/20 rounded-3xl" />
              <div className="absolute -z-20 top-16 -right-16 w-full h-full bg-[#33C791]/10 rounded-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[#161616] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-white/50 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification CTA */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Вас <span className="text-[#FA5424]">обманывают?</span>
              <br />
              <span className="text-[#0D8DFF]">Проверьте смету</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 rounded-3xl bg-[#FA5424]/10 border-2 border-[#FA5424]/20">
              <div className="text-[#FA5424] font-bold text-sm uppercase tracking-wider mb-6">Без проверки</div>
              <ul className="space-y-4">
                {["Подрядчик называет цену «на глаз»", "Не знаете рыночных цен", "Завышение на 30-100%", "Средняя переплата: 120 000 руб."].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#161616]/70">
                    <span className="text-[#FA5424] font-bold mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-[#33C791]/10 border-2 border-[#33C791]/20">
              <div className="text-[#33C791] font-bold text-sm uppercase tracking-wider mb-6">С AI Сметчиком</div>
              <ul className="space-y-4">
                {["AI проверяет каждую позицию", "Сравнение с рыночными ценами", "Видите где завышено", "Экономите десятки тысяч"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#161616]/70">
                    <span className="text-[#33C791] font-bold mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/ru/register">
              <button className="cursor-pointer group bg-[#33C791] text-[#161616] font-semibold px-8 py-4 rounded-full text-lg hover:opacity-90 transition-all inline-flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Проверить смету бесплатно
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Как это <span className="text-[#0D8DFF]">работает</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="group relative p-8 rounded-3xl bg-[#FAF4EC] hover:-translate-y-2 transition-transform duration-300">
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-7xl font-bold text-[#161616]/5 absolute top-4 right-6">{step.num}</div>
                <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                <p className="text-[#161616]/50">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Возможности
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="group p-8 rounded-3xl bg-white border border-[#161616]/10 hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-[#0D8DFF]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-[#0D8DFF]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Мультимодальный ввод</h3>
              <p className="text-[#161616]/50 leading-relaxed">Текст, PDF, фото — или всё сразу. AI разберётся с любым форматом данных.</p>
            </div>

            <div className="group p-8 rounded-3xl bg-white border border-[#161616]/10 hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-[#33C791]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-[#33C791]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Актуальные цены</h3>
              <p className="text-[#161616]/50 leading-relaxed">База цен на работы и материалы обновляется регулярно. Цены для Москвы и МО.</p>
            </div>

            <div className="group p-8 rounded-3xl bg-white border border-[#161616]/10 hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-[#FA5424]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-[#FA5424]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Экспорт в PDF</h3>
              <p className="text-[#161616]/50 leading-relaxed">Скачайте готовую смету в формате PDF для отправки подрядчику или заказчику.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Тарифы
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="p-8 rounded-3xl bg-[#FAF4EC] border border-[#161616]/10 hover:-translate-y-2 transition-all duration-300">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-1">0 <span className="text-lg font-normal text-[#161616]/50">руб./мес</span></div>
              <ul className="space-y-3 my-8">
                {["3 сметы", "Экспорт в PDF", "Email-поддержка"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#161616]/70">
                    <CheckCircle2 className="w-5 h-5 text-[#33C791] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/ru/register">
                <button className="cursor-pointer w-full bg-[#161616]/10 text-[#161616] font-semibold py-4 rounded-full hover:bg-[#161616]/20 transition-all">
                  Начать бесплатно
                </button>
              </Link>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-3xl bg-[#FAF4EC] border-2 border-[#0D8DFF] shadow-lg shadow-[#0D8DFF]/10 hover:-translate-y-2 transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0D8DFF] text-[#161616] font-semibold text-sm px-4 py-1 rounded-full">
                Популярный
              </div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-1">990 <span className="text-lg font-normal text-[#161616]/50">руб./мес</span></div>
              <ul className="space-y-3 my-8">
                {["30 смет/мес", "Экспорт в PDF и Excel", "Приоритетная обработка", "Поддержка в чате"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#161616]/70">
                    <CheckCircle2 className="w-5 h-5 text-[#33C791] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/ru/register">
                <button className="cursor-pointer w-full bg-[#0D8DFF] text-[#161616] font-semibold py-4 rounded-full hover:opacity-90 transition-all">
                  Выбрать Pro
                </button>
              </Link>
            </div>

            {/* Business */}
            <div className="p-8 rounded-3xl bg-[#FAF4EC] border border-[#161616]/10 hover:-translate-y-2 transition-all duration-300">
              <h3 className="text-xl font-bold mb-2">Business</h3>
              <div className="text-4xl font-bold mb-1">2990 <span className="text-lg font-normal text-[#161616]/50">руб./мес</span></div>
              <ul className="space-y-3 my-8">
                {["Безлимит смет", "API доступ", "Экспорт в PDF и Excel", "Выделенная поддержка", "Кастомный каталог цен"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#161616]/70">
                    <CheckCircle2 className="w-5 h-5 text-[#33C791] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/ru/register">
                <button className="cursor-pointer w-full bg-[#161616]/10 text-[#161616] font-semibold py-4 rounded-full hover:bg-[#161616]/20 transition-all">
                  Выбрать Business
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[#161616] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Не переплачивайте
            <span className="block text-[#33C791]">за ремонт.</span>
          </h2>
          <p className="text-xl text-white/50 mb-10 max-w-2xl mx-auto">
            Создайте смету или проверьте смету подрядчика — бесплатно и за 30 секунд.
          </p>
          <Link href="/ru/register">
            <button className="cursor-pointer group bg-[#33C791] text-[#161616] font-bold px-10 py-5 rounded-full text-xl hover:opacity-90 transition-all inline-flex items-center gap-2">
              Начать бесплатно
              <ArrowUpRight className="w-6 h-6 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#FAF4EC] border-t border-[#161616]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#161616] rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#FAF4EC]" />
              </div>
              <span className="font-bold">AI Сметчик</span>
            </div>
            <p className="text-sm text-[#161616]/40">&copy; 2025 AI Сметчик. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
