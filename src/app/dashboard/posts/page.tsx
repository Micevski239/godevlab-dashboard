"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getPosts, createPost, deletePost } from "@/lib/supabase/queries";
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
import { PlusCircle, ExternalLink, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function PostsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  const { data: posts = [] } = useQuery({
    queryKey: ["posts"],
    queryFn: () => getPosts(supabase),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      createPost(supabase, {
        url,
        title,
        description: description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setTitle("");
      setUrl("");
      setDescription("");
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePost(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const canSubmit = title.trim() && url.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-brand-700 hover:bg-brand-800">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Post</DialogTitle>
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
                  placeholder="Post title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">URL</label>
                <Input
                  placeholder="https://..."
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </label>
                <Textarea
                  placeholder="Brief description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
        <p className="text-sm text-muted-foreground text-center py-8">
          No posts yet. Add one to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:text-brand-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    {post.title}
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                  {post.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {post.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-red-600"
                  onClick={() => deleteMutation.mutate(post.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
