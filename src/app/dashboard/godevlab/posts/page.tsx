"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, PlusCircle, Trash2 } from "lucide-react";
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
  createGoDevLabPost,
  deleteGoDevLabPost,
  getGoDevLabPosts,
} from "@/lib/supabase/godevlab-queries";

export default function GoDevLabPostsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: employee } = useCurrentEmployee();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  const { data: posts = [] } = useQuery({
    queryKey: ["godevlab-posts"],
    queryFn: () => getGoDevLabPosts(supabase),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      createGoDevLabPost(supabase, {
        url,
        title,
        description: description || undefined,
        created_by: employee!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["godevlab-posts"] });
      setTitle("");
      setUrl("");
      setDescription("");
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGoDevLabPost(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["godevlab-posts"] });
    },
  });

  const canSubmit = Boolean(title.trim() && url.trim() && employee);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Save product inspiration, release examples, and references for the
            GoDevLab team.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-brand-700 hover:bg-brand-800">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Post</DialogTitle>
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
                  placeholder="Post title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">URL</label>
                <Input
                  placeholder="https://..."
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Description{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <Textarea
                  placeholder="Why is this useful for the team?"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-brand-700 hover:bg-brand-800"
                disabled={!canSubmit || addMutation.isPending}
              >
                {addMutation.isPending ? "Adding..." : "Add Post"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {posts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No inspiration posts yet.
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const canDelete =
              employee?.role === "admin" || post.created_by === employee?.id;

            return (
              <Card key={post.id}>
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-brand-700"
                    >
                      {post.title}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                    {post.description && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {post.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-brand-700">
                        {post.employee?.full_name ?? "Unknown"}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(post.created_at), {
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
                      onClick={() => deleteMutation.mutate(post.id)}
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
