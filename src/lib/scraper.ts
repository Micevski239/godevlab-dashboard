import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapeResult } from "@/types";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function detectPlatform(url: string): "instagram" | "facebook" | "unknown" {
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("facebook.com") || url.includes("fb.com")) return "facebook";
  return "unknown";
}

/**
 * Try Instagram's oEmbed endpoint — public API, works without authentication.
 */
async function tryInstagramOEmbed(url: string): Promise<{ caption: string; thumbnailUrl: string; author: string } | null> {
  try {
    const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(oembedUrl, {
      timeout: 10000,
      headers: { "User-Agent": BROWSER_UA },
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
 * Scrape Facebook post via the embed plugin endpoint.
 * This endpoint is designed to be loaded by any website (for embedded posts),
 * so it works from Vercel/cloud IPs where direct scraping gets blocked.
 *
 * Does NOT work with /share/p/ URLs — only direct post URLs.
 */
async function tryFacebookEmbed(url: string): Promise<{ caption: string; author: string; images: string[] } | null> {
  try {
    const embedUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;
    const { data: html } = await axios.get(embedUrl, {
      timeout: 15000,
      headers: { "User-Agent": BROWSER_UA },
    });

    const $ = cheerio.load(html);

    const caption =
      $(".userContent").text().trim() ||
      $("._3576").text().trim() ||
      $('[data-testid="post_message"]').text().trim() ||
      "";

    const author =
      $("h3 a").first().text().trim() ||
      $("strong a").first().text().trim() ||
      "";

    const images: string[] = [];
    $('img[src*="scontent"]').each((_, el) => {
      const src = $(el).attr("src");
      if (src) images.push(src);
    });

    if (!caption && images.length === 0) return null;

    return { caption, author, images };
  } catch {
    return null;
  }
}

/**
 * Fallback: scrape HTML directly for og: meta tags.
 * Works locally but may be blocked on cloud providers for Facebook.
 */
async function scrapeHtml(url: string): Promise<{ caption: string; images: string[]; author: string }> {
  const { data: html } = await axios.get(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    timeout: 15000,
    maxRedirects: 5,
  });

  const $ = cheerio.load(html);

  const caption =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";

  const images: string[] = [];
  $('meta[property="og:image"]').each((_, el) => {
    const src = $(el).attr("content");
    if (src && !src.includes("safe_image.php")) images.push(src);
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

  if (platform === "instagram") {
    const oembed = await tryInstagramOEmbed(url);
    if (oembed) {
      caption = oembed.caption;
      author = oembed.author;
      if (oembed.thumbnailUrl) images.push(oembed.thumbnailUrl);
    }
  } else if (platform === "facebook") {
    // Use the embed plugin endpoint — works from Vercel, no auth needed
    const embed = await tryFacebookEmbed(url);
    if (embed) {
      caption = embed.caption;
      author = embed.author;
      images = embed.images;
    }
  }

  // Fallback to HTML scraping if nothing worked yet
  if (!caption && images.length === 0) {
    try {
      const scraped = await scrapeHtml(url);
      caption = scraped.caption;
      author = author || scraped.author;
      images = scraped.images;
    } catch {
      // HTML scraping failed too
    }
  }

  if (!caption && images.length === 0) {
    throw new Error(
      "Could not extract content from URL. The post may be private, or try using a direct post URL instead of a share link. You can also use the 'Paste Text' tab."
    );
  }

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
