"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  getTodayTimeEntries,
  getRecentTimeEntries,
} from "@/lib/supabase/queries";
import {
  fetchEvents,
  fetchListings,
  fetchPromotions,
} from "@/lib/django/services";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, MapPin, Tag, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function OverviewPage() {
  const supabase = createClient();

  const { data: todayEntries = [] } = useQuery({
    queryKey: ["today-entries", "gogevgelija"],
    queryFn: () => getTodayTimeEntries(supabase, "gogevgelija"),
    refetchInterval: 30000,
  });

  const { data: recentEntries = [] } = useQuery({
    queryKey: ["recent-entries", "gogevgelija"],
    queryFn: () => getRecentTimeEntries(supabase, "gogevgelija", 5),
  });

  const { data: events } = useQuery({
    queryKey: ["django-events"],
    queryFn: fetchEvents,
  });

  const { data: listings } = useQuery({
    queryKey: ["django-listings"],
    queryFn: fetchListings,
  });

  const { data: promotions } = useQuery({
    queryKey: ["django-promotions"],
    queryFn: fetchPromotions,
  });

  const clockedInNow = todayEntries.filter((e) => !e.clock_out);
  const totalHoursToday = todayEntries.reduce((acc, entry) => {
    const start = new Date(entry.clock_in);
    const end = entry.clock_out ? new Date(entry.clock_out) : new Date();
    return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Overview</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/workers">
            <Clock className="w-4 h-4 mr-2" />
            Clock In
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Clocked In Now"
          value={clockedInNow.length}
          subtitle={`${totalHoursToday.toFixed(1)}h total today`}
          icon={Users}
        />
        <StatCard
          title="Active Events"
          value={events?.count ?? "..."}
          icon={Calendar}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Active Listings"
          value={listings?.count ?? "..."}
          icon={MapPin}
          iconColor="text-green-600"
        />
        <StatCard
          title="Active Promotions"
          value={promotions?.count ?? "..."}
          icon={Tag}
          iconColor="text-purple-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent activity.
            </p>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        entry.clock_out ? "bg-gray-300" : "bg-green-500"
                      }`}
                    />
                    <span className="font-medium">
                      {entry.employee?.full_name ?? "Unknown"}
                    </span>
                    <span className="text-muted-foreground">
                      {entry.clock_out ? "clocked out" : "clocked in"}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(
                      new Date(entry.clock_out || entry.clock_in),
                      {
                        addSuffix: true,
                      }
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
