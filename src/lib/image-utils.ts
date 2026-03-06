import sharp from "sharp";
import axios from "axios";

export interface ProcessedImage {
  name: string;
  originalSize: number;
  mainBuffer: Buffer;
  mainSize: number;
  thumbnailBuffer: Buffer;
  thumbnailSize: number;
}

export async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });
  return Buffer.from(response.data);
}

export async function compressImage(
  input: Buffer,
  filename: string
): Promise<ProcessedImage> {
  const originalSize = input.length;

  // Main image: max 1200px width, WEBP, quality 85
  const mainBuffer = await sharp(input)
    .resize(1200, null, {
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: 85 })
    .toBuffer();

  // Thumbnail: 430x430, WEBP, quality 90
  const thumbnailBuffer = await sharp(input)
    .resize(430, 430, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: 90 })
    .toBuffer();

  return {
    name: filename.replace(/\.[^.]+$/, ".webp"),
    originalSize,
    mainBuffer,
    mainSize: mainBuffer.length,
    thumbnailBuffer,
    thumbnailSize: thumbnailBuffer.length,
  };
}
