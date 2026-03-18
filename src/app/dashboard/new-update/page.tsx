"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  CalendarDays,
  FileImage,
  Lightbulb,
  Loader2,
  PlusCircle,
  Rocket,
  Save,
  StickyNote,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCurrentEmployee } from "@/hooks/use-employee";
import {
  GOGEVGELIJA_UPDATE_BUCKET,
  createGoGevgelijaUpdate,
  deleteGoGevgelijaUpdatePhotos,
  getLatestGoGevgelijaUpdate,
  replaceGoGevgelijaUpdateHighlights,
  replaceGoGevgelijaUpdateIdeas,
  updateGoGevgelijaUpdate,
  upsertGoGevgelijaUpdatePhotos,
} from "@/lib/supabase/gogevgelija-update-queries";
import { createClient } from "@/lib/supabase/client";
import type { GoGevgelijaUpdateIdeaLane } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type PhotoItem = {
  id: string;
  preview: string;
  name: string;
  size: number | null;
  file?: File;
  recordId?: string;
  storagePath?: string;
  publicUrl?: string;
};

type HighlightNote = {
  id: string;
  title: string;
  details: string;
};

type IdeaCard = {
  id: string;
  lane: GoGevgelijaUpdateIdeaLane;
  title: string;
  details: string;
};

const initialHighlights: HighlightNote[] = [];

const initialIdeas: IdeaCard[] = [];

const laneMeta: Record<
  GoGevgelijaUpdateIdeaLane,
  { badge: string; title: string; description: string; accent: string }
> = {
  "next-patch": {
    badge: "Soon",
    title: "Next Patch",
    description: "Small improvements that can land quickly.",
    accent: "border-emerald-200 bg-emerald-50/70 text-emerald-700",
  },
  "minor-release": {
    badge: "Planned",
    title: "Minor Release",
    description: "Bigger feature work for the next scheduled update.",
    accent: "border-sky-200 bg-sky-50/70 text-sky-700",
  },
  "future-lab": {
    badge: "Explore",
    title: "Future Lab",
    description: "Longer-horizon ideas worth keeping visible.",
    accent: "border-amber-200 bg-amber-50/70 text-amber-700",
  },
};

function sanitizeFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  const hasExtension = dotIndex > 0;
  const baseName = hasExtension ? fileName.slice(0, dotIndex) : fileName;
  const extension = hasExtension ? fileName.slice(dotIndex).toLowerCase() : "";

  const safeBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${safeBase || "update-photo"}${extension}`;
}

export default function NewUpdatePage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: employee } = useCurrentEmployee();

  const [currentUpdateId, setCurrentUpdateId] = useState<string | null>(null);
  const [releaseName, setReleaseName] = useState("Dashboard Refresh");
  const [releaseVersion, setReleaseVersion] = useState("v2.4");
  const [releaseDate, setReleaseDate] = useState("");
  const [releaseSummary, setReleaseSummary] = useState(
    "Plan the next dashboard update, gather the supporting visuals, and keep the release notes organized in one place."
  );
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [highlights, setHighlights] = useState(initialHighlights);
  const [ideas, setIdeas] = useState(initialIdeas);

  const uploadRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const nextPhotoId = useRef(1);
  const nextHighlightId = useRef(1);
  const nextIdeaId = useRef(1);

  const canSave = employee?.role === "admin" || employee?.role === "editor";

  const {
    data: savedDraft,
    isLoading: isDraftLoading,
    error: draftError,
  } = useQuery({
    queryKey: ["gogevgelija-update-draft"],
    queryFn: () => getLatestGoGevgelijaUpdate(supabase),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    previewUrlsRef.current = photos
      .filter((photo) => photo.preview.startsWith("blob:"))
      .map((photo) => photo.preview);
  }, [photos]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (!savedDraft) {
      return;
    }

    setCurrentUpdateId(savedDraft.id);
    setReleaseName(savedDraft.name);
    setReleaseVersion(savedDraft.version ?? "");
    setReleaseDate(savedDraft.target_date ?? "");
    setReleaseSummary(savedDraft.summary ?? "");
    setPhotos(
      (savedDraft.photos ?? []).map((photo) => ({
        id: `photo-${photo.id}`,
        preview: photo.public_url,
        name: photo.file_name,
        size: photo.file_size,
        recordId: photo.id,
        storagePath: photo.storage_path,
        publicUrl: photo.public_url,
      }))
    );
    setHighlights(
      (savedDraft.highlights ?? []).length > 0
        ? (savedDraft.highlights ?? []).map((highlight) => ({
            id: `highlight-${highlight.id}`,
            title: highlight.title,
            details: highlight.details,
          }))
        : []
    );
    setIdeas(
      (savedDraft.ideas ?? []).length > 0
        ? (savedDraft.ideas ?? []).map((idea) => ({
            id: `idea-${idea.id}`,
            lane: idea.lane,
            title: idea.title,
            details: idea.details,
          }))
        : []
    );
    nextPhotoId.current = (savedDraft.photos?.length ?? 0) + 1;
    nextHighlightId.current = (savedDraft.highlights?.length ?? 0) + 1;
    nextIdeaId.current = (savedDraft.ideas?.length ?? 0) + 1;
  }, [savedDraft]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!employee || !canSave) {
        throw new Error("Only admins and editors can save this update.");
      }

      let draft =
        currentUpdateId !== null
          ? await updateGoGevgelijaUpdate(supabase, currentUpdateId, {
              name: releaseName.trim() || "Untitled Update",
              version: releaseVersion.trim() || null,
              target_date: releaseDate || null,
              summary: releaseSummary.trim() || null,
            })
          : await createGoGevgelijaUpdate(supabase, {
              name: releaseName.trim() || "Untitled Update",
              version: releaseVersion.trim() || null,
              target_date: releaseDate || null,
              summary: releaseSummary.trim() || null,
              created_by: employee.id,
            });

      const uploadedStoragePaths: string[] = [];
      let photosPersisted = false;

      try {
        const uploadedPhotoMap = new Map<
          string,
          {
            id: string;
            update_id: string;
            storage_path: string;
            public_url: string;
            file_name: string;
            file_size: number | null;
            sort_order: number;
          }
        >();

        for (const photo of photos) {
          if (!photo.file) {
            continue;
          }

          const filePath = `${draft.id}/${crypto.randomUUID()}-${sanitizeFileName(photo.name)}`;
          const uploadResult = await supabase.storage
            .from(GOGEVGELIJA_UPDATE_BUCKET)
            .upload(filePath, photo.file, {
              upsert: false,
            });

          if (uploadResult.error) {
            throw uploadResult.error;
          }

          uploadedStoragePaths.push(filePath);

          const { data: publicUrlData } = supabase.storage
            .from(GOGEVGELIJA_UPDATE_BUCKET)
            .getPublicUrl(filePath);

          uploadedPhotoMap.set(photo.id, {
            id: crypto.randomUUID(),
            update_id: draft.id,
            storage_path: filePath,
            public_url: publicUrlData.publicUrl,
            file_name: photo.name,
            file_size: photo.size,
            sort_order: 0,
          });
        }

        await replaceGoGevgelijaUpdateHighlights(
          supabase,
          draft.id,
          highlights.map((highlight, index) => ({
            title: highlight.title.trim() || "Untitled note",
            details: highlight.details.trim(),
            sort_order: index,
          }))
        );

        await replaceGoGevgelijaUpdateIdeas(
          supabase,
          draft.id,
          ideas.map((idea, index) => ({
            lane: idea.lane,
            title: idea.title.trim() || "Untitled idea",
            details: idea.details.trim(),
            sort_order: index,
          }))
        );

        const photoRows = photos.map((photo, index) => {
          if (photo.recordId && photo.storagePath && photo.publicUrl) {
            return {
              id: photo.recordId,
              update_id: draft.id,
              storage_path: photo.storagePath,
              public_url: photo.publicUrl,
              file_name: photo.name,
              file_size: photo.size,
              sort_order: index,
            };
          }

          const uploadedPhoto = uploadedPhotoMap.get(photo.id);

          if (!uploadedPhoto) {
            throw new Error(`Missing uploaded file metadata for ${photo.name}.`);
          }

          return {
            ...uploadedPhoto,
            sort_order: index,
          };
        });

        if (photoRows.length > 0) {
          await upsertGoGevgelijaUpdatePhotos(supabase, photoRows);
        }
        photosPersisted = true;

        const currentPhotoRecordIds = new Set(
          photos
            .filter((photo) => photo.recordId)
            .map((photo) => photo.recordId as string)
        );
        const removedPhotos = (savedDraft?.photos ?? []).filter(
          (photo) => !currentPhotoRecordIds.has(photo.id)
        );

        if (removedPhotos.length > 0) {
          await deleteGoGevgelijaUpdatePhotos(
            supabase,
            removedPhotos.map((photo) => photo.id)
          );

          const removedStoragePaths = removedPhotos.map(
            (photo) => photo.storage_path
          );
          const removeResult = await supabase.storage
            .from(GOGEVGELIJA_UPDATE_BUCKET)
            .remove(removedStoragePaths);

          if (removeResult.error) {
            throw removeResult.error;
          }
        }

        setCurrentUpdateId(draft.id);
        return draft.id;
      } catch (error) {
        if (!photosPersisted && uploadedStoragePaths.length > 0) {
          await supabase.storage
            .from(GOGEVGELIJA_UPDATE_BUCKET)
            .remove(uploadedStoragePaths);
        }

        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["gogevgelija-update-draft"],
      });
    },
  });

  const addPhotos = (files: FileList | null) => {
    if (!files) {
      return;
    }

    const nextItems = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `photo-local-${nextPhotoId.current++}`,
        preview: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        file,
      }));

    if (nextItems.length > 0) {
      setPhotos((current) => [...current, ...nextItems]);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target && target.preview.startsWith("blob:")) {
        URL.revokeObjectURL(target.preview);
      }
      return current.filter((photo) => photo.id !== id);
    });
  };

  const addHighlight = () => {
    const id = `highlight-local-${nextHighlightId.current++}`;
    setHighlights((current) => [
      ...current,
      {
        id,
        title: "New improvement",
        details: "Describe what changed in this update.",
      },
    ]);
  };

  const updateHighlight = (
    id: string,
    field: keyof Omit<HighlightNote, "id">,
    value: string
  ) => {
    setHighlights((current) =>
      current.map((note) =>
        note.id === id ? { ...note, [field]: value } : note
      )
    );
  };

  const removeHighlight = (id: string) => {
    setHighlights((current) => current.filter((note) => note.id !== id));
  };

  const addIdea = (lane: GoGevgelijaUpdateIdeaLane) => {
    const id = `idea-local-${nextIdeaId.current++}`;
    setIdeas((current) => [
      ...current,
      {
        id,
        lane,
        title: "New idea",
        details: "Capture the next concept for a future release.",
      },
    ]);
  };

  const updateIdea = (
    id: string,
    field: keyof Omit<IdeaCard, "id" | "lane">,
    value: string
  ) => {
    setIdeas((current) =>
      current.map((idea) =>
        idea.id === id ? { ...idea, [field]: value } : idea
      )
    );
  };

  const removeIdea = (id: string) => {
    setIdeas((current) => current.filter((idea) => idea.id !== id));
  };

  const handlePhotoInput = (event: ChangeEvent<HTMLInputElement>) => {
    addPhotos(event.target.files);
    event.target.value = "";
  };

  const totalIdeas = ideas.length;
  const lastSavedLabel = savedDraft?.updated_at
    ? formatDistanceToNow(new Date(savedDraft.updated_at), {
        addSuffix: true,
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <Badge className="bg-brand-700 text-white hover:bg-brand-700">
            Software Update Planner
          </Badge>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              New Update
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Prepare the next release with photo uploads, square release notes,
              and a simple ideas board for future improvements.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 xl:items-end">
          <div className="grid grid-cols-3 gap-3 sm:w-auto">
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Photos
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {photos.length}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                What&apos;s New
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {highlights.length}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Ideas
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {totalIdeas}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 xl:items-end">
            {isDraftLoading ? (
              <p className="text-xs text-muted-foreground">
                Loading saved draft...
              </p>
            ) : lastSavedLabel ? (
              <p className="text-xs text-muted-foreground">
                Last saved {lastSavedLabel}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No saved draft yet.
              </p>
            )}
            {!canSave && (
              <p className="text-xs text-amber-700">
                Only editors and admins can save this planner.
              </p>
            )}
            {draftError && (
              <p className="text-xs text-red-600">
                Failed to load the saved draft.
              </p>
            )}
            <Button
              type="button"
              onClick={() => saveMutation.mutate()}
              className="bg-brand-700 hover:bg-brand-800"
              disabled={saveMutation.isPending || !canSave}
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saveMutation.isPending ? "Saving..." : "Save Update"}
            </Button>
            {saveMutation.error && (
              <p className="max-w-sm text-xs text-red-600">
                {saveMutation.error instanceof Error
                  ? saveMutation.error.message
                  : "Failed to save the update."}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm text-brand-700">
              <Rocket className="h-4 w-4" />
              Release Overview
            </div>
            <CardTitle className="text-xl">Shape the update before shipping</CardTitle>
            <CardDescription>
              Keep the release title, timing, and short summary together.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Update name
                </label>
                <Input
                  value={releaseName}
                  onChange={(event) => setReleaseName(event.target.value)}
                  placeholder="Summer dashboard refresh"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Version
                </label>
                <Input
                  value={releaseVersion}
                  onChange={(event) => setReleaseVersion(event.target.value)}
                  placeholder="v3.0"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Release summary
                </label>
                <Textarea
                  value={releaseSummary}
                  onChange={(event) => setReleaseSummary(event.target.value)}
                  rows={6}
                  placeholder="Summarize the purpose of this release."
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <CalendarDays className="h-4 w-4 text-brand-700" />
                  Target date
                </label>
                <Input
                  type="date"
                  value={releaseDate}
                  onChange={(event) => setReleaseDate(event.target.value)}
                  className="w-full min-w-40"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm text-brand-700">
              <FileImage className="h-4 w-4" />
              Update Photos
            </div>
            <CardTitle className="text-xl">Upload visuals for the new update</CardTitle>
            <CardDescription>
              Add screenshots, banners, or teaser images for the release.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                addPhotos(event.dataTransfer.files);
              }}
              className={`flex min-h-52 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                dragActive
                  ? "border-brand-700 bg-brand-50"
                  : "border-gray-300 bg-gradient-to-br from-white to-gray-50 hover:border-brand-400"
              }`}
            >
              <div className="rounded-full bg-white p-3 shadow-sm">
                <Upload className="h-6 w-6 text-brand-700" />
              </div>
              <p className="mt-4 text-base font-semibold text-gray-900">
                Drop photos here or click to browse
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Use this space for app screenshots, feature images, or any
                visual asset that should ship with the update.
              </p>
            </button>

            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoInput}
              className="hidden"
            />

            {photos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-muted-foreground">
                No photos uploaded yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <Image
                        src={photo.preview}
                        alt={photo.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-gray-600 shadow-sm transition-colors hover:bg-white hover:text-red-600"
                        aria-label={`Remove ${photo.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="px-4 py-3">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {photo.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {photo.size !== null
                          ? `${(photo.size / (1024 * 1024)).toFixed(2)} MB`
                          : "Saved image"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-brand-700">
              <StickyNote className="h-4 w-4" />
              What&apos;s New
            </div>
            <h2 className="mt-1 text-2xl font-semibold text-gray-900">
              Square notes for the release highlights
            </h2>
          </div>
          <Button
            type="button"
            onClick={addHighlight}
            className="bg-brand-700 hover:bg-brand-800"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add note
          </Button>
        </div>

        {highlights.length === 0 ? (
          <Card className="border-dashed border-amber-200 bg-amber-50/40 shadow-sm">
            <CardContent className="flex min-h-56 flex-col items-center justify-center p-6 text-center">
              <p className="text-base font-semibold text-gray-900">
                No saved highlights yet
              </p>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Add the real `What&apos;s New` items for this release and save
                them to the database.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {highlights.map((highlight, index) => (
              <Card
                key={highlight.id}
                className="aspect-square border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-sm"
              >
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Badge
                      variant="outline"
                      className="border-amber-300 bg-white/80 text-amber-700"
                    >
                      Note {index + 1}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHighlight(highlight.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Input
                    value={highlight.title}
                    onChange={(event) =>
                      updateHighlight(highlight.id, "title", event.target.value)
                    }
                    className="mt-4 border-amber-200 bg-white/80 text-base font-semibold"
                    placeholder="Highlight title"
                  />
                  <Textarea
                    value={highlight.details}
                    onChange={(event) =>
                      updateHighlight(highlight.id, "details", event.target.value)
                    }
                    className="mt-3 flex-1 resize-none border-amber-200 bg-white/80"
                    placeholder="Describe what is new in this update."
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-brand-700">
            <Lightbulb className="h-4 w-4" />
            Ideas Board
          </div>
          <h2 className="mt-1 text-2xl font-semibold text-gray-900">
            Keep future update ideas visible
          </h2>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {(Object.keys(laneMeta) as GoGevgelijaUpdateIdeaLane[]).map(
            (lane) => {
              const laneIdeas = ideas.filter((idea) => idea.lane === lane);
              const meta = laneMeta[lane];

              return (
                <Card key={lane} className="border-gray-200 shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline" className={meta.accent}>
                        {meta.badge}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addIdea(lane)}
                        className="text-brand-700 hover:text-brand-800"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add idea
                      </Button>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{meta.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {meta.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {laneIdeas.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-4 text-sm text-muted-foreground">
                        No saved ideas in this lane yet.
                      </div>
                    ) : (
                      laneIdeas.map((idea) => (
                        <div
                          key={idea.id}
                          className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <Input
                              value={idea.title}
                              onChange={(event) =>
                                updateIdea(idea.id, "title", event.target.value)
                              }
                              placeholder="Idea title"
                              className="bg-white"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeIdea(idea.id)}
                              className="h-10 w-10 shrink-0 text-muted-foreground hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={idea.details}
                            onChange={(event) =>
                              updateIdea(idea.id, "details", event.target.value)
                            }
                            rows={4}
                            placeholder="Describe the idea and why it matters."
                            className="mt-3 resize-none bg-white"
                          />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>
      </section>
    </div>
  );
}
