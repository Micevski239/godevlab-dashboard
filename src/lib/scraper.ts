import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapeResult } from "@/types";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Facebook serves og: meta tags to known crawler User-Agents
const CRAWLER_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

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
 * Try Facebook's Graph API oEmbed endpoint (requires app access token).
 * Falls back to the legacy plugin endpoint if no token is configured.
 */
async function tryFacebookOEmbed(url: string): Promise<{ caption: string; author: string } | null> {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

  // Try Graph API oEmbed if access token is available
  if (accessToken) {
    try {
      const oembedUrl = `https://graph.facebook.com/v21.0/oembed_post?url=${encodeURIComponent(url)}&access_token=${accessToken}`;
      const { data } = await axios.get(oembedUrl, { timeout: 10000 });
      const $ = cheerio.load(data.html || "");
      const text = $.text().trim();
      return {
        caption: text || data.title || "",
        author: data.author_name || "",
      };
    } catch {
      // Fall through to legacy endpoint
    }
  }

  // Legacy plugin endpoint (may not work without auth)
  try {
    const oembedUrl = `https://www.facebook.com/plugins/post/oembed.json/?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(oembedUrl, {
      timeout: 10000,
      headers: { "User-Agent": BROWSER_UA },
    });
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
 * Fetch and parse HTML from a URL, returning og: content and the canonical URL if present.
 */
async function fetchAndParse(url: string, userAgent: string) {
  const { data: html } = await axios.get(url, {
    headers: {
      "User-Agent": userAgent,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    timeout: 15000,
    maxRedirects: 5,
  });

  const $ = cheerio.load(html);

  let caption =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
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

  // Use og:title for author (page name), not as caption fallback
  const author =
    $('meta[property="og:site_name"]').attr("content") ||
    $('meta[property="og:title"]').attr("content")?.split("|")[0]?.trim() ||
    "";

  // Extract canonical URL — Facebook share pages often include this even
  // when they don't return the full og: content
  const canonicalUrl =
    $('meta[property="og:url"]').attr("content") ||
    $('link[rel="canonical"]').attr("href") ||
    $('meta[http-equiv="refresh"]').attr("content")?.match(/url=(.+)/i)?.[1] ||
    "";

  // Facebook text-only posts have no og:description, but the post text
  // is embedded in the og:url as a hyphenated slug between /posts/ and /id/
  // e.g. /posts/оглас-за-вработување-во-глорион/122157100832714265/
  if (!caption && canonicalUrl.includes("/posts/")) {
    const slugMatch = canonicalUrl.match(/\/posts\/([^/]+)\/\d+/);
    if (slugMatch) {
      const decoded = decodeURIComponent(slugMatch[1]).replace(/-/g, " ");
      // Only use if it's actual text (not just numbers/IDs)
      if (decoded.length > 5 && !/^\d+$/.test(decoded.trim())) {
        caption = decoded;
      }
    }
  }

  return { caption, images, author, canonicalUrl };
}

/**
 * Scrape HTML using a crawler User-Agent. Facebook serves og: meta tags
 * to recognized crawlers (like facebookexternalhit, Twitterbot, etc.)
 * while blocking regular browser scraping with a login wall.
 *
 * For share/short URLs that redirect via JS, extracts the canonical URL
 * and retries with it.
 */
async function scrapeHtml(url: string, platform: string): Promise<{ caption: string; images: string[]; author: string }> {
  const userAgent = platform === "facebook" ? CRAWLER_UA : BROWSER_UA;

  const result = await fetchAndParse(url, userAgent);

  // If we got content, return it
  if (result.caption || result.images.length > 0) {
    return result;
  }

  // No content but we found a canonical URL — retry with it (handles share/short URLs)
  if (result.canonicalUrl && result.canonicalUrl !== url && result.canonicalUrl.includes("facebook.com")) {
    const retry = await fetchAndParse(result.canonicalUrl, userAgent);
    return retry;
  }

  return result;
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const platform = detectPlatform(url);
  let caption = "";
  let images: string[] = [];
  let author = "";
  const isShareUrl = url.includes("/share/") || url.includes("fb.com/");

  // For Facebook share/short URLs, skip oEmbed (doesn't work with share links)
  // and go straight to HTML scraping — axios GET follows redirects automatically,
  // and the crawler UA gets og: tags from the final page.
  if (platform === "facebook" && isShareUrl) {
    try {
      const scraped = await scrapeHtml(url, platform);
      caption = scraped.caption;
      author = scraped.author;
      images = scraped.images;
    } catch {
      // HTML scraping failed
    }
  } else {
    // Try platform-specific oEmbed first (more reliable for direct post URLs)
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
        const scraped = await scrapeHtml(url, platform);
        caption = caption || scraped.caption;
        author = author || scraped.author;
        if (scraped.images.length > 0 && images.length === 0) {
          images = scraped.images;
        }
      } catch {
        // HTML scraping failed too
      }
    }
  }

  if (!caption && images.length === 0) {
    throw new Error(
      "Could not extract content from URL. The post may be private or the platform is blocking scraping. Try a different URL."
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
