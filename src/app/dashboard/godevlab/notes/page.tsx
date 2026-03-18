"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { PlusCircle, Trash2 } from "lucide-react";
import { useCurrentEmployee } from "@/hooks/use-employee";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import {
  createGoDevLabNote,
  deleteGoDevLabNote,
  getGoDevLabNotes,
} from "@/lib/supabase/godevlab-queries";

export default function GoDevLabNotesPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: employee } = useCurrentEmployee();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: notes = [] } = useQuery({
    queryKey: ["godevlab-notes"],
    queryFn: () => getGoDevLabNotes(supabase),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      createGoDevLabNote(supabase, {
        title,
        description,
        created_by: employee!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["godevlab-notes"] });
      setTitle("");
      setDescription("");
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGoDevLabNote(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["godevlab-notes"] });
    },
  });

  const canSubmit = Boolean(title.trim() && description.trim() && employee);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Capture observations, research snippets, and product ideas for
            GoDevLab.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-brand-700 hover:bg-brand-800">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (canSubmit) {
                  addMutation.mutate();
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium">Title</label>
                <Input
                  placeholder="Note title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Description
                </label>
                <Textarea
                  placeholder="Write your note..."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-brand-700 hover:bg-brand-800"
                disabled={!canSubmit || addMutation.isPending}
              >
                {addMutation.isPending ? "Adding..." : "Add Note"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No notes yet.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const canDelete =
              employee?.role === "admin" || note.created_by === employee?.id;

            return (
              <Card key={note.id}>
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {note.title}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {note.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-brand-700">
                        {note.employee?.full_name ?? "Unknown"}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(note.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-red-600"
                      onClick={() => deleteMutation.mutate(note.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
