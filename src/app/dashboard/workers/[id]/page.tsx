"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  getEmployee,
  getTimeEntriesForEmployee,
} from "@/lib/supabase/queries";
import { HoursChart } from "@/components/hours-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInMinutes,
} from "date-fns";

export default function WorkerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const supabase = createClient();
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
          <Link href="/dashboard/workers">
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
          <CardTitle className="text-base">Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {monthEntries.slice(0, 20).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-sm py-2 border-b last:border-0"
              >
                <div>
                  <span className="font-medium">
                    {format(new Date(entry.clock_in), "EEE, MMM d")}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {format(new Date(entry.clock_in), "HH:mm")}
                    {" \u2014 "}
                    {entry.clock_out
                      ? format(new Date(entry.clock_out), "HH:mm")
                      : "now"}
                  </span>
                </div>
                <span className="font-mono text-muted-foreground">
                  {entry.clock_out
                    ? `${(
                        differenceInMinutes(
                          new Date(entry.clock_out),
                          new Date(entry.clock_in)
                        ) / 60
                      ).toFixed(1)}h`
                    : "active"}
                </span>
              </div>
            ))}
            {monthEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No entries this month.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
