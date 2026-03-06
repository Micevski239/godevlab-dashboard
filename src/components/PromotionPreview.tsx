"use client";

import { Tag, Clock, Ticket } from "lucide-react";
import type { PromotionContent } from "@/types";

export default function PromotionPreview({
  promotion,
}: {
  promotion: PromotionContent;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header image placeholder */}
      {promotion.images.length > 0 ? (
        <div className="h-48 bg-gray-200 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={promotion.images[0]}
            alt={promotion.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
          <Tag className="w-16 h-16 text-white/30" />
        </div>
      )}

      <div className="p-5 space-y-3">
        <h3 className="text-xl font-bold text-gray-900">{promotion.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-3">
          {promotion.description}
        </p>

        <div className="flex flex-col gap-2 text-sm text-gray-600">
          {promotion.valid_until && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-700" />
              <span>Valid until {promotion.valid_until}</span>
            </div>
          )}
          {promotion.discount_code && (
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-brand-700" />
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                {promotion.discount_code}
              </span>
            </div>
          )}
        </div>

        {promotion.tags.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {promotion.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs px-2.5 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
