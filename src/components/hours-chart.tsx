"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimeEntry } from "@/types";
import { format, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";

interface HoursChartProps {
  entries: TimeEntry[];
  title?: string;
}

export function HoursChart({
  entries,
  title = "Hours This Week",
}: HoursChartProps) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const data = days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayEntries = entries.filter(
      (e) => format(new Date(e.clock_in), "yyyy-MM-dd") === dayStr
    );

    const hours = dayEntries.reduce((acc, entry) => {
      const start = new Date(entry.clock_in).getTime();
      const end = entry.clock_out
        ? new Date(entry.clock_out).getTime()
        : Date.now();
      return acc + (end - start) / (1000 * 60 * 60);
    }, 0);

    return {
      day: format(day, "EEE"),
      hours: Math.round(hours * 10) / 10,
    };
  });

  const totalHours = data.reduce((acc, d) => acc + d.hours, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {totalHours.toFixed(1)}h total
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" fontSize={12} tickLine={false} />
            <YAxis
              fontSize={12}
              tickLine={false}
              axisLine={false}
              unit="h"
            />
            <Tooltip
              formatter={(value: number) => [`${value}h`, "Hours"]}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="hours" fill="#B91C1C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
