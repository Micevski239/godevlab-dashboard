import { NextRequest, NextResponse } from "next/server";
import { compressImage, downloadImage } from "@/lib/image-utils";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let images: { buffer: Buffer; name: string }[] = [];

    if (contentType.includes("multipart/form-data")) {
      // Handle file uploads
      const formData = await request.formData();
      const files = formData.getAll("images");

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file instanceof File) {
          const arrayBuffer = await file.arrayBuffer();
          images.push({
            buffer: Buffer.from(arrayBuffer),
            name: file.name || `image_${i}.jpg`,
          });
        }
      }
    } else {
      // Handle JSON with image URLs
      const { urls } = await request.json();

      if (!Array.isArray(urls) || urls.length === 0) {
        return NextResponse.json(
          { error: "No images provided" },
          { status: 400 }
        );
      }

      for (let i = 0; i < urls.length; i++) {
        try {
          const buffer = await downloadImage(urls[i]);
          images.push({
            buffer,
            name: `image_${i}.jpg`,
          });
        } catch {
          // Skip failed downloads
          console.error(`Failed to download image ${i}: ${urls[i]}`);
        }
      }
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No valid images to process" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      images.map(async ({ buffer, name }) => {
        const processed = await compressImage(buffer, name);
        return {
          name: processed.name,
          originalSize: processed.originalSize,
          compressedSize: processed.mainSize,
          thumbnailSize: processed.thumbnailSize,
          mainBase64: processed.mainBuffer.toString("base64"),
          thumbnailBase64: processed.thumbnailBuffer.toString("base64"),
        };
      })
    );

    return NextResponse.json({ images: results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to compress images";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
