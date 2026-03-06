"use client";

import { Calendar, MapPin, Ticket, Users } from "lucide-react";
import type { EventContent } from "@/types";

export default function EventPreview({ event }: { event: EventContent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header image placeholder */}
      {event.images.length > 0 ? (
        <div className="h-48 bg-gray-200 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.images[0]}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
          <Calendar className="w-16 h-16 text-white/30" />
        </div>
      )}

      <div className="p-5 space-y-3">
        <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-3">
          {event.description}
        </p>

        <div className="flex flex-col gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-700" />
            <span>{event.date_time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-700" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-brand-700" />
            <span>{event.entry_price}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-700" />
            <span>{event.age_limit}</span>
          </div>
        </div>

        {event.expectations.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              What to Expect
            </p>
            <div className="flex flex-wrap gap-2">
              {event.expectations.map((exp, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs px-2.5 py-1 rounded-full"
                >
                  {exp.text}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
