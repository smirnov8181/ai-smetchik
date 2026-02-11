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
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  CountUp,
  FloatingCard,
  ScaleIn,
} from "@/components/ui/animations";

const stats: { value: number; suffix: string; label: string }[] = [
  { value: 30, suffix: " сек", label: "на проверку сметы" },
  { value: 120, suffix: "K+", label: "средняя переплата (руб.)" },
  { value: 24, suffix: "/7", label: "обновляемая база цен" },
  { value: 100, suffix: "+", label: "позиций в базе цен" },
];

const steps = [
  { num: "01", icon: Upload, title: "Загрузите", desc: "Текст, фото или PDF — принимаем любой формат", color: "bg-[#FA5424]" },
  { num: "02", icon: Brain, title: "AI анализ", desc: "Модель извлекает работы, площади и материалы", color: "bg-[#0D8DFF]" },
  { num: "03", icon: Table, title: "Расчёт цен", desc: "Сравнение с актуальной базой цен Москвы", color: "bg-[#33C791]" },
  { num: "04", icon: Download, title: "Готово", desc: "Таблица работ с ценами и экспорт в CSV и PDF", color: "bg-[#161616]" },
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
              <FadeIn delay={0.1} direction="up">
                <div className="inline-flex items-center gap-2 bg-[#161616]/5 rounded-full px-4 py-2 mb-8">
                  <span className="w-2 h-2 rounded-full bg-[#33C791] animate-pulse" />
                  <span className="text-sm font-medium">Бета-версия</span>
                </div>
              </FadeIn>

              <FadeIn delay={0.2} direction="up">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
                  Смета на ремонт
                  <br />
                  <span className="text-[#0D8DFF]">за 2 минуты</span>
                </h1>
              </FadeIn>

              <FadeIn delay={0.35} direction="up">
                <p className="text-xl lg:text-2xl text-[#161616]/60 mb-10 max-w-lg">
                  Загрузите описание, фото или PDF — AI проанализирует и составит детальную смету с ценами на все работы и материалы.
                </p>
              </FadeIn>

              <FadeIn delay={0.5} direction="up">
                <div className="flex flex-wrap gap-4 mb-8">
                  <Link href="/ru/register">
                    <button className="cursor-pointer group bg-[#0D8DFF] text-[#161616] font-semibold px-8 py-4 rounded-full text-lg hover:opacity-90 transition-all flex items-center gap-2">
                      Попробовать бесплатно
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </div>
              </FadeIn>

              <FadeIn delay={0.65} direction="up">
                <div className="flex flex-wrap items-center gap-6 text-sm text-[#161616]/50">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#33C791]" />
                    Результат за 30 секунд
                  </span>
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#0D8DFF]" />
                    Актуальная база цен
                  </span>
                  <span className="flex items-center gap-2">
                   <FileText className="w-4 h-4 text-[#FA5424]" />
                     Экспорт в CSV и PDF
                  </span>
                </div>
              </FadeIn>
            </div>

            {/* Right: Demo Card */}
            <FadeIn delay={0.4} direction="right">
              <FloatingCard className="relative">
                <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-[#161616]/10 border border-[#161616]/5">
                  <FadeIn delay={0.6} direction="none">
                    <div className="text-xs font-semibold text-[#161616]/40 uppercase tracking-wider mb-6">
                      Пример анализа
                    </div>
                  </FadeIn>
                  <div className="space-y-4">
                    <FadeIn delay={0.8} direction="left">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#33C791]/10 border border-[#33C791]/20">
                        <span className="font-medium">Штукатурка стен</span>
                        <span className="text-[#33C791] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> <CountUp value={550} duration={1.5} /> руб/м²
                        </span>
                      </div>
                    </FadeIn>
                    <FadeIn delay={1.0} direction="left">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FA5424]/10 border border-[#FA5424]/20">
                        <span className="font-medium">Укладка плитки</span>
                        <span className="text-[#FA5424] font-semibold">+<CountUp value={40} duration={1.2} />% переплата</span>
                      </div>
                    </FadeIn>
                    <FadeIn delay={1.2} direction="left">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <span className="font-medium">Демонтаж обоев</span>
                        <span className="text-red-500 font-semibold">+<CountUp value={316} duration={1.5} />% переплата</span>
                      </div>
                    </FadeIn>
                  </div>
                  <FadeIn delay={1.4} direction="up">
                    <div className="mt-6 pt-6 border-t border-[#161616]/10 flex justify-between items-center">
                      <span className="text-[#161616]/50">Переплата</span>
                      <span className="text-3xl font-bold text-red-500">~<CountUp value={120000} duration={2} format="locale" /> руб.</span>
                    </div>
                  </FadeIn>
                </div>
                {/* Decorative elements */}
                <div className="absolute -z-10 top-8 -right-8 w-full h-full bg-[#0D8DFF]/20 rounded-3xl" />
                <div className="absolute -z-20 top-16 -right-16 w-full h-full bg-[#33C791]/10 rounded-3xl" />
              </FloatingCard>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[#161616] text-[#161616]">
        <div className="max-w-7xl mx-auto px-6">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8" staggerDelay={0.15}>
            {stats.map((stat, i) => (
              <StaggerItem key={i}>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-[#161616]/50 text-sm">{stat.label}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Verification CTA */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn direction="up" className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Не уверены в <span className="text-[#FA5424]">подрядчике?</span>
              <br />
              <span className="text-[#0D8DFF]">Проверьте смету</span>
            </h2>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto" staggerDelay={0.2}>
            <StaggerItem>
              <div className="p-8 rounded-3xl bg-[#FA5424]/10 border-2 border-[#FA5424]/20 h-full">
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
            </StaggerItem>

            <StaggerItem>
              <div className="p-8 rounded-3xl bg-[#33C791]/10 border-2 border-[#33C791]/20 h-full">
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
            </StaggerItem>
          </StaggerContainer>

          <FadeIn direction="up" delay={0.3} className="text-center mt-12">
            <Link href="/ru/register">
              <button className="cursor-pointer group bg-[#33C791] text-[#161616] font-semibold px-8 py-4 rounded-full text-lg hover:opacity-90 transition-all inline-flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Проверить смету бесплатно
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn direction="up" className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Как это <span className="text-[#0D8DFF]">работает</span>
            </h2>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto" staggerDelay={0.12}>
            {steps.map((step, i) => (
              <StaggerItem key={i}>
                <div className="group relative p-8 rounded-3xl bg-[#FAF4EC] hover:-translate-y-2 transition-transform duration-300">
                  <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <step.icon className="w-8 h-8 text-[#161616]" />
                  </div>
                  <div className="text-7xl font-bold text-[#161616]/5 absolute top-4 right-6">{step.num}</div>
                  <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                  <p className="text-[#161616]/50">{step.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn direction="up" className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Возможности
            </h2>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto" staggerDelay={0.15}>
            <StaggerItem>
              <div className="group p-8 rounded-3xl bg-white border border-[#161616]/10 hover:-translate-y-2 transition-all duration-300 h-full">
                <div className="w-14 h-14 bg-[#0D8DFF]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-[#0D8DFF]" />
                </div>
                <h3 className="text-xl font-bold mb-3">Мультимодальный ввод</h3>
                <p className="text-[#161616]/50 leading-relaxed">Текст, PDF, фото — или всё сразу. AI разберётся с любым форматом данных.</p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="group p-8 rounded-3xl bg-white border border-[#161616]/10 hover:-translate-y-2 transition-all duration-300 h-full">
                <div className="w-14 h-14 bg-[#33C791]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7 text-[#33C791]" />
                </div>
                <h3 className="text-xl font-bold mb-3">Актуальные цены</h3>
                <p className="text-[#161616]/50 leading-relaxed">База цен на работы и материалы обновляется регулярно. Цены для Москвы и МО.</p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="group p-8 rounded-3xl bg-white border border-[#161616]/10 hover:-translate-y-2 transition-all duration-300 h-full">
                <div className="w-14 h-14 bg-[#FA5424]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-[#FA5424]" />
                </div>
                <h3 className="text-xl font-bold mb-3">Экспорт в CSV и PDF</h3>
                <p className="text-[#161616]/50 leading-relaxed">Скачайте готовую смету в формате CSV или PDF для отправки подрядчику или открытия в Excel.</p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn direction="up" className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Простая <span className="text-[#33C791]">оплата</span>
            </h2>
            <p className="text-xl text-[#161616]/50 mt-4 max-w-2xl mx-auto">
              Никаких подписок. Платите только за то, что вам нужно.
            </p>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto" staggerDelay={0.2}>
            {/* Create Estimate */}
            <StaggerItem>
              <div className="p-8 rounded-3xl bg-[#FAF4EC] border-2 border-[#33C791] shadow-lg shadow-[#33C791]/10 hover:-translate-y-2 transition-all duration-300 relative h-full">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#33C791] text-[#161616] font-semibold text-sm px-4 py-1 rounded-full">
                  Превью бесплатно
                </div>
                <div className="w-14 h-14 bg-[#33C791]/20 rounded-2xl flex items-center justify-center mb-6">
                  <FileText className="w-7 h-7 text-[#33C791]" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Создание сметы</h3>
                <div className="text-4xl font-bold mb-1">490 <span className="text-lg font-normal text-[#161616]/50">руб.</span></div>
                <ul className="space-y-3 my-8">
                  {["30% разделов — бесплатно", "Полная смета — 490 руб.", "AI анализ за 30 секунд", "Экспорт в CSV и шаринг"].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-[#161616]/70">
                      <CheckCircle2 className="w-5 h-5 text-[#33C791] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/ru/register">
                  <button className="cursor-pointer w-full bg-[#33C791] text-[#161616] font-semibold py-4 rounded-full hover:opacity-90 transition-all">
                    Попробовать бесплатно
                  </button>
                </Link>
              </div>
            </StaggerItem>

            {/* Verify Estimate - Paid report */}
            <StaggerItem>
              <div className="p-8 rounded-3xl bg-[#FAF4EC] border-2 border-[#0D8DFF] shadow-lg shadow-[#0D8DFF]/10 hover:-translate-y-2 transition-all duration-300 relative h-full">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0D8DFF] text-[#161616] font-semibold text-sm px-4 py-1 rounded-full">
                  Разовый платёж
                </div>
                <div className="w-14 h-14 bg-[#0D8DFF]/20 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-7 h-7 text-[#0D8DFF]" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Проверка сметы</h3>
                <div className="text-4xl font-bold mb-1">990 <span className="text-lg font-normal text-[#161616]/50">руб.</span></div>
                <ul className="space-y-3 my-8">
                  {["Бесплатное превью (3 позиции)", "Полный отчёт по всем позициям", "Процент переплаты и экономия", "Разовая оплата за отчёт"].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-[#161616]/70">
                      <CheckCircle2 className="w-5 h-5 text-[#33C791] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/ru/register">
                  <button className="cursor-pointer w-full bg-[#0D8DFF] text-[#161616] font-semibold py-4 rounded-full hover:opacity-90 transition-all">
                    Проверить смету
                  </button>
                </Link>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[#161616] text-[#161616]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeIn direction="up">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Не переплачивайте
              <span className="block text-[#33C791]">за ремонт.</span>
            </h2>
          </FadeIn>
          <FadeIn direction="up" delay={0.15}>
            <p className="text-xl text-[#161616]/50 mb-10 max-w-2xl mx-auto">
              Создайте смету или проверьте смету подрядчика — бесплатно и за 30 секунд.
            </p>
          </FadeIn>
          <FadeIn direction="up" delay={0.3}>
            <Link href="/ru/register">
              <button className="cursor-pointer group bg-[#33C791] text-[#161616] font-bold px-10 py-5 rounded-full text-xl hover:opacity-90 transition-all inline-flex items-center gap-2">
                Начать бесплатно
                <ArrowUpRight className="w-6 h-6 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </Link>
          </FadeIn>
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
