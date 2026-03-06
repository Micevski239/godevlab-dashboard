"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyField({
  label,
  value,
  multiline,
  onChange,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onChange?: (value: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const editable = !!onChange;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </label>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-green-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {editable ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition-colors resize-y min-h-[60px]"
            rows={3}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition-colors"
          />
        )
      ) : multiline ? (
        <div
          onClick={handleCopy}
          className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-800 cursor-pointer hover:bg-gray-100 transition-colors whitespace-pre-wrap min-h-[60px]"
        >
          {value}
        </div>
      ) : (
        <div
          onClick={handleCopy}
          className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-800 cursor-pointer hover:bg-gray-100 transition-colors truncate"
        >
          {value}
        </div>
      )}
    </div>
  );
}
