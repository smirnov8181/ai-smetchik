import { NormalizedInput, WorkItem } from "@/lib/supabase/types";
import { EXTRACTOR_SYSTEM_PROMPT } from "./prompts";
import { ai, MODELS } from "./client";

export async function extractWorkItems(
  normalizedInput: NormalizedInput
): Promise<WorkItem[]> {
  const response = await ai.chat.completions.create({
    model: MODELS.main,
    messages: [
      { role: "system", content: EXTRACTOR_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Проект ремонта:\n${JSON.stringify(normalizedInput, null, 2)}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 4000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from extractor");
  }

  const parsed = JSON.parse(content);
  // Handle both { items: [...] } and [...] formats
  const items = Array.isArray(parsed) ? parsed : parsed.items || parsed.works || [];
  return items as WorkItem[];
}
