"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSearch,
  BarChart3,
  Calculator,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Brain,
  TrendingUp,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AnalysisStep {
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  label: string;
  description: string;
  duration: number; // ms before moving to next step
}

const ESTIMATE_STEPS: AnalysisStep[] = [
  {
    icon: <FileSearch className="h-5 w-5" />,
    activeIcon: <FileSearch className="h-5 w-5" />,
    label: "Распознаём данные",
    description: "Извлекаем информацию из файлов и текста",
    duration: 4000,
  },
  {
    icon: <Brain className="h-5 w-5" />,
    activeIcon: <Brain className="h-5 w-5" />,
    label: "Определяем виды работ",
    description: "AI выделяет помещения, площади и работы",
    duration: 8000,
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    activeIcon: <TrendingUp className="h-5 w-5" />,
    label: "Рассчитываем цены",
    description: "Сверяем с базой рыночных цен Москвы",
    duration: 10000,
  },
  {
    icon: <FileText className="h-5 w-5" />,
    activeIcon: <FileText className="h-5 w-5" />,
    label: "Формируем смету",
    description: "Генерируем детальный отчёт с разбивкой",
    duration: 12000,
  },
];

const VERIFICATION_STEPS: AnalysisStep[] = [
  {
    icon: <FileSearch className="h-5 w-5" />,
    activeIcon: <FileSearch className="h-5 w-5" />,
    label: "Распознаём позиции",
    description: "AI извлекает работы и цены из вашей сметы",
    duration: 5000,
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    activeIcon: <BarChart3 className="h-5 w-5" />,
    label: "Сравниваем с рынком",
    description: "Каждая позиция проверяется по базе цен",
    duration: 10000,
  },
  {
    icon: <Calculator className="h-5 w-5" />,
    activeIcon: <Calculator className="h-5 w-5" />,
    label: "Считаем переплату",
    description: "Определяем завышения и адекватные цены",
    duration: 8000,
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    activeIcon: <ShieldCheck className="h-5 w-5" />,
    label: "Готовим вердикт",
    description: "Формируем итоговый отчёт с рекомендациями",
    duration: 10000,
  },
];

interface AnalysisProgressProps {
  type: "estimate" | "verification";
  isComplete?: boolean;
}

export function AnalysisProgress({ type, isComplete }: AnalysisProgressProps) {
  const steps = type === "estimate" ? ESTIMATE_STEPS : VERIFICATION_STEPS;
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Animate through steps based on time
  useEffect(() => {
    if (isComplete) {
      setCurrentStep(steps.length);
      setProgress(100);
      return;
    }

    let totalElapsed = 0;
    const interval = setInterval(() => {
      totalElapsed += 100;

      // Calculate which step we're on based on cumulative durations
      let cumulative = 0;
      let step = 0;
      for (let i = 0; i < steps.length; i++) {
        cumulative += steps[i].duration;
        if (totalElapsed < cumulative) {
          step = i;
          break;
        }
        if (i === steps.length - 1) {
          step = steps.length - 1;
        }
      }

      setCurrentStep(step);

      // Calculate overall progress (0-95%, never 100 until isComplete)
      const totalDuration = steps.reduce((s, st) => s + st.duration, 0);
      const rawProgress = (totalElapsed / totalDuration) * 95;
      setProgress(Math.min(rawProgress, 95));
    }, 100);

    return () => clearInterval(interval);
  }, [isComplete, steps]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-8 pb-6 px-6">
        {/* Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              {type === "estimate" ? (
                <Calculator className="h-7 w-7 text-primary" />
              ) : (
                <ShieldCheck className="h-7 w-7 text-primary" />
              )}
            </div>
          </motion.div>
          <motion.h2
            className="text-xl font-bold mb-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {type === "estimate"
              ? "AI составляет смету"
              : "AI анализирует смету"}
          </motion.h2>
          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Обычно это занимает 30-60 секунд
          </motion.p>
        </div>

        {/* Progress bar */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-muted-foreground">
              {Math.round(progress)}%
            </span>
            <span className="text-xs text-muted-foreground">
              ~{Math.max(0, Math.ceil((100 - progress) * 0.6))} сек
            </span>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-1">
          {steps.map((step, index) => {
            const isActive = index === currentStep && !isComplete;
            const isDone = index < currentStep || isComplete;
            const isPending = index > currentStep && !isComplete;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.15 }}
              >
                <div
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-500 ${
                    isActive
                      ? "bg-primary/5 border border-primary/20"
                      : isDone
                      ? "opacity-60"
                      : "opacity-30"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isDone
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {isDone ? (
                        <motion.div
                          key="done"
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.3, ease: "backOut" }}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </motion.div>
                      ) : isActive ? (
                        <motion.div
                          key="active"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.div key="pending">
                          {step.icon}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium transition-colors duration-300 ${
                        isActive
                          ? "text-foreground"
                          : isDone
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </div>
                    {(isActive || isDone) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                        className="text-xs text-muted-foreground mt-0.5"
                      >
                        {step.description}
                      </motion.div>
                    )}
                  </div>

                  {/* Status indicator */}
                  {isActive && (
                    <motion.div
                      className="flex-shrink-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Fun fact / tip at the bottom */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="mt-6 pt-5 border-t text-center"
          >
            <p className="text-xs text-muted-foreground">
              {type === "estimate"
                ? ESTIMATE_TIPS[currentStep % ESTIMATE_TIPS.length]
                : VERIFICATION_TIPS[currentStep % VERIFICATION_TIPS.length]}
            </p>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

const ESTIMATE_TIPS = [
  "AI учитывает более 500 видов ремонтных работ",
  "Цены обновляются на основе актуальных данных рынка",
  "Смета включает 3 варианта: эконом, стандарт и комфорт",
  "Вы получите детальную разбивку по каждому помещению",
];

const VERIFICATION_TIPS = [
  "AI сравнивает каждую позицию с рыночными ценами Москвы",
  "Средняя переплата в сметах подрядчиков — 30-40%",
  "Покажем, какие позиции завышены, а какие в норме",
  "Вы получите конкретные аргументы для переговоров",
];
