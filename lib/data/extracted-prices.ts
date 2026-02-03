/**
 * Curated pricing data from real contractor estimates
 * Based on 23 xlsx files from Georgian contractors
 *
 * Prices are in GEL (Georgian Lari)
 * Conversion rate: 1 GEL ≈ 34 RUB
 */

export const GEL_TO_RUB = 34;

export interface ExtractedPrice {
  name: string;
  variations: string[];
  unit: string;
  priceGel: number;
  priceRub: number;
  category: string;
}

export const EXTRACTED_PRICES: ExtractedPrice[] = [
  // === Подготовительные работы ===
  {
    name: "Очистка и подготовка помещения",
    variations: ["Очистка, подготовка помещения", "Подготовительные работы"],
    unit: "м²",
    priceGel: 3,
    priceRub: 102,
    category: "Подготовительные",
  },
  {
    name: "Защита поверхностей",
    variations: ["Защита поверхностей (двери, окна и др.)", "Защита и укрытие поверхностей", "Заклейка пленкой"],
    unit: "м²",
    priceGel: 2,
    priceRub: 68,
    category: "Подготовительные",
  },
  {
    name: "Уборка помещения",
    variations: ["Уборка помещений", "Уборка", "Генеральная уборка"],
    unit: "м²",
    priceGel: 10,
    priceRub: 340,
    category: "Подготовительные",
  },
  {
    name: "Вынос мусора",
    variations: ["Вывоз строительного мусора", "Вынос мусора"],
    unit: "м³",
    priceGel: 50,
    priceRub: 1700,
    category: "Подготовительные",
  },

  // === Демонтажные работы ===
  {
    name: "Демонтаж обоев",
    variations: ["Демонтаж покрытия стен", "Снятие обоев"],
    unit: "м²",
    priceGel: 3,
    priceRub: 102,
    category: "Демонтаж",
  },
  {
    name: "Демонтаж плитки",
    variations: ["Демонтаж плитки стен", "Демонтаж плитки пола", "Сбивка плитки"],
    unit: "м²",
    priceGel: 8,
    priceRub: 272,
    category: "Демонтаж",
  },
  {
    name: "Демонтаж штукатурки",
    variations: ["Демонтаж штукатурки", "Сбивка штукатурки"],
    unit: "м²",
    priceGel: 5,
    priceRub: 170,
    category: "Демонтаж",
  },
  {
    name: "Демонтаж стяжки пола",
    variations: ["Демонтаж стяжки пола, 8-10см", "Демонтаж стяжки"],
    unit: "м²",
    priceGel: 15,
    priceRub: 510,
    category: "Демонтаж",
  },
  {
    name: "Демонтаж ламината",
    variations: ["Демонтаж ламината", "Снятие ламината"],
    unit: "м²",
    priceGel: 3,
    priceRub: 102,
    category: "Демонтаж",
  },
  {
    name: "Демонтаж линолеума",
    variations: ["Демонтаж линолеума", "Снятие линолеума"],
    unit: "м²",
    priceGel: 2,
    priceRub: 68,
    category: "Демонтаж",
  },
  {
    name: "Демонтаж паркета",
    variations: ["Демонтаж паркета", "Снятие паркета"],
    unit: "м²",
    priceGel: 5,
    priceRub: 170,
    category: "Демонтаж",
  },
  {
    name: "Демонтаж перегородки",
    variations: ["Демонтаж перегородок из блока", "Демонтаж перегородки", "Демонтаж кирпичных и монолитных перегородок"],
    unit: "м²",
    priceGel: 12,
    priceRub: 408,
    category: "Демонтаж",
  },
  {
    name: "Демонтаж перегородки из ГКЛ",
    variations: ["Демонтаж перегородок из ГКЛ", "Демонтаж гипсокартона"],
    unit: "м²",
    priceGel: 5,
    priceRub: 170,
    category: "Демонтаж",
  },
  {
    name: "Демонтаж двери",
    variations: ["Демонтаж дверной коробки", "Демонтаж двери"],
    unit: "шт",
    priceGel: 25,
    priceRub: 850,
    category: "Демонтаж",
  },
  {
    name: "Демонтаж окна",
    variations: ["Демонтаж пластиковых окон и дверей", "Демонтаж окна"],
    unit: "шт",
    priceGel: 30,
    priceRub: 1020,
    category: "Демонтаж",
  },
  {
    name: "Демонтаж унитаза",
    variations: ["Демонтаж унитаза"],
    unit: "шт",
    priceGel: 15,
    priceRub: 510,
    category: "Демонтаж",
  },
  {
    name: "Демонтаж ванны",
    variations: ["Демонтаж ванны", "Демонтаж душевой кабины"],
    unit: "шт",
    priceGel: 25,
    priceRub: 850,
    category: "Демонтаж",
  },
  {
    name: "Демонтаж радиатора",
    variations: ["Демонтаж радиаторов", "Демонтаж батареи"],
    unit: "шт",
    priceGel: 15,
    priceRub: 510,
    category: "Демонтаж",
  },

  // === Стены ===
  {
    name: "Грунтовка стен",
    variations: ["Грунтование стен", "Грунтование", "Грунтование поверхностей", "Грунтовка"],
    unit: "м²",
    priceGel: 2,
    priceRub: 68,
    category: "Стены",
  },
  {
    name: "Штукатурка стен по маякам",
    variations: ["Штукатурка стен", "Машинная штукатурка", "Штукатурка по маякам"],
    unit: "м²",
    priceGel: 12,
    priceRub: 408,
    category: "Стены",
  },
  {
    name: "Шпаклевка стен под обои",
    variations: ["Шпатлевка финишная", "Финишная шпатлевка", "Шпаклевка под обои"],
    unit: "м²",
    priceGel: 6,
    priceRub: 204,
    category: "Стены",
  },
  {
    name: "Шпаклевка стен под покраску",
    variations: ["Высококачественная шпатлевка до 5мм", "Шпаклевка под покраску"],
    unit: "м²",
    priceGel: 8,
    priceRub: 272,
    category: "Стены",
  },
  {
    name: "Покраска стен",
    variations: ["Покраска стен на 2 раза", "Покраска стен", "Малярные работы"],
    unit: "м²",
    priceGel: 5,
    priceRub: 170,
    category: "Стены",
  },
  {
    name: "Поклейка обоев",
    variations: ["Поклейка обоев", "Наклейка обои флизелин", "Обои"],
    unit: "м²",
    priceGel: 6,
    priceRub: 204,
    category: "Стены",
  },
  {
    name: "Поклейка стеклохолста",
    variations: ["Поклейка стеклохолста на стены", "Стеклохолст"],
    unit: "м²",
    priceGel: 5,
    priceRub: 170,
    category: "Стены",
  },
  {
    name: "Монтаж гипсокартона на стены",
    variations: ["Монтаж ГКЛ на стены", "Обшивка стен ГКЛ"],
    unit: "м²",
    priceGel: 15,
    priceRub: 510,
    category: "Стены",
  },
  {
    name: "Откосы оконные",
    variations: ["Откосы окон и проемов", "Оштукатуривание откосов", "Откосы"],
    unit: "м.п.",
    priceGel: 12,
    priceRub: 408,
    category: "Стены",
  },

  // === Полы ===
  {
    name: "Грунтовка пола",
    variations: ["Грунтование пола", "Грунтовка основания"],
    unit: "м²",
    priceGel: 2,
    priceRub: 68,
    category: "Полы",
  },
  {
    name: "Стяжка пола",
    variations: ["Стяжка пола", "Стяжка пола до 100мм", "Устройство стяжки"],
    unit: "м²",
    priceGel: 18,
    priceRub: 612,
    category: "Полы",
  },
  {
    name: "Наливной пол",
    variations: ["Наливные полы до 15мм", "Наливной пол", "Самовыравнивающийся пол"],
    unit: "м²",
    priceGel: 8,
    priceRub: 272,
    category: "Полы",
  },
  {
    name: "Гидроизоляция пола",
    variations: ["Гидроизоляция пола", "Гидроизоляция обмазочная", "Гидроизоляция мокрых зон"],
    unit: "м²",
    priceGel: 5,
    priceRub: 170,
    category: "Полы",
  },
  {
    name: "Укладка ламината",
    variations: ["Укладка ламината", "Ламинат"],
    unit: "м²",
    priceGel: 8,
    priceRub: 272,
    category: "Полы",
  },
  {
    name: "Укладка паркетной доски",
    variations: ["Укладка паркетной доски", "Паркетная доска"],
    unit: "м²",
    priceGel: 12,
    priceRub: 408,
    category: "Полы",
  },
  {
    name: "Укладка линолеума",
    variations: ["Укладка линолеума", "Линолеум"],
    unit: "м²",
    priceGel: 5,
    priceRub: 170,
    category: "Полы",
  },
  {
    name: "Монтаж плинтусов",
    variations: ["Монтаж микроплинтуса", "Монтаж плинтуса", "Установка плинтусов"],
    unit: "м.п.",
    priceGel: 4,
    priceRub: 136,
    category: "Полы",
  },
  {
    name: "Монтаж теплого пола",
    variations: ["Монтаж теплого водяного пола", "Электрический теплый пол", "Теплый пол"],
    unit: "м²",
    priceGel: 15,
    priceRub: 510,
    category: "Полы",
  },

  // === Потолки ===
  {
    name: "Грунтовка потолка",
    variations: ["Грунтование потолка", "Грунтовка потолка"],
    unit: "м²",
    priceGel: 2,
    priceRub: 68,
    category: "Потолки",
  },
  {
    name: "Шпаклевка потолка",
    variations: ["Шпаклевка потолка", "Шпатлевка потолка"],
    unit: "м²",
    priceGel: 8,
    priceRub: 272,
    category: "Потолки",
  },
  {
    name: "Покраска потолка",
    variations: ["Покраска потолка", "Покраска потолка на 2 раза"],
    unit: "м²",
    priceGel: 5,
    priceRub: 170,
    category: "Потолки",
  },
  {
    name: "Натяжной потолок",
    variations: ["Натяжные потолки", "Монтаж натяжного потолка", "Натяжной потолок с карнизом"],
    unit: "м²",
    priceGel: 25,
    priceRub: 850,
    category: "Потолки",
  },
  {
    name: "Монтаж ГКЛ на потолок",
    variations: ["Монтаж ГКЛ на потолок", "монтаж ГКЛ на потолок 1 слой", "Гипсокартонный потолок"],
    unit: "м²",
    priceGel: 18,
    priceRub: 612,
    category: "Потолки",
  },
  {
    name: "Монтаж короба из ГКЛ",
    variations: ["Устройство ГВЛ коробов", "Монтаж ГВЛ коробов", "Монтаж короба ГКЛ", "Монтаж коробов"],
    unit: "м.п.",
    priceGel: 20,
    priceRub: 680,
    category: "Потолки",
  },

  // === Плитка ===
  {
    name: "Укладка плитки на стены",
    variations: ["СУ, плитка стен", "Укладка плитки, с/у", "Плитка стен"],
    unit: "м²",
    priceGel: 25,
    priceRub: 850,
    category: "Плитка",
  },
  {
    name: "Укладка плитки на пол",
    variations: ["СУ, плитка", "Укладка плитки в с/у", "Плитка пол"],
    unit: "м²",
    priceGel: 22,
    priceRub: 748,
    category: "Плитка",
  },
  {
    name: "Укладка керамогранита",
    variations: ["Укладка керамогранита", "монтаж керамогранита", "керамогранит 60*60"],
    unit: "м²",
    priceGel: 28,
    priceRub: 952,
    category: "Плитка",
  },
  {
    name: "Укладка плитки на фартук",
    variations: ["Укладка плитки, фартук", "Укладка плитки на фартук", "Фартук кухни"],
    unit: "м²",
    priceGel: 30,
    priceRub: 1020,
    category: "Плитка",
  },
  {
    name: "Укладка мозаики",
    variations: ["Укладка мозаики", "Мозаика"],
    unit: "м²",
    priceGel: 40,
    priceRub: 1360,
    category: "Плитка",
  },
  {
    name: "Затирка швов",
    variations: ["затирка", "Затирка швов", "Фугование"],
    unit: "м²",
    priceGel: 5,
    priceRub: 170,
    category: "Плитка",
  },

  // === Электрика ===
  {
    name: "Монтаж электроточки",
    variations: ["Монтаж точек (розетки, выключатели)", "Монтаж точек освещения", "Электроточка"],
    unit: "шт",
    priceGel: 25,
    priceRub: 850,
    category: "Электрика",
  },
  {
    name: "Монтаж розетки",
    variations: ["Монтаж розеток и выключателей", "Установка розетки", "Розетка"],
    unit: "шт",
    priceGel: 8,
    priceRub: 272,
    category: "Электрика",
  },
  {
    name: "Монтаж выключателя",
    variations: ["Установка выключателя", "Выключатель"],
    unit: "шт",
    priceGel: 8,
    priceRub: 272,
    category: "Электрика",
  },
  {
    name: "Прокладка кабеля",
    variations: ["Монтаж кабеля в гофре", "кабель 3*1.5, 3*2.5", "Прокладка электропроводки"],
    unit: "м.п.",
    priceGel: 5,
    priceRub: 170,
    category: "Электрика",
  },
  {
    name: "Монтаж электрощита",
    variations: ["Монтаж распредщита", "Монтаж и организация распредщита", "Распредщит"],
    unit: "шт",
    priceGel: 150,
    priceRub: 5100,
    category: "Электрика",
  },
  {
    name: "Установка автомата",
    variations: ["установка автоматов", "Автоматы 32а", "Автомат"],
    unit: "шт",
    priceGel: 10,
    priceRub: 340,
    category: "Электрика",
  },
  {
    name: "Установка светильника",
    variations: ["Установка светильника", "Монтаж светильника"],
    unit: "шт",
    priceGel: 15,
    priceRub: 510,
    category: "Электрика",
  },
  {
    name: "Штробление стен",
    variations: ["Штробление стен под электрику", "Штробы"],
    unit: "м.п.",
    priceGel: 8,
    priceRub: 272,
    category: "Электрика",
  },

  // === Сантехника ===
  {
    name: "Установка унитаза",
    variations: ["Монтаж унитаза", "Установка унитаза"],
    unit: "шт",
    priceGel: 50,
    priceRub: 1700,
    category: "Сантехника",
  },
  {
    name: "Установка раковины",
    variations: ["Установка раковины", "Монтаж раковины"],
    unit: "шт",
    priceGel: 40,
    priceRub: 1360,
    category: "Сантехника",
  },
  {
    name: "Установка ванны",
    variations: ["Установка ванны", "Монтаж ванны"],
    unit: "шт",
    priceGel: 80,
    priceRub: 2720,
    category: "Сантехника",
  },
  {
    name: "Установка душевой кабины",
    variations: ["Установка душевой", "Монтаж душевой кабины"],
    unit: "шт",
    priceGel: 100,
    priceRub: 3400,
    category: "Сантехника",
  },
  {
    name: "Установка смесителя",
    variations: ["Монтаж смесителей", "Установка смесителей", "установка смесителей"],
    unit: "шт",
    priceGel: 25,
    priceRub: 850,
    category: "Сантехника",
  },
  {
    name: "Монтаж инсталляции",
    variations: ["Монтаж инсталяции", "Инсталляция"],
    unit: "шт",
    priceGel: 80,
    priceRub: 2720,
    category: "Сантехника",
  },
  {
    name: "Монтаж полотенцесушителя",
    variations: ["Монтаж полотенцесушителя", "Полотенцесушитель"],
    unit: "шт",
    priceGel: 40,
    priceRub: 1360,
    category: "Сантехника",
  },
  {
    name: "Разводка водоснабжения",
    variations: ["трубы, фитинги", "Разводка труб водоснабжения"],
    unit: "точка",
    priceGel: 40,
    priceRub: 1360,
    category: "Сантехника",
  },
  {
    name: "Разводка канализации",
    variations: ["Канализация, монтаж", "Монтаж канализационных выводов"],
    unit: "точка",
    priceGel: 35,
    priceRub: 1190,
    category: "Сантехника",
  },
  {
    name: "Монтаж стеклянной перегородки",
    variations: ["Монтаж стеклянной перегородки (душ)", "Перегородка стеклянная в душевой"],
    unit: "м²",
    priceGel: 80,
    priceRub: 2720,
    category: "Сантехника",
  },

  // === Двери ===
  {
    name: "Установка межкомнатной двери",
    variations: ["межкомнатная дверь", "дверь м/к с комплектом", "Установка двери"],
    unit: "шт",
    priceGel: 80,
    priceRub: 2720,
    category: "Двери",
  },
  {
    name: "Установка входной двери",
    variations: ["входная дверь", "Установка входной двери"],
    unit: "шт",
    priceGel: 120,
    priceRub: 4080,
    category: "Двери",
  },

  // === Окна ===
  {
    name: "Установка окна",
    variations: ["Мотаж оконного блока", "Установка окна"],
    unit: "шт",
    priceGel: 80,
    priceRub: 2720,
    category: "Окна",
  },
  {
    name: "Установка подоконника",
    variations: ["Установка подоконника", "Подоконник"],
    unit: "шт",
    priceGel: 30,
    priceRub: 1020,
    category: "Окна",
  },

  // === Черновые работы ===
  {
    name: "Кладка перегородки из блока",
    variations: ["Монтаж перегородки блок", "Кладка перегородок из блока, t=100мм", "Укладка блока"],
    unit: "м²",
    priceGel: 20,
    priceRub: 680,
    category: "Черновые работы",
  },
  {
    name: "Монтаж перегородки из ГКЛ",
    variations: ["Перегородки ГКЛ", "Монтаж перегородки из ГКЛ"],
    unit: "м²",
    priceGel: 18,
    priceRub: 612,
    category: "Черновые работы",
  },
  {
    name: "Монтаж арматурной сетки",
    variations: ["Монтаж арматурной сетки", "Армирование"],
    unit: "м²",
    priceGel: 5,
    priceRub: 170,
    category: "Черновые работы",
  },
  {
    name: "Бетонирование",
    variations: ["Доставка бетона", "Заливка бетона"],
    unit: "м³",
    priceGel: 150,
    priceRub: 5100,
    category: "Черновые работы",
  },
];

