import { ai, MODELS } from "@/lib/ai/client";

export interface ExtractedPrice {
  category: string;
  work_name: string;
  unit: string;
  price: number;
  includes_materials: boolean;
  source_name: string;
  source_url: string;
}

const EXTRACTION_PROMPT = `Ты — эксперт по ремонту. Из текста ниже извлеки ВСЕ цены на ремонтные работы.

Верни JSON-массив строго следующего формата:
{
  "prices": [
    {
      "category": "категория (Демонтаж/Стены/Потолок/Пол/Электрика/Сантехника/Двери/Окна/Черновые работы/Уборка/Материалы)",
      "work_name": "стандартное название работы",
      "unit": "единица измерения (м²/м.п./шт/точка/м³/комплект)",
      "price": цена за единицу (число в рублях, без пробелов и символов),
      "includes_materials": true/false
    }
  ]
}

Правила:
1. Приводи названия к стандартным: "Штукатурка стен по маякам", "Укладка плитки на пол", и т.д.
2. Цена должна быть числом в рублях. Если указана вилка "от 500 до 800" — бери среднее (650)
3. Если цена указана "от 500" без верхней границы — бери как есть (500)
4. Различай цену за работу и за работу+материалы
5. Игнорируй нерелевантную информацию (навигация, реклама)
6. Если цен нет — верни пустой массив {"prices": []}
7. Все цены в рублях. Если указано в другой валюте — пропусти

Отвечай ТОЛЬКО валидным JSON.`;

export async function extractPricesFromMarkdown(
  markdown: string,
  sourceName: string,
  sourceUrl: string
): Promise<ExtractedPrice[]> {
  // Trim to avoid token limits — take first 8000 chars
  const trimmed = markdown.slice(0, 8000);

  if (trimmed.length < 50) {
    return [];
  }

  try {
    const response = await ai.chat.completions.create({
      model: MODELS.fast,
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        {
          role: "user",
          content: `Источник: ${sourceName}\n\nТекст:\n${trimmed}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    const prices = parsed.prices || [];

    return prices
      .filter(
        (p: { price: number }) => p.price > 0 && p.price < 1000000
      )
      .map(
        (p: {
          category: string;
          work_name: string;
          unit: string;
          price: number;
          includes_materials: boolean;
        }) => ({
          ...p,
          source_name: sourceName,
          source_url: sourceUrl,
        })
      );
  } catch (error) {
    console.error(`Price extraction failed for ${sourceName}:`, error);
    return [];
  }
}
