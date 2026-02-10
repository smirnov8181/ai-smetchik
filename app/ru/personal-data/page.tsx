import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FooterRu } from "@/components/footer-ru";

export const metadata = {
  title: "Обработка персональных данных — AI Сметчик",
};

export default function PersonalDataPage() {
  return (
    <div className="min-h-screen bg-[#FAF4EC] flex flex-col">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/ru"
          className="inline-flex items-center gap-1.5 text-sm text-[#161616]/50 hover:text-[#161616] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <h1 className="text-2xl font-bold text-[#161616] mb-6">
          Обработка персональных данных
        </h1>

        <div className="bg-white rounded-2xl border border-[#161616]/5 p-8 space-y-4 text-sm text-[#161616]/70 leading-relaxed">
          <p>
            Настоящий документ описывает порядок сбора, хранения и обработки
            персональных данных пользователей сервиса AI Сметчик
            (ContractorCheck) в соответствии с Федеральным законом N 152-ФЗ
            &laquo;О персональных данных&raquo;.
          </p>
          <p>
            Страница находится в разработке. Полный текст документа будет
            опубликован в ближайшее время.
          </p>
          <p className="text-[#161616]/40">
            По вопросам обработки персональных данных обращайтесь:{" "}
            <a
              href="mailto:support@contractorcheck.ru"
              className="underline hover:text-[#161616]"
            >
              support@contractorcheck.ru
            </a>
          </p>
        </div>
      </main>
      <FooterRu />
    </div>
  );
}