/**
 * Material cost ratios by category (material_cost / labor_cost)
 * Based on analysis of real estimates
 */
export const MATERIAL_RATIOS: Record<string, number> = {
  "Подготовительные": 0.1,
  "Демонтаж": 0.05,
  "Стены": 0.45,
  "Полы": 0.55,
  "Потолки": 0.35,
  "Плитка": 0.6,
  "Электрика": 0.65,
  "Сантехника": 0.4,
  "Двери": 0.15,
  "Окна": 0.2,
  "Черновые работы": 0.5,
  "Прочее": 0.3,
};

/**
 * Default prices by category (in RUB) when no match found
 */
export const DEFAULT_PRICES_BY_CATEGORY: Record<string, number> = {
  "Подготовительные": 150,
  "Демонтаж": 200,
  "Стены": 400,
  "Полы": 500,
  "Потолки": 500,
  "Плитка": 900,
  "Электрика": 800,
  "Сантехника": 2000,
  "Двери": 3000,
  "Окна": 2500,
  "Черновые работы": 600,
  "Прочее": 500,
};

/**
 * Get price for a work item by name (fuzzy match)
 */
export function findPriceByName(workName: string): ExtractedPrice | null {
  const lower = workName.toLowerCase();

  // Exact match
  const exact = EXTRACTED_PRICES.find(p =>
    p.name.toLowerCase() === lower ||
    p.variations.some(v => v.toLowerCase() === lower)
  );
  if (exact) return exact;

  // Partial match
  const partial = EXTRACTED_PRICES.find(p =>
    lower.includes(p.name.toLowerCase()) ||
    p.name.toLowerCase().includes(lower) ||
    p.variations.some(v =>
      lower.includes(v.toLowerCase()) ||
      v.toLowerCase().includes(lower)
    )
  );
  if (partial) return partial;

  // Word overlap
  const words = lower.split(/\s+/);
  let bestMatch: ExtractedPrice | null = null;
  let bestScore = 0;

  for (const price of EXTRACTED_PRICES) {
    const priceWords = price.name.toLowerCase().split(/\s+/);
    const overlap = words.filter(w =>
      priceWords.some(pw => pw.includes(w) || w.includes(pw))
    ).length;
    const score = overlap / Math.max(words.length, priceWords.length);

    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      bestMatch = price;
    }
  }

  return bestMatch;
}

/**
 * Get all work names for AI training
 */
export function getAllWorkNames(): string[] {
  return EXTRACTED_PRICES.map(p => p.name);
}

/**
 * Get work names by category
 */
export function getWorkNamesByCategory(category: string): string[] {
  return EXTRACTED_PRICES
    .filter(p => p.category === category)
    .map(p => p.name);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return [...new Set(EXTRACTED_PRICES.map(p => p.category))];
}
