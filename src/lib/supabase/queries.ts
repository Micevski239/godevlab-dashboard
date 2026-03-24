import type { SupabaseClient } from "@supabase/supabase-js";
import type { Employee, TimeEntry, Post, Note } from "@/types";
import { startOfDay, endOfDay } from "date-fns";
import type { DashboardWorkspace } from "@/lib/workspaces";

export async function getEmployees(
  supabase: SupabaseClient
): Promise<Employee[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("is_active", true)
    .order("full_name");

  if (error) throw error;
  return data || [];
}

export async function getEmployee(
  supabase: SupabaseClient,
  id: string
): Promise<Employee | null> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getTodayTimeEntries(
  supabase: SupabaseClient,
  workspace: DashboardWorkspace
): Promise<TimeEntry[]> {
  const today = new Date();
  const { data, error } = await supabase
    .from("time_entries")
    .select("*, employee:employees(*)")
    .eq("workspace", workspace)
    .gte("clock_in", startOfDay(today).toISOString())
    .lte("clock_in", endOfDay(today).toISOString())
    .order("clock_in", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getActiveTimeEntry(
  supabase: SupabaseClient,
  employeeId: string,
  workspace: DashboardWorkspace
): Promise<TimeEntry | null> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("workspace", workspace)
    .is("clock_out", null)
    .order("clock_in", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function clockIn(
  supabase: SupabaseClient,
  employeeId: string,
  workspace: DashboardWorkspace
): Promise<TimeEntry> {
  const { data, error } = await supabase
    .from("time_entries")
    .insert({ employee_id: employeeId, workspace })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function clockOut(
  supabase: SupabaseClient,
  entryId: string,
  workspace: DashboardWorkspace,
  notes?: string
): Promise<TimeEntry> {
  const { data, error } = await supabase
    .from("time_entries")
    .update({ clock_out: new Date().toISOString(), notes: notes || null })
    .eq("id", entryId)
    .eq("workspace", workspace)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTimeEntriesForEmployee(
  supabase: SupabaseClient,
  employeeId: string,
  workspace: DashboardWorkspace,
  from: Date,
  to: Date
): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("workspace", workspace)
    .gte("clock_in", from.toISOString())
    .lte("clock_in", to.toISOString())
    .order("clock_in", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAllTimeEntriesForEmployee(
  supabase: SupabaseClient,
  employeeId: string,
  workspace: DashboardWorkspace
): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("workspace", workspace)
    .order("clock_in", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getRecentTimeEntries(
  supabase: SupabaseClient,
  workspace: DashboardWorkspace,
  limit: number = 5
): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*, employee:employees(*)")
    .eq("workspace", workspace)
    .order("clock_in", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============================================
// Posts
// ============================================

export async function getPosts(supabase: SupabaseClient): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createPost(
  supabase: SupabaseClient,
  post: { url: string; title: string; description?: string }
): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .insert(post)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

// ============================================
// Notes
// ============================================

export async function getNotes(supabase: SupabaseClient): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*, employee:employees(id, full_name, role)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createNote(
  supabase: SupabaseClient,
  note: { title: string; description: string; created_by: string }
): Promise<Note> {
  const { data, error } = await supabase
    .from("notes")
    .insert(note)
    .select("*, employee:employees(id, full_name, role)")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteNote(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}
