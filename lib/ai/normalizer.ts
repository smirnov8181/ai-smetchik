import OpenAI from "openai";
import { NormalizedInput } from "@/lib/supabase/types";
import { NORMALIZER_SYSTEM_PROMPT } from "./prompts";
import { ai, MODELS } from "./client";

export async function normalizeInput(params: {
  text?: string;
  imageUrls?: string[];
  pdfText?: string;
}): Promise<NormalizedInput> {
  const { text, imageUrls, pdfText } = params;

  const userParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

  if (text) {
    userParts.push({
      type: "text",
      text: `Описание от клиента:\n${text}`,
    });
  }

  if (pdfText) {
    userParts.push({
      type: "text",
      text: `Данные из PDF-документа:\n${pdfText}`,
    });
  }

  if (imageUrls && imageUrls.length > 0) {
    userParts.push({
      type: "text",
      text: "Фотографии помещений:",
    });
    for (const url of imageUrls) {
      userParts.push({
        type: "image_url",
        image_url: { url, detail: "high" },
      });
    }
  }

  if (userParts.length === 0) {
    throw new Error("No input provided");
  }

  const response = await ai.chat.completions.create({
    model: MODELS.main,
    messages: [
      { role: "system", content: NORMALIZER_SYSTEM_PROMPT },
      { role: "user", content: userParts },
    ],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from normalizer");
  }

  return JSON.parse(content) as NormalizedInput;
}
