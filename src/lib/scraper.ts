import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapeResult } from "@/types";

function detectPlatform(url: string): "instagram" | "facebook" | "unknown" {
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("facebook.com") || url.includes("fb.com")) return "facebook";
  return "unknown";
}

/**
 * Try Instagram's oEmbed endpoint first — this is a public API that
 * returns the caption without needing to scrape HTML.
 * Works for public posts without authentication.
 */
async function tryInstagramOEmbed(url: string): Promise<{ caption: string; thumbnailUrl: string; author: string } | null> {
  try {
    const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(oembedUrl, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    return {
      caption: data.title || "",
      thumbnailUrl: data.thumbnail_url || "",
      author: data.author_name || "",
    };
  } catch {
    return null;
  }
}

/**
 * Try Facebook's oEmbed endpoint.
 */
async function tryFacebookOEmbed(url: string): Promise<{ caption: string; author: string } | null> {
  try {
    const oembedUrl = `https://www.facebook.com/plugins/post/oembed.json/?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(oembedUrl, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    // Facebook oEmbed returns HTML — extract text from it
    const $ = cheerio.load(data.html || "");
    const text = $.text().trim();
    return {
      caption: text || data.title || "",
      author: data.author_name || "",
    };
  } catch {
    return null;
  }
}

/**
 * Fallback: scrape the HTML directly for og: meta tags.
 */
async function scrapeHtml(url: string): Promise<{ caption: string; images: string[]; author: string }> {
  const { data: html } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    timeout: 15000,
    maxRedirects: 5,
  });

  const $ = cheerio.load(html);

  const caption =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:title"]').attr("content") ||
    "";

  const images: string[] = [];
  $('meta[property="og:image"]').each((_, el) => {
    const src = $(el).attr("content");
    if (src && !src.includes("safe_image.php")) images.push(src);
  });
  $('meta[name="twitter:image"]').each((_, el) => {
    const src = $(el).attr("content");
    if (src && !images.includes(src) && !src.includes("safe_image.php")) images.push(src);
  });

  const author =
    $('meta[property="og:site_name"]').attr("content") ||
    $('meta[property="og:title"]').attr("content")?.split("|")[0]?.trim() ||
    "";

  return { caption, images, author };
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const platform = detectPlatform(url);
  let caption = "";
  let images: string[] = [];
  let author = "";

  // Try platform-specific oEmbed first (more reliable)
  if (platform === "instagram") {
    const oembed = await tryInstagramOEmbed(url);
    if (oembed) {
      caption = oembed.caption;
      author = oembed.author;
      if (oembed.thumbnailUrl) {
        images.push(oembed.thumbnailUrl);
      }
    }
  } else if (platform === "facebook") {
    const oembed = await tryFacebookOEmbed(url);
    if (oembed) {
      caption = oembed.caption;
      author = oembed.author;
    }
  }

  // Fallback to HTML scraping if oEmbed didn't get caption
  if (!caption) {
    try {
      const scraped = await scrapeHtml(url);
      caption = caption || scraped.caption;
      author = author || scraped.author;
      if (scraped.images.length > 0 && images.length === 0) {
        images = scraped.images;
      }
    } catch {
      // HTML scraping failed too
    }
  }

  if (!caption && images.length === 0) {
    throw new Error(
      "Could not extract content from URL. The post may be private or the platform is blocking scraping. Try a different URL."
    );
  }

  // Note: images from scraping are usually low quality thumbnails.
  // The UI should encourage uploading full-resolution images manually.
  return {
    caption,
    images,
    platform,
    author,
    imagesNote: images.length > 0
      ? "Scraped images are low-resolution thumbnails. Upload the original images manually for best quality."
      : "No images could be scraped. Please upload images manually.",
  } as ScrapeResult;
}
