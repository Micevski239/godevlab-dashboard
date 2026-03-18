"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  CalendarDays,
  CheckSquare2,
  FolderKanban,
  ListTodo,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useCurrentEmployee } from "@/hooks/use-employee";
import { createClient } from "@/lib/supabase/client";
import {
  createGoDevLabProject,
  createGoDevLabProjectTask,
  createGoDevLabProjectUpdate,
  deleteGoDevLabProjectTask,
  deleteGoDevLabProjectUpdate,
  getAllGoDevLabProjectTasks,
  getGoDevLabProjectUpdates,
  getGoDevLabProjects,
  updateGoDevLabProject,
  updateGoDevLabProjectTask,
} from "@/lib/supabase/godevlab-queries";
import type {
  GoDevLabProjectPriority,
  GoDevLabProjectStatus,
  GoDevLabTaskStatus,
  GoDevLabUpdateType,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const projectStatusOptions: GoDevLabProjectStatus[] = [
  "backlog",
  "active",
  "review",
  "completed",
];

const priorityOptions: GoDevLabProjectPriority[] = ["low", "medium", "high"];

const taskStatusOptions: GoDevLabTaskStatus[] = [
  "todo",
  "in_progress",
  "done",
];

const updateTypeOptions: GoDevLabUpdateType[] = [
  "progress",
  "note",
  "blocker",
  "decision",
];

const statusStyles: Record<GoDevLabProjectStatus, string> = {
  backlog: "border-gray-200 bg-gray-100 text-gray-700",
  active: "border-sky-200 bg-sky-100 text-sky-700",
  review: "border-amber-200 bg-amber-100 text-amber-700",
  completed: "border-emerald-200 bg-emerald-100 text-emerald-700",
};

const taskStyles: Record<GoDevLabTaskStatus, string> = {
  todo: "border-gray-200 bg-gray-100 text-gray-700",
  in_progress: "border-blue-200 bg-blue-100 text-blue-700",
  done: "border-emerald-200 bg-emerald-100 text-emerald-700",
};

const updateStyles: Record<GoDevLabUpdateType, string> = {
  progress: "border-sky-200 bg-sky-100 text-sky-700",
  note: "border-gray-200 bg-gray-100 text-gray-700",
  blocker: "border-red-200 bg-red-100 text-red-700",
  decision: "border-violet-200 bg-violet-100 text-violet-700",
};

export default function GoDevLabProjectsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: employee } = useCurrentEmployee();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectStatus, setProjectStatus] =
    useState<GoDevLabProjectStatus>("active");
  const [projectPriority, setProjectPriority] =
    useState<GoDevLabProjectPriority>("medium");
  const [projectDueDate, setProjectDueDate] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDetails, setTaskDetails] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const [updateTitle, setUpdateTitle] = useState("");
  const [updateDetails, setUpdateDetails] = useState("");
  const [updateType, setUpdateType] =
    useState<GoDevLabUpdateType>("progress");

  const { data: projects = [] } = useQuery({
    queryKey: ["godevlab-projects"],
    queryFn: () => getGoDevLabProjects(supabase),
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["godevlab-project-tasks"],
    queryFn: () => getAllGoDevLabProjectTasks(supabase),
  });

  const { data: projectUpdates = [] } = useQuery({
    queryKey: ["godevlab-project-updates", selectedProjectId],
    queryFn: () => getGoDevLabProjectUpdates(supabase, selectedProjectId!),
    enabled: Boolean(selectedProjectId),
  });

  useEffect(() => {
    if (projects.length === 0) {
      setSelectedProjectId(null);
      return;
    }

    const projectStillExists = projects.some(
      (project) => project.id === selectedProjectId
    );

    if (!selectedProjectId || !projectStillExists) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const selectedTasks = useMemo(
    () => allTasks.filter((task) => task.project_id === selectedProjectId),
    [allTasks, selectedProjectId]
  );

  const projectTaskStats = useMemo(() => {
    const total = selectedTasks.length;
    const done = selectedTasks.filter((task) => task.status === "done").length;
    const inProgress = selectedTasks.filter(
      (task) => task.status === "in_progress"
    ).length;

    return {
      total,
      done,
      inProgress,
      todo: selectedTasks.filter((task) => task.status === "todo").length,
      completion: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  }, [selectedTasks]);

  const createProjectMutation = useMutation({
    mutationFn: () =>
      createGoDevLabProject(supabase, {
        title: projectTitle,
        description: projectDescription || undefined,
        status: projectStatus,
        priority: projectPriority,
        due_date: projectDueDate || undefined,
        created_by: employee!.id,
      }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["godevlab-projects"] });
      setSelectedProjectId(project.id);
      setProjectTitle("");
      setProjectDescription("");
      setProjectStatus("active");
      setProjectPriority("medium");
      setProjectDueDate("");
      setProjectDialogOpen(false);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({
      projectId,
      status,
      priority,
      dueDate,
    }: {
      projectId: string;
      status?: GoDevLabProjectStatus;
      priority?: GoDevLabProjectPriority;
      dueDate?: string | null;
    }) =>
      updateGoDevLabProject(supabase, projectId, {
        status,
        priority,
        due_date: dueDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["godevlab-projects"] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: () =>
      createGoDevLabProjectTask(supabase, {
        project_id: selectedProjectId!,
        title: taskTitle,
        details: taskDetails || undefined,
        due_date: taskDueDate || undefined,
        status: "todo",
        created_by: employee!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["godevlab-project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["godevlab-projects"] });
      setTaskTitle("");
      setTaskDetails("");
      setTaskDueDate("");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string;
      status: GoDevLabTaskStatus;
    }) =>
      updateGoDevLabProjectTask(supabase, taskId, {
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["godevlab-project-tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => deleteGoDevLabProjectTask(supabase, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["godevlab-project-tasks"] });
    },
  });

  const createUpdateMutation = useMutation({
    mutationFn: () =>
      createGoDevLabProjectUpdate(supabase, {
        project_id: selectedProjectId!,
        title: updateTitle,
        details: updateDetails,
        update_type: updateType,
        created_by: employee!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["godevlab-project-updates", selectedProjectId],
      });
      queryClient.invalidateQueries({ queryKey: ["godevlab-recent-updates"] });
      setUpdateTitle("");
      setUpdateDetails("");
      setUpdateType("progress");
    },
  });

  const deleteUpdateMutation = useMutation({
    mutationFn: (updateId: string) =>
      deleteGoDevLabProjectUpdate(supabase, updateId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["godevlab-project-updates", selectedProjectId],
      });
      queryClient.invalidateQueries({ queryKey: ["godevlab-recent-updates"] });
    },
  });

  const canCreateProject = Boolean(projectTitle.trim() && employee);
  const canCreateTask = Boolean(selectedProjectId && taskTitle.trim() && employee);
  const canCreateUpdate = Boolean(
    selectedProjectId && updateTitle.trim() && updateDetails.trim() && employee
  );
  const canManageSelectedProject = Boolean(
    selectedProject &&
      employee &&
      (employee.role === "admin" || selectedProject.created_by === employee.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create projects, break them into tasks, and log progress as the
            team moves.
          </p>
        </div>
        <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-700 hover:bg-brand-800">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (canCreateProject) {
                  createProjectMutation.mutate();
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium">Title</label>
                <Input
                  value={projectTitle}
                  onChange={(event) => setProjectTitle(event.target.value)}
                  placeholder="Website redesign sprint"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Description
                </label>
                <Textarea
                  value={projectDescription}
                  onChange={(event) =>
                    setProjectDescription(event.target.value)
                  }
                  placeholder="What is this project trying to achieve?"
                  rows={4}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Status
                  </label>
                  <select
                    value={projectStatus}
                    onChange={(event) =>
                      setProjectStatus(
                        event.target.value as GoDevLabProjectStatus
                      )
                    }
                    className={selectClassName}
                  >
                    {projectStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Priority
                  </label>
                  <select
                    value={projectPriority}
                    onChange={(event) =>
                      setProjectPriority(
                        event.target.value as GoDevLabProjectPriority
                      )
                    }
                    className={selectClassName}
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Due date
                </label>
                <Input
                  type="date"
                  value={projectDueDate}
                  onChange={(event) => setProjectDueDate(event.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-brand-700 hover:bg-brand-800"
                disabled={!canCreateProject || createProjectMutation.isPending}
              >
                {createProjectMutation.isPending
                  ? "Creating..."
                  : "Create Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Project List</CardTitle>
            <CardDescription>
              Select a project to review its tasks and activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-muted-foreground">
                No projects yet. Create the first one to start tracking work.
              </div>
            ) : (
              projects.map((project) => {
                const projectTasks = allTasks.filter(
                  (task) => task.project_id === project.id
                );
                const doneTasks = projectTasks.filter(
                  (task) => task.status === "done"
                ).length;
                const isActive = selectedProjectId === project.id;

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                      isActive
                        ? "border-brand-300 bg-brand-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {project.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {project.description || "No description yet."}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={statusStyles[project.status]}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{project.priority} priority</span>
                      <span>
                        {doneTasks}/{projectTasks.length} done
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {selectedProject ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4 text-brand-700" />
                      <CardTitle>{selectedProject.title}</CardTitle>
                    </div>
                    <CardDescription className="mt-2">
                      {selectedProject.description || "No project description yet."}
                    </CardDescription>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Tasks
                      </p>
                      <p className="mt-2 text-xl font-semibold text-gray-900">
                        {projectTaskStats.total}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        In Progress
                      </p>
                      <p className="mt-2 text-xl font-semibold text-gray-900">
                        {projectTaskStats.inProgress}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Done
                      </p>
                      <p className="mt-2 text-xl font-semibold text-gray-900">
                        {projectTaskStats.done}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Status
                    </label>
                    <select
                      value={selectedProject.status}
                      onChange={(event) =>
                        updateProjectMutation.mutate({
                          projectId: selectedProject.id,
                          status: event.target.value as GoDevLabProjectStatus,
                        })
                      }
                      className={selectClassName}
                      disabled={
                        updateProjectMutation.isPending || !canManageSelectedProject
                      }
                    >
                      {projectStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Priority
                    </label>
                    <select
                      value={selectedProject.priority}
                      onChange={(event) =>
                        updateProjectMutation.mutate({
                          projectId: selectedProject.id,
                          priority: event.target.value as GoDevLabProjectPriority,
                        })
                      }
                      className={selectClassName}
                      disabled={
                        updateProjectMutation.isPending || !canManageSelectedProject
                      }
                    >
                      {priorityOptions.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Due date
                    </label>
                    <Input
                      type="date"
                      value={selectedProject.due_date ?? ""}
                      onChange={(event) =>
                        updateProjectMutation.mutate({
                          projectId: selectedProject.id,
                          dueDate: event.target.value || null,
                        })
                      }
                      disabled={
                        updateProjectMutation.isPending || !canManageSelectedProject
                      }
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-medium text-gray-900">
                      {projectTaskStats.completion}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-brand-700"
                      style={{ width: `${projectTaskStats.completion}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-brand-700" />
                    {selectedProject.due_date
                      ? `Due ${format(new Date(selectedProject.due_date), "MMM d, yyyy")}`
                      : "No due date"}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <CheckSquare2 className="h-4 w-4 text-brand-700" />
                    Created by {selectedProject.employee?.full_name ?? "Unknown"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-4 w-4 text-brand-700" />
                    <CardTitle className="text-base">Work Items</CardTitle>
                  </div>
                  <CardDescription>
                    Break the project down into concrete tasks.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (canCreateTask) {
                        createTaskMutation.mutate();
                      }
                    }}
                    className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <Input
                      value={taskTitle}
                      onChange={(event) => setTaskTitle(event.target.value)}
                      placeholder="New task title"
                    />
                    <Textarea
                      value={taskDetails}
                      onChange={(event) => setTaskDetails(event.target.value)}
                      placeholder="Add context, requirements, or acceptance notes."
                      rows={3}
                    />
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        type="date"
                        value={taskDueDate}
                        onChange={(event) => setTaskDueDate(event.target.value)}
                      />
                      <Button
                        type="submit"
                        className="bg-brand-700 hover:bg-brand-800"
                        disabled={!canCreateTask || createTaskMutation.isPending}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Task
                      </Button>
                    </div>
                  </form>

                  {selectedTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No tasks yet for this project.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedTasks.map((task) => {
                        const canManageTask =
                          employee?.role === "admin" ||
                          task.created_by === employee?.id;
                        const canDelete =
                          canManageTask;

                        return (
                          <div
                            key={task.id}
                            className="rounded-2xl border border-gray-200 p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900">
                                    {task.title}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={taskStyles[task.status]}
                                  >
                                    {task.status.replace("_", " ")}
                                  </Badge>
                                </div>
                                {task.details && (
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    {task.details}
                                  </p>
                                )}
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  <span>
                                    {task.employee?.full_name ?? "Unknown"}
                                  </span>
                                  <span>
                                    {task.due_date
                                      ? `Due ${format(
                                          new Date(task.due_date),
                                          "MMM d, yyyy"
                                        )}`
                                      : "No due date"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-start gap-2">
                                <select
                                  value={task.status}
                                  onChange={(event) =>
                                    updateTaskMutation.mutate({
                                      taskId: task.id,
                                      status: event.target
                                        .value as GoDevLabTaskStatus,
                                    })
                                  }
                                  className={selectClassName}
                                  disabled={
                                    updateTaskMutation.isPending || !canManageTask
                                  }
                                >
                                  {taskStatusOptions.map((status) => (
                                    <option key={status} value={status}>
                                      {status.replace("_", " ")}
                                    </option>
                                  ))}
                                </select>
                                {canDelete && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-red-600"
                                    onClick={() => deleteTaskMutation.mutate(task.id)}
                                    disabled={deleteTaskMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activity Log</CardTitle>
                  <CardDescription>
                    Record progress updates, blockers, and decisions for the
                    project.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (canCreateUpdate) {
                        createUpdateMutation.mutate();
                      }
                    }}
                    className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <Input
                      value={updateTitle}
                      onChange={(event) => setUpdateTitle(event.target.value)}
                      placeholder="Update title"
                    />
                    <select
                      value={updateType}
                      onChange={(event) =>
                        setUpdateType(event.target.value as GoDevLabUpdateType)
                      }
                      className={selectClassName}
                    >
                      {updateTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <Textarea
                      value={updateDetails}
                      onChange={(event) => setUpdateDetails(event.target.value)}
                      placeholder="Describe what happened, what changed, or what needs attention."
                      rows={4}
                    />
                    <Button
                      type="submit"
                      className="bg-brand-700 hover:bg-brand-800"
                      disabled={!canCreateUpdate || createUpdateMutation.isPending}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Update
                    </Button>
                  </form>

                  {projectUpdates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No updates logged yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {projectUpdates.map((update) => {
                        const canDelete =
                          employee?.role === "admin" ||
                          update.created_by === employee?.id;

                        return (
                          <div
                            key={update.id}
                            className="rounded-2xl border border-gray-200 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900">
                                    {update.title}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={updateStyles[update.update_type]}
                                  >
                                    {update.update_type}
                                  </Badge>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                                  {update.details}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  <span className="font-medium text-brand-700">
                                    {update.employee?.full_name ?? "Unknown"}
                                  </span>
                                  <span>
                                    {formatDistanceToNow(
                                      new Date(update.created_at),
                                      {
                                        addSuffix: true,
                                      }
                                    )}
                                  </span>
                                </div>
                              </div>
                              {canDelete && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-red-600"
                                  onClick={() =>
                                    deleteUpdateMutation.mutate(update.id)
                                  }
                                  disabled={deleteUpdateMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
              Select a project to start tracking work.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
