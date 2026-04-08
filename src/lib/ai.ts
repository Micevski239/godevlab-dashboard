import OpenAI from "openai";
import type { EventContent, PromotionContent } from "@/types";

function getClient(): { client: OpenAI; model: string } {
  if (process.env.AI_PROVIDER === "groq") {
    return {
      client: new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      }),
      model: "llama-3.3-70b-versatile",
    };
  }
  return {
    client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    model: "gpt-4o-mini",
  };
}

const VALID_ICONS = [
  "musical-notes",
  "restaurant",
  "beer",
  "wine",
  "camera",
  "people",
  "happy",
  "star",
  "heart",
  "flash",
  "time",
  "location",
  "ticket",
  "gift",
  "trophy",
  "mic",
  "headset",
  "bonfire",
  "cafe",
  "cart",
  "fitness",
  "football",
  "game-controller",
  "globe",
  "leaf",
  "paw",
  "ribbon",
  "rose",
  "sparkles",
  "sunny",
  "water",
];

const SYSTEM_PROMPT = `You are an assistant that extracts structured event information from social media post captions for a tourism app in Gevgelija, North Macedonia.

Your task:
1. Extract event details from the provided caption text
2. Structure them into specific fields matching the Django Event model
3. Translate ALL text fields into natural Macedonian (not Google Translate quality — use proper Macedonian phrasing)

Output a JSON object with these exact fields:

- title: Event title in English (concise, catchy)
- description: Event description in English (2-4 sentences, engaging)
- date_time: Date/time string (e.g., "Fri, 20:00" or "Dec 25, 18:00" or "Every Saturday, 21:00")
- location: Venue name and/or address in English
- entry_price: Price string (e.g., "Free", "500 MKD", "10 EUR"). Default to "Free" if not mentioned.
- age_limit: Age restriction (e.g., "All ages welcome", "18+"). Default to "All ages welcome" if not mentioned.
- expectations: Array of 3-5 objects with { "icon": string, "text": string }. Icons MUST be from this list: ${VALID_ICONS.join(", ")}. Text should be short phrases describing what attendees can expect.

- title_mk: Title in Macedonian
- description_mk: Description in Macedonian
- location_mk: Location in Macedonian (transliterate if needed, keep proper nouns)
- entry_price_mk: Price in Macedonian (e.g., "Бесплатно", "500 МКД", "10 ЕУР")
- age_limit_mk: Age limit in Macedonian (e.g., "Добредојдени се сите возрасти", "18+")
- expectations_mk: Same array structure but with text in Macedonian. Icons stay the same.

Rules:
- If information is missing from the caption, make reasonable inferences for a nightlife/entertainment venue in Gevgelija
- Keep titles under 100 characters
- Descriptions should be engaging and informative
- Date/time should follow the format used in the app: "Day, HH:MM" or "Month DD, HH:MM"
- For expectations, pick the most relevant icons from the valid list
- Macedonian translations must sound natural — as if written by a native speaker
- ONLY output valid JSON, no markdown fences, no extra text`;

export async function processEventContent(
  caption: string,
  platform: string,
  sourceUrl: string
): Promise<EventContent> {
  const { client, model } = getClient();
  const response = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Extract event information from this ${platform} post caption:\n\n${caption}`,
      },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const parsed = JSON.parse(content);

  const result: EventContent = {
    ...parsed,
    images: [],
    facebook_url: platform === "facebook" ? sourceUrl : undefined,
    instagram_url: platform === "instagram" ? sourceUrl : undefined,
  };

  return result;
}

const PROMOTION_SYSTEM_PROMPT = `You are an assistant that extracts structured promotion/deal information from social media post captions for a tourism app in Gevgelija, North Macedonia.

Your task:
1. Extract promotion details from the provided caption text
2. Structure them into specific fields matching the Django Promotion model
3. Translate ALL text fields into natural Macedonian (not Google Translate quality — use proper Macedonian phrasing)

Output a JSON object with these exact fields:

- title: Promotion title in English (concise, catchy)
- description: Promotion description in English (2-4 sentences, engaging, highlight the deal/offer)
- tags: Array of 2-5 short tag strings in English (e.g., ["50% off", "Weekend deal", "Limited time"])
- valid_until: Expiry date/time string if mentioned (e.g., "Dec 31, 2025" or "Every weekend"). Empty string if not mentioned.
- has_discount_code: Boolean — true if a discount/promo code is mentioned
- discount_code: The discount code if mentioned, empty string otherwise

- title_mk: Title in Macedonian
- description_mk: Description in Macedonian
- tags_mk: Same tags array but in Macedonian

Rules:
- If information is missing from the caption, make reasonable inferences for a business/venue in Gevgelija
- Keep titles under 100 characters
- Descriptions should be engaging and highlight the value proposition
- Tags should be short phrases (1-3 words each) that capture key selling points
- Macedonian translations must sound natural — as if written by a native speaker
- ONLY output valid JSON, no markdown fences, no extra text`;

export async function processPromotionContent(
  caption: string,
  platform: string,
  sourceUrl: string
): Promise<PromotionContent> {
  const { client, model } = getClient();
  const response = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PROMOTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Extract promotion information from this ${platform} post caption:\n\n${caption}`,
      },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const parsed = JSON.parse(content);

  const result: PromotionContent = {
    ...parsed,
    images: [],
    facebook_url: platform === "facebook" ? sourceUrl : undefined,
    instagram_url: platform === "instagram" ? sourceUrl : undefined,
  };

  return result;
}
