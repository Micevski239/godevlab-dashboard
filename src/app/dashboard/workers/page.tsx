"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getEmployees, getTodayTimeEntries } from "@/lib/supabase/queries";
import { ClockWidget } from "@/components/clock-widget";
import { WorkerTable } from "@/components/worker-table";

export default function WorkersPage() {
  const supabase = createClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployees(supabase),
  });

  const { data: todayEntries = [] } = useQuery({
    queryKey: ["today-entries"],
    queryFn: () => getTodayTimeEntries(supabase),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Employees</h1>
      <ClockWidget />
      <div>
        <h2 className="text-lg font-semibold mb-3">Team</h2>
        <WorkerTable employees={employees} todayEntries={todayEntries} />
      </div>
    </div>
  );
}
