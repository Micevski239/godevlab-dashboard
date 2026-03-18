import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GoGevgelijaUpdateDraft,
  GoGevgelijaUpdateHighlight,
  GoGevgelijaUpdateIdea,
  GoGevgelijaUpdateIdeaLane,
  GoGevgelijaUpdatePhoto,
} from "@/types";

export const GOGEVGELIJA_UPDATE_BUCKET = "gogevgelija-update-photos";

const updateSelect = `
  *,
  employee:employees(*)
`;

async function loadGoGevgelijaUpdateCollections(
  supabase: SupabaseClient,
  updateId: string
) {
  const [photosResult, highlightsResult, ideasResult] = await Promise.all([
    supabase
      .from("gogevgelija_update_photos")
      .select("*")
      .eq("update_id", updateId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("gogevgelija_update_highlights")
      .select("*")
      .eq("update_id", updateId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("gogevgelija_update_ideas")
      .select("*")
      .eq("update_id", updateId)
      .order("sort_order", { ascending: true }),
  ]);

  if (photosResult.error) throw photosResult.error;
  if (highlightsResult.error) throw highlightsResult.error;
  if (ideasResult.error) throw ideasResult.error;

  return {
    photos: photosResult.data || [],
    highlights: highlightsResult.data || [],
    ideas: ideasResult.data || [],
  };
}

async function hydrateDraftCollections(
  supabase: SupabaseClient,
  draft: GoGevgelijaUpdateDraft | null
) {
  if (!draft) {
    return null;
  }

  const collections = await loadGoGevgelijaUpdateCollections(supabase, draft.id);

  return {
    ...draft,
    photos: collections.photos,
    highlights: collections.highlights,
    ideas: collections.ideas,
  };
}

export async function getLatestGoGevgelijaUpdate(
  supabase: SupabaseClient
): Promise<GoGevgelijaUpdateDraft | null> {
  const { data, error } = await supabase
    .from("gogevgelija_updates")
    .select(updateSelect)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return hydrateDraftCollections(supabase, data);
}

export async function createGoGevgelijaUpdate(
  supabase: SupabaseClient,
  update: {
    name: string;
    version?: string | null;
    target_date?: string | null;
    summary?: string | null;
    created_by: string;
  }
): Promise<GoGevgelijaUpdateDraft> {
  const { data, error } = await supabase
    .from("gogevgelija_updates")
    .insert(update)
    .select(updateSelect)
    .single();

  if (error) throw error;
  return (await hydrateDraftCollections(supabase, data))!;
}

export async function updateGoGevgelijaUpdate(
  supabase: SupabaseClient,
  updateId: string,
  updates: {
    name: string;
    version?: string | null;
    target_date?: string | null;
    summary?: string | null;
  }
): Promise<GoGevgelijaUpdateDraft> {
  const { data, error } = await supabase
    .from("gogevgelija_updates")
    .update(updates)
    .eq("id", updateId)
    .select(updateSelect)
    .single();

  if (error) throw error;
  return (await hydrateDraftCollections(supabase, data))!;
}

export async function replaceGoGevgelijaUpdateHighlights(
  supabase: SupabaseClient,
  updateId: string,
  highlights: Array<{
    title: string;
    details: string;
    sort_order: number;
  }>
): Promise<GoGevgelijaUpdateHighlight[]> {
  const deleteResult = await supabase
    .from("gogevgelija_update_highlights")
    .delete()
    .eq("update_id", updateId);

  if (deleteResult.error) throw deleteResult.error;

  if (highlights.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("gogevgelija_update_highlights")
    .insert(
      highlights.map((highlight) => ({
        ...highlight,
        update_id: updateId,
      }))
    )
    .select("*");

  if (error) throw error;
  return data || [];
}

export async function replaceGoGevgelijaUpdateIdeas(
  supabase: SupabaseClient,
  updateId: string,
  ideas: Array<{
    lane: GoGevgelijaUpdateIdeaLane;
    title: string;
    details: string;
    sort_order: number;
  }>
): Promise<GoGevgelijaUpdateIdea[]> {
  const deleteResult = await supabase
    .from("gogevgelija_update_ideas")
    .delete()
    .eq("update_id", updateId);

  if (deleteResult.error) throw deleteResult.error;

  if (ideas.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("gogevgelija_update_ideas")
    .insert(
      ideas.map((idea) => ({
        ...idea,
        update_id: updateId,
      }))
    )
    .select("*");

  if (error) throw error;
  return data || [];
}

export async function deleteGoGevgelijaUpdatePhotos(
  supabase: SupabaseClient,
  photoIds: string[]
): Promise<void> {
  if (photoIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("gogevgelija_update_photos")
    .delete()
    .in("id", photoIds);

  if (error) throw error;
}

export async function upsertGoGevgelijaUpdatePhotos(
  supabase: SupabaseClient,
  photos: Array<{
    id: string;
    update_id: string;
    storage_path: string;
    public_url: string;
    file_name: string;
    file_size: number | null;
    sort_order: number;
  }>
): Promise<GoGevgelijaUpdatePhoto[]> {
  if (photos.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("gogevgelija_update_photos")
    .upsert(photos)
    .select("*");

  if (error) throw error;
  return data || [];
}
