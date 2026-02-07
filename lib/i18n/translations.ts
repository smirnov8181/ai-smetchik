export type Region = "RU" | "US";

export const translations = {
  RU: {
    // Brand
    appName: "AI Сметчик",

    // Navigation
    newEstimate: "Новая смета",
    verifyEstimate: "Проверить смету",
    logout: "Выйти",
    back: "Назад",

    // Dashboard
    myEstimates: "Мои сметы",
    noEstimates: "У вас пока нет смет",
    createFirst: "Создайте первую смету",
    verifications: "Проверка смет",
    noVerifications: "У вас пока нет проверок",

    // Estimate form
    describeWork: "Опишите работы",
    describeWorkPlaceholder: "Например: Нужен ремонт ванной комнаты 6 м², замена плитки на полу и стенах, установка новой ванны и раковины...",
    orUploadFile: "Или загрузите файл",
    uploadHint: "PDF, JPG, PNG, XLSX (макс. 5 файлов)",
    calculateEstimate: "Рассчитать смету",
    processing: "AI рассчитывает...",

    // Verification form
    contractorEstimate: "Смета подрядчика",
    contractorEstimatePlaceholder: "Вставьте текст сметы, например:\n\nШтукатурка стен — 120 м² × 800 руб. = 96 000 руб.\nУкладка плитки на пол — 25 м² × 2500 руб. = 62 500 руб.",
    orUploadEstimate: "Или загрузите файл сметы (PDF, фото, XLSX)",
    verifyButton: "Проверить смету",
    verifyProcessing: "AI анализирует... (30-60 сек)",

    // How it works
    howItWorks: "Как это работает:",
    step1: "AI распознаёт позиции и цены из вашей сметы",
    step2: "Сравнивает каждую позицию с рыночными ценами",
    step3: "Показывает общую сумму переплаты бесплатно",
    step4: "Детальный разбор по каждой позиции — 990 руб.",

    // Results
    estimateReady: "Смета готова",
    totalCost: "Ориентировочная стоимость",
    workDetails: "Детализация работ",
    priceRange: "от {min} до {max}",

    // Verification results
    verdict: {
      fair: "Справедливая цена",
      slightly_overpriced: "Немного завышена",
      overpriced: "Завышена",
      ripoff: "Сильно завышена",
    },
    contractorPrice: "Смета подрядчика",
    marketPrice: "Рыночная цена",
    overpay: "Переплата",
    overpayItems: "Завышенных позиций",

    // Paywall
    hiddenItems: "Ещё {count} позиций скрыто",
    getFullReport: "Получить полный отчёт",
    oneTimePayment: "Разовый платёж. Оплата через Stripe.",

    // Status
    draft: "Черновик",
    processing_status: "Обработка...",
    ready: "Готово",
    error: "Ошибка",

    // Currency
    currency: "руб.",
    currencySymbol: "₽",

    // Units
    sqm: "м²",
    lm: "п.м.",
    unit: "шт.",
    project: "проект",
  },

  US: {
    // Brand
    appName: "ContractorCheck",

    // Navigation
    newEstimate: "New Estimate",
    verifyEstimate: "Check Estimate",
    logout: "Log out",
    back: "Back",

    // Dashboard
    myEstimates: "My Estimates",
    noEstimates: "You don't have any estimates yet",
    createFirst: "Create your first estimate",
    verifications: "Estimate Checks",
    noVerifications: "You don't have any checks yet",

    // Estimate form
    describeWork: "Describe the work",
    describeWorkPlaceholder: "Example: Need bathroom renovation 60 sq ft, replace floor and wall tiles, install new bathtub and sink...",
    orUploadFile: "Or upload a file",
    uploadHint: "PDF, JPG, PNG, XLSX (max 5 files)",
    calculateEstimate: "Calculate Estimate",
    processing: "AI is calculating...",

    // Verification form
    contractorEstimate: "Contractor's Estimate",
    contractorEstimatePlaceholder: "Paste the estimate text, for example:\n\nBathroom tile installation — 60 sq ft × $15 = $900\nToilet installation — 1 unit × $350 = $350",
    orUploadEstimate: "Or upload estimate file (PDF, photo, XLSX)",
    verifyButton: "Check Estimate",
    verifyProcessing: "AI is analyzing... (30-60 sec)",

    // How it works
    howItWorks: "How it works:",
    step1: "AI recognizes items and prices from your estimate",
    step2: "Compares each item with market prices",
    step3: "Shows total overpay amount for free",
    step4: "Detailed breakdown for each item — $39.99",

    // Results
    estimateReady: "Estimate Ready",
    totalCost: "Estimated Cost",
    workDetails: "Work Details",
    priceRange: "from {min} to {max}",

    // Verification results
    verdict: {
      fair: "Fair Price",
      slightly_overpriced: "Slightly Overpriced",
      overpriced: "Overpriced",
      ripoff: "Rip-off",
    },
    contractorPrice: "Contractor's Price",
    marketPrice: "Market Price",
    overpay: "Overpay",
    overpayItems: "Overpriced items",

    // Paywall
    hiddenItems: "{count} more items hidden",
    getFullReport: "Get Full Report",
    oneTimePayment: "One-time payment via Stripe.",

    // Status
    draft: "Draft",
    processing_status: "Processing...",
    ready: "Ready",
    error: "Error",

    // Currency
    currency: "USD",
    currencySymbol: "$",

    // Units
    sqm: "sq ft",
    lm: "linear ft",
    unit: "unit",
    project: "project",
  },
} as const;

export type TranslationKey = keyof typeof translations.RU;
