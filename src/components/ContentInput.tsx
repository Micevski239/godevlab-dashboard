"use client";

import { useState, useRef } from "react";
import {
  Globe,
  Instagram,
  Facebook,
  Link,
  ArrowRight,
  Type,
  Upload,
  X,
} from "lucide-react";

function detectPlatformIcon(url: string) {
  if (url.includes("instagram.com")) return Instagram;
  if (url.includes("facebook.com") || url.includes("fb.com")) return Facebook;
  return Link;
}

/**
 * Extract the post URL from a Facebook embed iframe code.
 * e.g. <iframe src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2F...">
 */
function extractUrlFromEmbed(input: string): string | null {
  const hrefMatch = input.match(/href=([^&"]+)/);
  if (hrefMatch) {
    try {
      const decoded = decodeURIComponent(hrefMatch[1]);
      if (decoded.includes("facebook.com")) return decoded;
    } catch { /* ignore */ }
  }
  return null;
}

type Mode = "url" | "manual";

export default function ContentInput({
  onSubmitUrl,
  onSubmitManual,
  disabled,
}: {
  onSubmitUrl: (url: string) => void;
  onSubmitManual: (text: string, images: File[]) => void;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const isValidUrl = (() => {
    try {
      const parsed = new URL(url);
      return (
        parsed.hostname.includes("instagram.com") ||
        parsed.hostname.includes("facebook.com") ||
        parsed.hostname.includes("fb.com")
      );
    } catch {
      return false;
    }
  })();

  const PlatformIcon = url ? detectPlatformIcon(url) : Globe;

  const handleUrlChange = (value: string) => {
    // If user pastes an embed iframe, extract the URL from it
    if (value.includes("<iframe") && value.includes("facebook.com")) {
      const extracted = extractUrlFromEmbed(value);
      if (extracted) {
        setUrl(extracted);
        return;
      }
    }
    setUrl(value);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidUrl && !disabled) onSubmitUrl(url);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) onSubmitManual(text.trim(), images);
  };

  const addImages = (files: FileList | null) => {
    if (!files) return;
    setImages((prev) => [...prev, ...Array.from(files)]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Mode Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "url"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Globe className="w-4 h-4" />
            From URL
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "manual"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Type className="w-4 h-4" />
            Paste Text
          </button>
        </div>
      </div>

      {/* URL Mode */}
      {mode === "url" && (
        <>
          <form onSubmit={handleUrlSubmit} className="relative">
            <div className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-brand-700 transition-colors shadow-sm">
              <PlatformIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste a URL or Facebook embed code..."
                className="flex-1 outline-none text-gray-900 placeholder:text-gray-400 bg-transparent"
                disabled={disabled}
              />
              <button
                type="submit"
                disabled={!isValidUrl || disabled}
                className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-brand-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Extract
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
          <p className="text-sm text-gray-400 text-center">
            Supports Instagram and Facebook post URLs
          </p>
        </>
      )}

      {/* Manual Mode */}
      {mode === "manual" && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="bg-white border-2 border-gray-200 rounded-xl focus-within:border-brand-700 transition-colors shadow-sm overflow-hidden">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the post text here..."
              rows={5}
              className="w-full px-4 pt-3 pb-2 outline-none text-gray-900 placeholder:text-gray-400 bg-transparent resize-none"
              disabled={disabled}
            />

            {/* Image previews */}
            {images.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {images.map((file, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={disabled}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Add images
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  addImages(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />
              <button
                type="submit"
                disabled={!text.trim() || disabled}
                className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-brand-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Process
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center">
            Copy the post text from Facebook and paste it here. Images are optional.
          </p>
        </form>
      )}
    </div>
  );
}
