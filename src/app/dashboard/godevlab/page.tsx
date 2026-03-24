"use client";

import { useQuery } from "@tanstack/react-query";
import { addDays, format, formatDistanceToNow, isAfter } from "date-fns";
import {
  CheckSquare,
  Clock,
  FolderKanban,
  Lightbulb,
  TimerReset,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getTodayTimeEntries } from "@/lib/supabase/queries";
import {
  getAllGoDevLabProjectTasks,
  getGoDevLabNotes,
  getGoDevLabPosts,
  getGoDevLabProjects,
  getRecentGoDevLabUpdates,
} from "@/lib/supabase/godevlab-queries";

export default function GoDevLabOverviewPage() {
  const supabase = createClient();

  const { data: todayEntries = [] } = useQuery({
    queryKey: ["today-entries", "godevlab"],
    queryFn: () => getTodayTimeEntries(supabase, "godevlab"),
    refetchInterval: 30000,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["godevlab-projects"],
    queryFn: () => getGoDevLabProjects(supabase),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["godevlab-project-tasks"],
    queryFn: () => getAllGoDevLabProjectTasks(supabase),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["godevlab-posts"],
    queryFn: () => getGoDevLabPosts(supabase),
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["godevlab-notes"],
    queryFn: () => getGoDevLabNotes(supabase),
  });

  const { data: recentUpdates = [] } = useQuery({
    queryKey: ["godevlab-recent-updates"],
    queryFn: () => getRecentGoDevLabUpdates(supabase, 5),
  });

  const clockedInNow = todayEntries.filter((entry) => !entry.clock_out);
  const totalHoursToday = todayEntries.reduce((acc, entry) => {
    const start = new Date(entry.clock_in);
    const end = entry.clock_out ? new Date(entry.clock_out) : new Date();
    return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);

  const activeProjects = projects.filter(
    (project) => project.status !== "completed"
  );
  const openTasks = tasks.filter((task) => task.status !== "done");
  const completedTasks = tasks.filter((task) => task.status === "done");
  const inspirationCount = posts.length + notes.length;
  const upcomingDeadlines = projects
    .filter(
      (project) =>
        project.due_date &&
        project.status !== "completed" &&
        isAfter(addDays(new Date(project.due_date), 1), new Date())
    )
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
    .slice(0, 4);

  const taskCompletionRate =
    tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Team pulse, active work, and the latest project progress from
            GoDevLab.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/godevlab/projects">
            <FolderKanban className="mr-2 h-4 w-4" />
            Open Projects
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Clocked In Now"
          value={clockedInNow.length}
          subtitle={`${totalHoursToday.toFixed(1)}h logged today`}
          icon={Clock}
        />
        <StatCard
          title="Active Projects"
          value={activeProjects.length}
          subtitle={`${projects.length} total projects`}
          icon={FolderKanban}
          iconColor="text-sky-600"
        />
        <StatCard
          title="Open Tasks"
          value={openTasks.length}
          subtitle={`${taskCompletionRate}% completion rate`}
          icon={CheckSquare}
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Inspiration Items"
          value={inspirationCount}
          subtitle={`${posts.length} posts and ${notes.length} notes`}
          icon={Lightbulb}
          iconColor="text-amber-600"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Project Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUpdates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No project updates yet.
              </p>
            ) : (
              <div className="space-y-4">
                {recentUpdates.map((update) => (
                  <div
                    key={update.id}
                    className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {update.title}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {update.details}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-brand-700">
                          {update.employee?.full_name ?? "Unknown"}
                        </span>
                        <span className="capitalize">{update.update_type}</span>
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(update.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No due dates scheduled yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-lg border border-gray-200 px-4 py-3"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {project.title}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="capitalize">{project.status}</span>
                        <span>
                          {project.due_date
                            ? format(new Date(project.due_date), "MMM d, yyyy")
                            : "No due date"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workflow Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tasks completed</span>
                  <span className="font-medium text-gray-900">
                    {completedTasks.length}/{tasks.length || 0}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-brand-700 transition-all"
                    style={{ width: `${taskCompletionRate}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <TimerReset className="h-4 w-4 text-brand-700" />
                  Focus this week
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {activeProjects.length === 0
                    ? "Add a project to start tracking team execution."
                    : `${activeProjects.length} active projects are moving, with ${openTasks.length} open tasks still in progress.`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
