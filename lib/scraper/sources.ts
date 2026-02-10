// Sources for price scraping — renovation companies and contractors in Moscow/MO
// Each source has a URL to their price page, region info, and reliability metadata

export interface PriceSource {
  name: string;
  url: string;
  category: "contractor" | "marketplace" | "aggregator" | "materials";
  region: "moscow" | "moscow_region" | "both";
  /** Expected number of price items on the page */
  expectedItems?: number;
  /** Whether this source has been verified to return structured price data */
  verified: boolean;
  /** Pages to scrape (some sites split prices across multiple pages) */
  additionalUrls?: string[];
}

// ============================================
// TIER 1 — Verified sources with structured price tables
// ============================================

export const PRICE_SOURCES: PriceSource[] = [
  // Век Ремонта — detailed price tables by category (квартиры, комнаты, кухни, ванные, новостройки)
  {
    name: "Век Ремонта",
    url: "https://remontcena.ru/tseny/",
    category: "contractor",
    region: "moscow",
    expectedItems: 80,
    verified: true,
  },

  // ГК Фундамент — крупная компания с 1999 года, подробный прайс
  {
    name: "ГК Фундамент",
    url: "https://remont-f.ru/remont-kvartir-pod-kluch/price.php",
    category: "contractor",
    region: "moscow",
    expectedItems: 100,
    verified: true,
    additionalUrls: [
      "https://remont-f.ru/remont-kvartir-pod-kluch/price.php?type=demolition",
      "https://remont-f.ru/remont-kvartir-pod-kluch/price.php?type=walls",
      "https://remont-f.ru/remont-kvartir-pod-kluch/price.php?type=floors",
      "https://remont-f.ru/remont-kvartir-pod-kluch/price.php?type=ceilings",
    ],
  },

  // Profi.ru — маркетплейс мастеров, средние рыночные цены
  {
    name: "Profi.ru",
    url: "https://profi.ru/remont/",
    category: "marketplace",
    region: "moscow",
    expectedItems: 50,
    verified: true,
  },

  // Петрович — цены на материалы (для material cost estimation)
  {
    name: "Петрович",
    url: "https://petrovich.ru/catalog/",
    category: "materials",
    region: "both",
    expectedItems: 30,
    verified: true,
  },

  // IVD.ru — обзоры цен на ремонт с таблицами
  {
    name: "IVD.ru",
    url: "https://www.ivd.ru/stroitelstvo-i-remont/otdelocnye-materialy/skolko-stoit-remont-kvartiry-81672",
    category: "aggregator",
    region: "moscow",
    expectedItems: 40,
    verified: true,
  },

  // СК Просто — прайс-лист по категориям
  {
    name: "СК Просто",
    url: "https://www.sk-prosto.ru/ceny-na-remont-kvartiry/",
    category: "contractor",
    region: "moscow",
    expectedItems: 60,
    verified: false, // SSL issues, needs verification
  },

  // SDM Climate — монтажные и инженерные работы (кондиционирование, вентиляция)
  {
    name: "SDM Climate",
    url: "https://www.sdmclimate.ru/ceny/",
    category: "contractor",
    region: "moscow",
    expectedItems: 20,
    verified: false, // Equipment prices, not renovation
  },
];

// ============================================
// TIER 2 — Sources to discover via search (Firecrawl search API)
// ============================================

export const SEARCH_QUERIES = [
  // Основные запросы по прайсам
  "прайс лист ремонтные работы Москва 2026 руб м2",
  "расценки на ремонт квартиры Москва стены полы потолки",
  "стоимость ремонтных работ за м2 Москва прайс таблица",
  "цены на отделочные работы Москва 2026",

  // По категориям (для глубокого покрытия)
  "стоимость штукатурки стен за м2 Москва 2026",
  "цены укладка плитки Москва 2026 прайс",
  "расценки электромонтажные работы Москва 2026",
  "прайс сантехнические работы Москва установка",
  "стоимость малярных работ Москва покраска обои",
  "цены на демонтажные работы Москва 2026",
  "стоимость стяжки пола Москва за м2",
  "цены установка дверей окон Москва",

  // Московская область (для отдельного региона)
  "цены ремонт квартир Московская область 2026",
  "прайс ремонтные работы Подмосковье расценки",
];

// ============================================
// Category mappings for normalizing scraped data
// ============================================

export const CATEGORY_ALIASES: Record<string, string> = {
  // Демонтаж
  "демонтажные работы": "Демонтаж",
  "демонтаж": "Демонтаж",
  "разборка": "Демонтаж",
  "снятие": "Демонтаж",

  // Стены
  "стены": "Стены",
  "отделка стен": "Стены",
  "стеновые работы": "Стены",
  "малярные работы": "Стены",

  // Потолок
  "потолок": "Потолок",
  "потолки": "Потолок",
  "потолочные работы": "Потолок",

  // Пол
  "пол": "Пол",
  "полы": "Пол",
  "напольные покрытия": "Пол",
  "напольные работы": "Пол",

  // Плитка
  "плитка": "Плитка",
  "плиточные работы": "Плитка",
  "кафельные работы": "Плитка",
  "облицовка": "Плитка",

  // Электрика
  "электрика": "Электрика",
  "электромонтаж": "Электрика",
  "электромонтажные работы": "Электрика",
  "электроработы": "Электрика",

  // Сантехника
  "сантехника": "Сантехника",
  "сантехнические работы": "Сантехника",
  "водоснабжение": "Сантехника",
  "канализация": "Сантехника",

  // Двери
  "двери": "Двери",
  "дверные работы": "Двери",
  "установка дверей": "Двери",

  // Окна
  "окна": "Окна",
  "оконные работы": "Окна",
  "остекление": "Окна",

  // Черновые работы
  "черновые работы": "Черновые работы",
  "черновая отделка": "Черновые работы",
  "подготовительные работы": "Черновые работы",

  // Уборка
  "уборка": "Уборка",
  "вывоз мусора": "Уборка",

  // Новые категории
  "балкон": "Балкон и лоджия",
  "лоджия": "Балкон и лоджия",
  "кондиционирование": "Кондиционирование",
  "вентиляция": "Вентиляция",
  "кухня": "Кухня",
  "гипсокартон": "Гипсокартонные работы",
  "гкл": "Гипсокартонные работы",
  "перегородки": "Гипсокартонные работы",
};

// ============================================
// Helper to get only verified sources
// ============================================

export function getVerifiedSources(): PriceSource[] {
  return PRICE_SOURCES.filter((s) => s.verified);
}

export function getSourcesByRegion(region: "moscow" | "moscow_region"): PriceSource[] {
  return PRICE_SOURCES.filter(
    (s) => s.region === region || s.region === "both"
  );
}

export function getAllSourceUrls(): string[] {
  const urls: string[] = [];
  for (const source of PRICE_SOURCES) {
    urls.push(source.url);
    if (source.additionalUrls) {
      urls.push(...source.additionalUrls);
    }
  }
  return urls;
}
