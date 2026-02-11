import Link from "next/link";
import { FileText, Mail, Send } from "lucide-react";

export function FooterRu() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#161616]/5 bg-[#FCFBF7]">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Brand + copyright */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#161616] rounded-xl flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#FCFBF7]" />
              </div>
              <span className="font-bold text-lg text-[#161616]">AI Сметчик</span>
            </div>
            <p className="text-sm text-[#161616]/40">
              &copy; {currentYear} ContractorCheck. Все права защищены.
            </p>
          </div>

          {/* Legal links */}
          <div className="space-y-2.5">
            <p className="text-sm font-medium text-[#161616]/60">Документы</p>
            <nav className="flex flex-col gap-1.5">
              <Link
                href="/ru/privacy"
                className="text-sm text-[#161616]/50 hover:text-[#161616] transition-colors"
              >
                Политика конфиденциальности
              </Link>
              <Link
                href="/ru/terms"
                className="text-sm text-[#161616]/50 hover:text-[#161616] transition-colors"
              >
                Пользовательское соглашение
              </Link>
              <Link
                href="/ru/personal-data"
                className="text-sm text-[#161616]/50 hover:text-[#161616] transition-colors"
              >
                Обработка персональных данных
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-2.5">
            <p className="text-sm font-medium text-[#161616]/60">Поддержка</p>
            <nav className="flex flex-col gap-1.5">
              <a
                href="mailto:support@contractorcheck.ru"
                className="text-sm text-[#161616]/50 hover:text-[#161616] transition-colors inline-flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                support@contractorcheck.ru
              </a>
              <a
                href="https://t.me/contractorcheck"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#161616]/50 hover:text-[#161616] transition-colors inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Telegram
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
