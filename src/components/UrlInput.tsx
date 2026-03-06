"use client";

import { useState } from "react";
import { Globe, Instagram, Facebook, Link, ArrowRight } from "lucide-react";

function detectPlatformIcon(url: string) {
  if (url.includes("instagram.com")) return Instagram;
  if (url.includes("facebook.com") || url.includes("fb.com")) return Facebook;
  return Link;
}

export default function UrlInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}) {
  const [url, setUrl] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidUrl && !disabled) {
      onSubmit(url);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-brand-700 transition-colors shadow-sm">
          <PlatformIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Instagram or Facebook post URL..."
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
      <p className="mt-3 text-sm text-gray-400 mx-auto block">
        Supports Instagram and Facebook post URLs
      </p>
    </div>
  );
}
