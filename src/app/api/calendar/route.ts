import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a social media content calendar planner for GoGevgelija, a tourism app for Gevgelija, North Macedonia.

The user will give you text (ideas, notes, event info, themes) and a date range (start and end dates).

Your task: create a day-by-day content posting plan for the given date range. For each day, suggest what to post on social media to promote Gevgelija tourism.

Output a JSON object with this exact structure:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "title": "Short post title (under 60 chars)",
      "description": "1-2 sentence description of what to post and why",
      "platform": "instagram" | "facebook" | "both",
      "type": "event" | "promotion" | "story" | "reel" | "post"
    }
  ]
}

Rules:
- Cover EVERY day in the given date range, no gaps
- Vary content types across days (mix posts, stories, reels, events, promotions)
- Vary platforms (don't always say "both")
- Base suggestions on the user's provided text/ideas
- Keep titles short and actionable
- Descriptions should tell the person what exactly to post
- If the user mentions specific dates for events, place them on those dates
- Fill remaining days with related promotional or engagement content
- ONLY output valid JSON, no markdown fences, no extra text`;

export async function POST(request: NextRequest) {
  try {
    const { text, startDate, endDate } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text input is required" },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Date range: ${startDate} to ${endDate}\n\nHere are my content ideas and notes:\n\n${text}`,
        },
      ],
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate calendar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
