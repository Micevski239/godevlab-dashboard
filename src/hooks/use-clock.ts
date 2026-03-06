"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getActiveTimeEntry, clockIn, clockOut } from "@/lib/supabase/queries";
import type { TimeEntry } from "@/types";

export function useClock(employeeId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(0);

  const { data: activeEntry, isLoading } = useQuery<TimeEntry | null>({
    queryKey: ["active-entry", employeeId],
    queryFn: () =>
      employeeId ? getActiveTimeEntry(supabase, employeeId) : null,
    enabled: !!employeeId,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!activeEntry) {
      setElapsed(0);
      return;
    }

    const calcElapsed = () => {
      const start = new Date(activeEntry.clock_in).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };

    calcElapsed();
    const interval = setInterval(calcElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeEntry]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["active-entry"] });
    queryClient.invalidateQueries({ queryKey: ["today-entries"] });
    queryClient.invalidateQueries({ queryKey: ["recent-entries"] });
  };

  const clockInMutation = useMutation({
    mutationFn: () => clockIn(supabase, employeeId!),
    onSuccess: invalidate,
  });

  const clockOutMutation = useMutation({
    mutationFn: (notes?: string) => clockOut(supabase, activeEntry!.id, notes),
    onSuccess: invalidate,
  });

  const formatElapsed = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return {
    activeEntry,
    isLoading,
    isClockedIn: !!activeEntry,
    elapsed,
    elapsedFormatted: formatElapsed(elapsed),
    clockIn: clockInMutation.mutate,
    clockOut: clockOutMutation.mutate,
    isClockingIn: clockInMutation.isPending,
    isClockingOut: clockOutMutation.isPending,
  };
}
