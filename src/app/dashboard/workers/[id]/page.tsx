"use client";

import { use } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  getEmployee,
  getTimeEntriesForEmployee,
  getAllTimeEntriesForEmployee,
} from "@/lib/supabase/queries";
import { HoursChart } from "@/components/hours-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getWorkspaceBasePath } from "@/lib/workspaces";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInMinutes,
} from "date-fns";
import type { TimeEntry } from "@/types";

/** Group time entries by date and compute daily totals */
function groupByDay(entries: TimeEntry[]) {
  const map = new Map<string, { entries: TimeEntry[]; totalMinutes: number }>();

  for (const entry of entries) {
    const dateKey = format(new Date(entry.clock_in), "yyyy-MM-dd");
    if (!map.has(dateKey)) map.set(dateKey, { entries: [], totalMinutes: 0 });
    const day = map.get(dateKey)!;
    day.entries.push(entry);
    const mins = differenceInMinutes(
      entry.clock_out ? new Date(entry.clock_out) : new Date(),
      new Date(entry.clock_in)
    );
    day.totalMinutes += mins;
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, { entries: dayEntries, totalMinutes }]) => ({
      date,
      entries: dayEntries,
      totalMinutes,
    }));
}

export default function WorkerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const supabase = createClient();
  const pathname = usePathname();
  const basePath = getWorkspaceBasePath(pathname);
  const now = new Date();

  const { data: employee } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployee(supabase, id),
  });

  const { data: weekEntries = [] } = useQuery({
    queryKey: ["time-entries", id, "week"],
    queryFn: () =>
      getTimeEntriesForEmployee(
        supabase,
        id,
        startOfWeek(now, { weekStartsOn: 1 }),
        endOfWeek(now, { weekStartsOn: 1 })
      ),
  });

  const { data: monthEntries = [] } = useQuery({
    queryKey: ["time-entries", id, "month"],
    queryFn: () =>
      getTimeEntriesForEmployee(
        supabase,
        id,
        startOfMonth(now),
        endOfMonth(now)
      ),
  });

  const { data: allEntries = [] } = useQuery({
    queryKey: ["time-entries", id, "all"],
    queryFn: () => getAllTimeEntriesForEmployee(supabase, id),
  });

  const totalWeekHours = weekEntries.reduce((acc, entry) => {
    const start = new Date(entry.clock_in).getTime();
    const end = entry.clock_out
      ? new Date(entry.clock_out).getTime()
      : Date.now();
    return acc + (end - start) / (1000 * 60 * 60);
  }, 0);

  const totalMonthHours = monthEntries.reduce((acc, entry) => {
    const start = new Date(entry.clock_in).getTime();
    const end = entry.clock_out
      ? new Date(entry.clock_out).getTime()
      : Date.now();
    return acc + (end - start) / (1000 * 60 * 60);
  }, 0);

  if (!employee) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${basePath}/workers`}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{employee.full_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">
              {employee.email}
            </span>
            <Badge variant="secondary" className="capitalize text-xs">
              {employee.role}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">This Week</p>
            <p className="text-xl font-bold">{totalWeekHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-xl font-bold">{totalMonthHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Days Worked</p>
            <p className="text-xl font-bold">
              {
                new Set(
                  monthEntries.map((e) =>
                    format(new Date(e.clock_in), "yyyy-MM-dd")
                  )
                ).size
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <HoursChart entries={weekEntries} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Work Time</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left font-medium px-6 py-3">Date</th>
                <th className="text-left font-medium px-6 py-3">Sessions</th>
                <th className="text-right font-medium px-6 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {groupByDay(allEntries).map((day) => (
                <tr key={day.date} className="border-b last:border-0">
                  <td className="px-6 py-3 font-medium whitespace-nowrap">
                    {format(new Date(day.date), "EEE, MMM d")}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {day.entries.map((entry) => (
                        <span
                          key={entry.id}
                          className="text-muted-foreground whitespace-nowrap"
                        >
                          {format(new Date(entry.clock_in), "HH:mm")}
                          {" \u2014 "}
                          {entry.clock_out ? (
                            format(new Date(entry.clock_out), "HH:mm")
                          ) : (
                            <span className="text-green-600 font-medium">
                              now
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-medium whitespace-nowrap">
                    {Math.floor(day.totalMinutes / 60)}h{" "}
                    {(day.totalMinutes % 60).toString().padStart(2, "0")}m
                  </td>
                </tr>
              ))}
              {allEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
