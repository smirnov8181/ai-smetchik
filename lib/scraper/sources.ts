// Sources for price scraping — renovation companies and contractors in Moscow/MO
// Each source has a URL to their price page

export interface PriceSource {
  name: string;
  url: string;
  category: "contractor" | "marketplace" | "materials";
}

export const PRICE_SOURCES: PriceSource[] = [
  // Major renovation companies — Moscow
  { name: "Мастера Ремонта", url: "https://mastera-remonta.com/ceny/", category: "contractor" },
  { name: "СтройМастер", url: "https://stroymaster.net/ceny-na-remont/", category: "contractor" },
  { name: "Ремонт Экспресс", url: "https://remontexpress.ru/ceny/", category: "contractor" },
  { name: "ПроРемонт", url: "https://pro-remont.ru/prices/", category: "contractor" },
  { name: "Квартира под ключ", url: "https://kvartira-pod-klyuch.ru/ceny/", category: "contractor" },

  // Aggregators
  { name: "Ремонтник.ру", url: "https://remontnik.ru/ceny-na-remont/", category: "marketplace" },
  { name: "Profi.ru", url: "https://profi.ru/remont/", category: "marketplace" },

  // Material prices
  { name: "Леруа Мерлен", url: "https://leroymerlin.ru/catalogue/", category: "materials" },
  { name: "Петрович", url: "https://petrovich.ru/catalog/", category: "materials" },
];

// These will be discovered dynamically via search
export const SEARCH_QUERIES = [
  "прайс на ремонтные работы Москва 2026",
  "расценки на ремонт квартиры Москва",
  "стоимость ремонтных работ за м2 Москва",
  "прайс лист ремонт квартир Москва",
  "цены на отделочные работы Москва 2026",
  "стоимость штукатурки стен Москва",
  "цены укладка плитки Москва",
  "расценки электромонтажные работы Москва",
  "прайс сантехнические работы Москва",
  "стоимость малярных работ Москва",
];
