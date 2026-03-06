import { NextRequest, NextResponse } from "next/server";
import { processEventContent } from "@/lib/groq";

export async function POST(request: NextRequest) {
  try {
    const { caption, images, platform, sourceUrl } = await request.json();

    if (!caption || typeof caption !== "string") {
      return NextResponse.json(
        { error: "Caption text is required" },
        { status: 400 }
      );
    }

    const result = await processEventContent(
      caption,
      platform || "unknown",
      sourceUrl || ""
    );

    // Attach images from scraping
    if (Array.isArray(images)) {
      result.images = images;
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
