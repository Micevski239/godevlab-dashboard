/**
 * Generates OpenAI fine-tuning JSONL from event API data.
 *
 * For each event it:
 *  1. Asks GPT-4o to write a realistic social media caption (as the venue would post it)
 *  2. Asks GPT-4o to produce all Macedonian translations
 *  3. Assembles a (system + user + assistant) training example
 *
 * Run:  node scripts/generate-training-data.mjs
 * Output: scripts/training_data.jsonl
 */

import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── paste your API response here ──────────────────────────────────────────────
const events = [
  {
    id: 64,
    title: "Easter Night with YU Bend",
    description:
      "🪺 A night you don't want to miss!\r\n\r\nEnjoy great live music with YU Bend and a festive atmosphere at Velvicia.\r\nWith every reservation, you get an Easter cake and egg! 🥂",
    date_time: "11.04, 21:00",
    location: "Velvicia",
    entry_price: "Reservation",
    age_limit: "All ages welcome",
    expectations: [
      { icon: "musical-notes", text: "Live performance by YU Bend" },
      { icon: "restaurant", text: "Easter treats included" },
      { icon: "wine", text: "Night atmosphere" },
      { icon: "people", text: "Social & fun vibe" },
    ],
    facebook_url: "https://www.facebook.com/velvicia",
    instagram_url: "https://www.instagram.com/restaurant_velvicia/",
  },
  {
    id: 67,
    title: "Easter Kids Workshop",
    description:
      "Get ready for a creative Easter adventure full of colors, smiles, and joy! 🐣🎨\r\nWe invite all kids to create their own festive magic at our Easter workshop. 🌸🐰\r\nThe workshop is free and no registration is required. ✨",
    date_time: "09.04, 17:30-19:30",
    location: "Gevgelija Mall",
    entry_price: "Free",
    age_limit: "All ages welcome",
    expectations: [
      { icon: "color-palette", text: "Creative activities" },
      { icon: "happy", text: "Fun and smiles" },
      { icon: "flower", text: "Easter atmosphere" },
      { icon: "people", text: "Kids socializing" },
    ],
    facebook_url: "https://www.facebook.com/GevgelijaMall",
    instagram_url: "https://www.instagram.com/gevgelijamall/",
  },
  {
    id: 66,
    title: "Friday Night with Bobi Pavlovski",
    description:
      "🎶 This Friday at Daily Coffee House!\r\n\r\nGet ready for a night of great music and energy with Bobi Pavlovski.\r\nA perfect atmosphere for a fun night out.",
    date_time: "10.04, 21:00",
    location: "Daily Coffee House",
    entry_price: "Reservation",
    age_limit: "18+",
    expectations: [
      { icon: "musical-notes", text: "Live performance" },
      { icon: "wine", text: "Night atmosphere" },
      { icon: "people", text: "Social & fun vibe" },
      { icon: "happy", text: "Great energy" },
    ],
    facebook_url: "https://www.facebook.com/profile.php?id=100069126780268",
    instagram_url: "https://www.instagram.com/dailycoffeehouse/",
  },
  {
    id: 62,
    title: "Balkan Party with DJ Lichen",
    description:
      "🎧 Saturday at Daily Coffee House!\r\n\r\nGet ready for a Balkan Party night with DJ Lichen and the best hits to keep the energy high all night long.\r\nA night full of rhythm, vibes, and non-stop fun.",
    date_time: "27.03 21:00",
    location: "Daily Coffee House",
    entry_price: "Reservation",
    age_limit: "18+",
    expectations: [
      { icon: "musical-notes", text: "Balkan hits" },
      { icon: "wine", text: "Night party" },
      { icon: "people", text: "Full party vibe" },
    ],
    facebook_url: "https://www.facebook.com/profile.php?id=100069126780268",
    instagram_url: "https://www.instagram.com/dailycoffeehouse/",
  },
];
// ─────────────────────────────────────────────────────────────────────────────

const VALID_ICONS = [
  "musical-notes","restaurant","beer","wine","camera","people","happy","star",
  "heart","flash","time","location","ticket","gift","trophy","mic","headset",
  "bonfire","cafe","cart","fitness","football","game-controller","globe","leaf",
  "paw","ribbon","rose","sparkles","sunny","water",
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

async function buildTrainingExample(event) {
  const platform = event.instagram_url ? "instagram" : "facebook";

  // Ask GPT-4o to write a realistic caption + produce MK translations
  const prep = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You generate synthetic training data. Given a structured event, do two things:
1. Write a realistic social media caption in Macedonian (or mixed MK/EN with emojis) as the venue owner would actually post it on ${platform}.
2. Translate all English fields into natural Macedonian — as a native speaker would write them.

Output JSON:
- caption: the post text (realistic, with emojis, hashtags if appropriate)
- title_mk
- description_mk
- location_mk
- entry_price_mk  (e.g. "Бесплатно", "Резервација", "500 МКД", "10 ЕУР")
- age_limit_mk    (e.g. "Добредојдени се сите возрасти", "18+")
- expectations_mk (array of {icon, text} — same icons, text in Macedonian)`,
      },
      {
        role: "user",
        content: JSON.stringify({
          title: event.title,
          description: event.description,
          date_time: event.date_time,
          location: event.location,
          entry_price: event.entry_price,
          age_limit: event.age_limit,
          expectations: event.expectations,
        }),
      },
    ],
    temperature: 0.7,
  });

  const generated = JSON.parse(prep.choices[0].message.content);

  const assistantOutput = {
    title: event.title,
    description: event.description.replace(/\r\n/g, "\n").trim(),
    date_time: event.date_time,
    location: event.location,
    entry_price: event.entry_price || "Free",
    age_limit: event.age_limit || "All ages welcome",
    expectations: event.expectations,
    title_mk: generated.title_mk,
    description_mk: generated.description_mk,
    location_mk: generated.location_mk,
    entry_price_mk: generated.entry_price_mk,
    age_limit_mk: generated.age_limit_mk,
    expectations_mk: generated.expectations_mk,
  };

  return {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Extract event information from this ${platform} post caption:\n\n${generated.caption}`,
      },
      {
        role: "assistant",
        content: JSON.stringify(assistantOutput),
      },
    ],
  };
}

async function main() {
  console.log(`Processing ${events.length} events...`);
  const lines = [];

  for (const event of events) {
    process.stdout.write(`  → ${event.title} ... `);
    const example = await buildTrainingExample(event);
    lines.push(JSON.stringify(example));
    console.log("done");
  }

  const outPath = new URL("./training_data.jsonl", import.meta.url).pathname;
  fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
  console.log(`\nWrote ${lines.length} examples to ${outPath}`);
  console.log("\nNext step: upload to https://platform.openai.com/finetune");
}

main().catch(console.error);
