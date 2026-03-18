import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GoDevLabNote,
  GoDevLabPost,
  GoDevLabProject,
  GoDevLabProjectPriority,
  GoDevLabProjectStatus,
  GoDevLabProjectTask,
  GoDevLabProjectUpdate,
  GoDevLabTaskStatus,
  GoDevLabUpdateType,
} from "@/types";

export async function getGoDevLabPosts(
  supabase: SupabaseClient
): Promise<GoDevLabPost[]> {
  const { data, error } = await supabase
    .from("godevlab_posts")
    .select("*, employee:employees(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createGoDevLabPost(
  supabase: SupabaseClient,
  post: {
    url: string;
    title: string;
    description?: string;
    created_by: string;
  }
): Promise<GoDevLabPost> {
  const { data, error } = await supabase
    .from("godevlab_posts")
    .insert(post)
    .select("*, employee:employees(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGoDevLabPost(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("godevlab_posts")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getGoDevLabNotes(
  supabase: SupabaseClient
): Promise<GoDevLabNote[]> {
  const { data, error } = await supabase
    .from("godevlab_notes")
    .select("*, employee:employees(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createGoDevLabNote(
  supabase: SupabaseClient,
  note: {
    title: string;
    description: string;
    created_by: string;
  }
): Promise<GoDevLabNote> {
  const { data, error } = await supabase
    .from("godevlab_notes")
    .insert(note)
    .select("*, employee:employees(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGoDevLabNote(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("godevlab_notes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getGoDevLabProjects(
  supabase: SupabaseClient
): Promise<GoDevLabProject[]> {
  const { data, error } = await supabase
    .from("godevlab_projects")
    .select("*, employee:employees(*)")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createGoDevLabProject(
  supabase: SupabaseClient,
  project: {
    title: string;
    description?: string;
    status: GoDevLabProjectStatus;
    priority: GoDevLabProjectPriority;
    due_date?: string;
    created_by: string;
  }
): Promise<GoDevLabProject> {
  const payload = {
    ...project,
    due_date: project.due_date || null,
    description: project.description || null,
  };

  const { data, error } = await supabase
    .from("godevlab_projects")
    .insert(payload)
    .select("*, employee:employees(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function updateGoDevLabProject(
  supabase: SupabaseClient,
  projectId: string,
  updates: Partial<{
    title: string;
    description: string | null;
    status: GoDevLabProjectStatus;
    priority: GoDevLabProjectPriority;
    due_date: string | null;
  }>
): Promise<GoDevLabProject> {
  const { data, error } = await supabase
    .from("godevlab_projects")
    .update(updates)
    .eq("id", projectId)
    .select("*, employee:employees(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function getGoDevLabProjectTasks(
  supabase: SupabaseClient,
  projectId: string
): Promise<GoDevLabProjectTask[]> {
  const { data, error } = await supabase
    .from("godevlab_project_tasks")
    .select("*, employee:employees(*)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAllGoDevLabProjectTasks(
  supabase: SupabaseClient
): Promise<GoDevLabProjectTask[]> {
  const { data, error } = await supabase
    .from("godevlab_project_tasks")
    .select("*, employee:employees(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createGoDevLabProjectTask(
  supabase: SupabaseClient,
  task: {
    project_id: string;
    title: string;
    details?: string;
    status: GoDevLabTaskStatus;
    due_date?: string;
    created_by: string;
  }
): Promise<GoDevLabProjectTask> {
  const payload = {
    ...task,
    details: task.details || null,
    due_date: task.due_date || null,
  };

  const { data, error } = await supabase
    .from("godevlab_project_tasks")
    .insert(payload)
    .select("*, employee:employees(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function updateGoDevLabProjectTask(
  supabase: SupabaseClient,
  taskId: string,
  updates: Partial<{
    title: string;
    details: string | null;
    status: GoDevLabTaskStatus;
    due_date: string | null;
  }>
): Promise<GoDevLabProjectTask> {
  const { data, error } = await supabase
    .from("godevlab_project_tasks")
    .update(updates)
    .eq("id", taskId)
    .select("*, employee:employees(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGoDevLabProjectTask(
  supabase: SupabaseClient,
  taskId: string
): Promise<void> {
  const { error } = await supabase
    .from("godevlab_project_tasks")
    .delete()
    .eq("id", taskId);

  if (error) throw error;
}

export async function getGoDevLabProjectUpdates(
  supabase: SupabaseClient,
  projectId: string,
  limit?: number
): Promise<GoDevLabProjectUpdate[]> {
  let query = supabase
    .from("godevlab_project_updates")
    .select("*, employee:employees(*)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getRecentGoDevLabUpdates(
  supabase: SupabaseClient,
  limit: number = 6
): Promise<GoDevLabProjectUpdate[]> {
  const { data, error } = await supabase
    .from("godevlab_project_updates")
    .select("*, employee:employees(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function createGoDevLabProjectUpdate(
  supabase: SupabaseClient,
  update: {
    project_id: string;
    title: string;
    details: string;
    update_type: GoDevLabUpdateType;
    created_by: string;
  }
): Promise<GoDevLabProjectUpdate> {
  const { data, error } = await supabase
    .from("godevlab_project_updates")
    .insert(update)
    .select("*, employee:employees(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGoDevLabProjectUpdate(
  supabase: SupabaseClient,
  updateId: string
): Promise<void> {
  const { error } = await supabase
    .from("godevlab_project_updates")
    .delete()
    .eq("id", updateId);

  if (error) throw error;
}
