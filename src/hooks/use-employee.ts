"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Employee } from "@/types";

export function useCurrentEmployee() {
  const supabase = createClient();

  return useQuery<Employee | null>({
    queryKey: ["current-employee"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("employees")
        .select("*")
        .eq("id", user.id)
        .single();

      return data;
    },
  });
}
