"use client";

interface YandexAuthButtonProps {
  label?: string;
}

export function YandexAuthButton({
  label = "Войти через Яндекс",
}: YandexAuthButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID;

  if (!clientId) return null;

  const handleClick = () => {
    const origin = window.location.origin;
    const redirectUri = `${origin}/api/auth/yandex/callback`;
    window.location.href = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  return (
    <button
      onClick={handleClick}
      className="cursor-pointer w-full bg-white border-2 border-[#161616]/10 text-[#161616] font-semibold py-4 rounded-xl hover:bg-[#FAF4EC] transition-all flex items-center justify-center gap-3"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#FC3F1D"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.77 14.63h-2.2V7.38h1.14c2.07 0 3.15 1.05 3.15 2.73 0 1.21-.6 2.07-1.72 2.56l2.24 3.96h-2.37l-1.9-3.57h-.53v3.57h.19zm-1.97-5.26h.73c1.09 0 1.68-.55 1.68-1.42 0-.88-.59-1.38-1.68-1.38h-.73v2.8z"
        />
      </svg>
      {label}
    </button>
  );
}
