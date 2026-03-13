"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ChevronLeft, ChevronRight, Check } from "lucide-react";

interface CalendarDay {
  date: string;
  title: string;
  description: string;
  platform: "instagram" | "facebook" | "both";
  type: "event" | "promotion" | "story" | "reel" | "post";
}

const TYPE_COLORS: Record<string, string> = {
  event: "bg-blue-100 border-blue-300 text-blue-800",
  promotion: "bg-amber-100 border-amber-300 text-amber-800",
  story: "bg-purple-100 border-purple-300 text-purple-800",
  reel: "bg-pink-100 border-pink-300 text-pink-800",
  post: "bg-green-100 border-green-300 text-green-800",
};

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "IG",
  facebook: "FB",
  both: "IG+FB",
};

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarPage() {
  const [text, setText] = useState("");
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [doneSet, setDoneSet] = useState<Set<string>>(new Set());

  const toggleDone = (date: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDoneSet((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const { firstDay, daysInMonth } = getMonthDays(viewYear, viewMonth);

  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (const d of days) {
      map.set(d.date, d);
    }
    return map;
  }, [days]);

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedDay(null);

    const startDate = formatDate(viewYear, viewMonth, 1);
    const endDate = formatDate(viewYear, viewMonth, daysInMonth);

    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, startDate, endDate }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate");
      }

      const data = await res.json();
      setDays(data.days || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Content Calendar</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Paste your ideas and AI will plan what to post each day
      </p>

      {/* Input section */}
      <div className="mb-6 max-w-3xl">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your content ideas, event info, themes, notes... AI will turn this into a daily posting plan for the selected month."
          className="w-full h-40 border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700"
        />
        <div className="flex items-center gap-3 mt-3">
          <Button
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            className="bg-brand-700 hover:bg-brand-800 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {loading ? "Generating..." : "Generate Calendar"}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold w-48 text-center">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h2>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Legend */}
      {days.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {Object.entries(TYPE_COLORS).map(([type, cls]) => (
            <span
              key={type}
              className={`text-xs px-2 py-0.5 rounded border ${cls} capitalize`}
            >
              {type}
            </span>
          ))}
          <span className="text-xs px-2 py-0.5 rounded border bg-emerald-100 border-emerald-300 text-emerald-800">
            ✓ prepared
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            {doneSet.size}/{days.length} done
          </span>
        </div>
      )}

      {/* Calendar grid */}
      <div className="border rounded-lg overflow-hidden bg-white">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="p-2 text-xs font-medium text-muted-foreground text-center"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r h-28 bg-gray-50/50" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = formatDate(viewYear, viewMonth, dayNum);
            const entry = dayMap.get(dateStr);
            const isDone = doneSet.has(dateStr);
            const isToday =
              dayNum === now.getDate() &&
              viewMonth === now.getMonth() &&
              viewYear === now.getFullYear();

            return (
              <div
                key={dayNum}
                className={`border-b border-r h-28 p-1.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isDone
                    ? "bg-emerald-50"
                    : isToday
                      ? "bg-brand-50/50"
                      : ""
                } ${selectedDay?.date === dateStr ? "ring-2 ring-brand-700 ring-inset" : ""}`}
                onClick={() => entry && setSelectedDay(entry)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-medium ${
                      isToday
                        ? "bg-brand-700 text-white w-5 h-5 rounded-full flex items-center justify-center"
                        : "text-gray-500"
                    }`}
                  >
                    {dayNum}
                  </span>
                  <div className="flex items-center gap-1">
                    {entry && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {PLATFORM_LABEL[entry.platform] || entry.platform}
                      </span>
                    )}
                    {entry && (
                      <button
                        onClick={(e) => toggleDone(dateStr, e)}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isDone
                            ? "bg-emerald-500 border-emerald-600 text-white"
                            : "border-gray-300 hover:border-emerald-400 text-transparent hover:text-emerald-400"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
                {entry && (
                  <div
                    className={`text-[11px] leading-tight px-1 py-0.5 rounded border ${
                      isDone
                        ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                        : TYPE_COLORS[entry.type] || "bg-gray-100 border-gray-300 text-gray-700"
                    }`}
                  >
                    <span className="line-clamp-2 font-medium">
                      {isDone ? "✓ " : ""}{entry.title}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Trailing empty cells */}
          {Array.from({
            length: (7 - ((firstDay + daysInMonth) % 7)) % 7,
          }).map((_, i) => (
            <div key={`trail-${i}`} className="border-b border-r h-28 bg-gray-50/50" />
          ))}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-4 max-w-xl border rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{selectedDay.title}</h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-muted-foreground hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <div className="flex gap-2 mb-2">
            <span
              className={`text-xs px-2 py-0.5 rounded border capitalize ${TYPE_COLORS[selectedDay.type] || ""}`}
            >
              {selectedDay.type}
            </span>
            <span className="text-xs px-2 py-0.5 rounded border bg-gray-100 text-gray-700">
              {selectedDay.platform === "both"
                ? "Instagram + Facebook"
                : selectedDay.platform}
            </span>
            <span className="text-xs text-muted-foreground py-0.5">
              {selectedDay.date}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-3">{selectedDay.description}</p>
          <button
            onClick={(e) => toggleDone(selectedDay.date, e)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              doneSet.has(selectedDay.date)
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border"
            }`}
          >
            {doneSet.has(selectedDay.date) ? "✓ Prepared" : "Mark as prepared"}
          </button>
        </div>
      )}
    </div>
  );
}
