"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  ArrowUpRight,
  Shield,
  Clock,
  Upload,
  Brain,
  Table,
  Download,
  AlertTriangle,
  CheckCircle2,
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
  { num: "01", icon: Upload, title: "Загрузите", desc: "Текст, фото или PDF — любой формат" },
  { num: "02", icon: Brain, title: "AI анализ", desc: "GPT-4o извлекает работы, площади и материалы" },
  { num: "03", icon: Table, title: "Расчёт цен", desc: "Сравнение с актуальной базой цен Москвы" },
  { num: "04", icon: Download, title: "Готово", desc: "Таблица с ценами и экспорт в PDF" },
];

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    if (ref.current) {
      // cleanup
    }
    ref.current = node;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
  }, []);

  return { ref: callbackRef, inView };
}

export function LandingContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const heroAnim = useInView();
  const statsAnim = useInView();
  const ctaAnim = useInView();
  const stepsAnim = useInView();
  const pricingAnim = useInView();
  const finalAnim = useInView();

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
    <div className="min-h-screen bg-[#FFFFEB] text-[#1A1A1A] overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFFEB]/80 backdrop-blur-md border-b border-[#1A1A1A]/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#034F46] rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#FFFFEB]" />
              </div>
              <span className="font-heading text-xl font-semibold tracking-tight">AI Сметчик</span>
            </div>
            <div className="flex items-center gap-3">
              {!loading && (
                user ? (
                  <Link href="/ru/dashboard">
                    <button className="cursor-pointer bg-[#F0D7FF] border border-[#1A1A1A] text-[#1A1A1A] font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
                      В личный кабинет
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link href="/ru/login" className="hidden sm:block">
                      <button className="cursor-pointer text-[#1A1A1A]/70 hover:text-[#1A1A1A] font-medium px-4 py-2 transition-colors">
                        Войти
                      </button>
                    </Link>
                    <Link href="/ru/register">
                      <button className="cursor-pointer bg-[#F0D7FF] border border-[#1A1A1A] text-[#1A1A1A] font-semibold px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded-xl hover:opacity-90 transition-opacity">
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
          <div
            ref={heroAnim.ref}
            className={`grid lg:grid-cols-2 gap-12 items-center transition-all duration-700 ${heroAnim.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#034F46]/5 rounded-full px-4 py-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-[#034F46] animate-pulse" />
                <span className="text-sm font-medium text-[#1A1A1A]/70">AI-powered</span>
              </div>

              <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl xl:text-[96px] leading-[1.05] tracking-tight mb-6">
                Смета на ремонт
                <br />
                <em className="italic text-[#034F46]">за 2 минуты</em>
              </h1>

              <p className="text-xl lg:text-2xl text-[#1A1A1A]/50 mb-10 max-w-lg leading-relaxed">
                Загрузите описание, фото или PDF — AI составит детальную смету с актуальными ценами.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/ru/register">
                  <button className="cursor-pointer group bg-[#F0D7FF] border border-[#1A1A1A] text-[#1A1A1A] font-semibold px-8 py-4 rounded-xl text-lg hover:opacity-90 transition-all flex items-center gap-2">
                    Попробовать бесплатно
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-[#1A1A1A]/50">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#034F46]" />
                  Результат за 30 секунд
                </span>
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#034F46]" />
                  3 сметы бесплатно
                </span>
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#034F46]" />
                  Экспорт в PDF
                </span>
              </div>
            </div>

            {/* Right: Demo Card */}
            <div className="relative">
              <div className="bg-white rounded-[14px] p-8 border border-[#1A1A1A]/10">
                <div className="text-xs font-semibold text-[#1A1A1A]/40 uppercase tracking-wider mb-6">
                  Пример анализа
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-[10px] bg-[#034F46]/5 border border-[#034F46]/10">
                    <span className="font-medium">Штукатурка стен</span>
                    <span className="text-[#034F46] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> 550 руб/м²
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-[10px] bg-[#FA5424]/10 border border-[#FA5424]/20">
                    <span className="font-medium">Укладка плитки</span>
                    <span className="text-[#FA5424] font-semibold">+40% переплата</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-[10px] bg-red-500/10 border border-red-500/20">
                    <span className="font-medium">Демонтаж обоев</span>
                    <span className="text-red-500 font-semibold">+316% переплата</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-[#1A1A1A]/10 flex justify-between items-center">
                  <span className="text-[#1A1A1A]/50">Переплата</span>
                  <span className="text-3xl font-heading font-bold text-red-500">~120 000 руб.</span>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -z-10 top-6 -right-6 w-full h-full bg-[#F0D7FF]/30 rounded-[14px]" />
              <div className="absolute -z-20 top-12 -right-12 w-full h-full bg-[#034F46]/5 rounded-[14px]" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[#034F46] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div
            ref={statsAnim.ref}
            className={`grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-700 ${statsAnim.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-heading text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-white/50 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification CTA */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div
            ref={ctaAnim.ref}
            className={`text-center mb-16 transition-all duration-700 ${ctaAnim.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl mb-6 leading-[1.1]">
              Вас <span className="text-[#FA5424]">обманывают?</span>
              <br />
              <em className="italic text-[#034F46]">Проверьте смету</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 rounded-[14px] bg-[#FA5424]/5 border border-[#FA5424]/20">
              <div className="text-[#FA5424] font-semibold text-sm uppercase tracking-wider mb-6">Без проверки</div>
              <ul className="space-y-4">
                {["Подрядчик называет цену «на глаз»", "Не знаете рыночных цен", "Завышение на 30-100%", "Средняя переплата: 120 000 руб."].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#1A1A1A]/70">
                    <span className="text-[#FA5424] mt-0.5 shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 rounded-[14px] bg-[#F0D7FF]/20 border border-[#F0D7FF]">
              <div className="text-[#034F46] font-semibold text-sm uppercase tracking-wider mb-6">С AI Сметчиком</div>
              <ul className="space-y-4">
                {["AI проверяет каждую позицию", "Сравнение с рыночными ценами", "Видите где завышено", "Экономите десятки тысяч"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#1A1A1A]/70">
                    <span className="text-[#034F46] mt-0.5 shrink-0">
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
              <button className="cursor-pointer group bg-[#F0D7FF] border border-[#1A1A1A] text-[#1A1A1A] font-semibold px-8 py-4 rounded-xl text-lg hover:opacity-90 transition-all inline-flex items-center gap-2">
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
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl leading-[1.1]">
              Как это <em className="italic text-[#034F46]">работает</em>
            </h2>
          </div>

          <div
            ref={stepsAnim.ref}
            className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto"
          >
            {steps.map((step, i) => (
              <div
                key={i}
                className={`group relative p-8 rounded-[14px] bg-[#FFFFEB] border border-[#1A1A1A]/5 hover:-translate-y-1 transition-all duration-300 ${stepsAnim.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: stepsAnim.inView ? `${i * 100}ms` : "0ms" }}
              >
                <div className="w-16 h-16 bg-[#034F46] rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="font-heading text-7xl font-bold text-[#1A1A1A]/5 absolute top-4 right-6">{step.num}</div>
                <h3 className="font-heading text-2xl font-semibold mb-2">{step.title}</h3>
                <p className="text-[#1A1A1A]/50">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl leading-[1.1]">
              Тарифы
            </h2>
          </div>

          <div
            ref={pricingAnim.ref}
            className={`grid md:grid-cols-3 gap-8 max-w-4xl mx-auto transition-all duration-700 ${pricingAnim.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            {/* Free */}
            <div className="p-8 rounded-[14px] bg-white border border-[#1A1A1A]/10 hover:-translate-y-1 transition-all duration-300">
              <h3 className="font-heading text-xl font-semibold mb-2">Free</h3>
              <div className="font-heading text-4xl font-bold mb-1">0 <span className="text-lg font-normal text-[#1A1A1A]/50">руб./мес</span></div>
              <ul className="space-y-3 my-8">
                {["3 сметы", "Экспорт в PDF", "Email-поддержка"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#1A1A1A]/70">
                    <CheckCircle2 className="w-5 h-5 text-[#034F46] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/ru/register">
                <button className="cursor-pointer w-full bg-[#FFFFEB] border border-[#1A1A1A] text-[#1A1A1A] font-semibold py-4 rounded-xl hover:bg-[#1A1A1A]/5 transition-all">
                  Начать бесплатно
                </button>
              </Link>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-[14px] bg-white border-2 border-[#034F46] hover:-translate-y-1 transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#034F46] text-white font-semibold text-sm px-4 py-1 rounded-full">
                Популярный
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">Pro</h3>
              <div className="font-heading text-4xl font-bold mb-1">990 <span className="text-lg font-normal text-[#1A1A1A]/50">руб./мес</span></div>
              <ul className="space-y-3 my-8">
                {["30 смет/мес", "Экспорт в PDF и Excel", "Приоритетная обработка", "Поддержка в чате"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#1A1A1A]/70">
                    <CheckCircle2 className="w-5 h-5 text-[#034F46] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/ru/register">
                <button className="cursor-pointer w-full bg-[#F0D7FF] border border-[#1A1A1A] text-[#1A1A1A] font-semibold py-4 rounded-xl hover:opacity-90 transition-all">
                  Выбрать Pro
                </button>
              </Link>
            </div>

            {/* Business */}
            <div className="p-8 rounded-[14px] bg-white border border-[#1A1A1A]/10 hover:-translate-y-1 transition-all duration-300">
              <h3 className="font-heading text-xl font-semibold mb-2">Business</h3>
              <div className="font-heading text-4xl font-bold mb-1">2990 <span className="text-lg font-normal text-[#1A1A1A]/50">руб./мес</span></div>
              <ul className="space-y-3 my-8">
                {["Безлимит смет", "API доступ", "Экспорт в PDF и Excel", "Выделенная поддержка", "Кастомный каталог цен"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#1A1A1A]/70">
                    <CheckCircle2 className="w-5 h-5 text-[#034F46] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/ru/register">
                <button className="cursor-pointer w-full bg-[#FFFFEB] border border-[#1A1A1A] text-[#1A1A1A] font-semibold py-4 rounded-xl hover:bg-[#1A1A1A]/5 transition-all">
                  Выбрать Business
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[#034F46] text-white">
        <div
          ref={finalAnim.ref}
          className={`max-w-4xl mx-auto px-6 text-center transition-all duration-700 ${finalAnim.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl mb-6 leading-[1.1]">
            Не переплачивайте
            <span className="block"><em className="italic text-[#F0D7FF]">за ремонт.</em></span>
          </h2>
          <p className="text-xl text-white/50 mb-10 max-w-2xl mx-auto">
            Создайте смету или проверьте смету подрядчика — бесплатно и за 30 секунд.
          </p>
          <Link href="/ru/register">
            <button className="cursor-pointer group bg-[#F0D7FF] border border-[#F0D7FF] text-[#1A1A1A] font-bold px-10 py-5 rounded-xl text-xl hover:opacity-90 transition-all inline-flex items-center gap-2">
              Начать бесплатно
              <ArrowUpRight className="w-6 h-6 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#FFFFEB] border-t border-[#1A1A1A]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#034F46] rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#FFFFEB]" />
              </div>
              <span className="font-heading font-semibold">AI Сметчик</span>
            </div>
            <p className="text-sm text-[#1A1A1A]/40">&copy; 2025 AI Сметчик. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
