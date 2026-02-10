import Link from "next/link";
import { Mail, Send } from "lucide-react";

export function FooterRu() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-[#161616]/5 bg-white/50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Brand + copyright */}
          <div className="space-y-2">
            <p className="font-semibold text-[#161616]">AI Сметчик</p>
            <p className="text-sm text-[#161616]/40">
              &copy; {currentYear} ContractorCheck. Все права защищены.
            </p>
          </div>

          {/* Legal links */}
          <div className="space-y-2">
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
          <div className="space-y-2">
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
