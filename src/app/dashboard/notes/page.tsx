"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getNotes, createNote, deleteNote } from "@/lib/supabase/queries";
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
import { PlusCircle, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function NotesPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: employee } = useCurrentEmployee();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: notes = [] } = useQuery({
    queryKey: ["notes"],
    queryFn: () => getNotes(supabase),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      createNote(supabase, {
        title,
        description,
        created_by: employee!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setTitle("");
      setDescription("");
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNote(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const canSubmit = title.trim() && description.trim() && employee;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-brand-700 hover:bg-brand-800">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) addMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Title
                </label>
                <Input
                  placeholder="Note title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Description
                </label>
                <Textarea
                  placeholder="Write your note..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
        <p className="text-sm text-muted-foreground text-center py-8">
          No notes yet. Add one to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const canDelete =
              employee?.role === "admin" || note.created_by === employee?.id;

            return (
              <Card key={note.id}>
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {note.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {note.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium text-brand-700">
                        {note.employee?.full_name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
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
                      <Trash2 className="w-4 h-4" />
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
