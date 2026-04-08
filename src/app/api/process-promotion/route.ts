import { NextRequest, NextResponse } from "next/server";
import { processPromotionContent } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const { caption, images, platform, sourceUrl, provider } = await request.json();

    if (!caption || typeof caption !== "string") {
      return NextResponse.json(
        { error: "Caption text is required" },
        { status: 400 }
      );
    }

    const result = await processPromotionContent(
      caption,
      platform || "unknown",
      sourceUrl || "",
      provider
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
