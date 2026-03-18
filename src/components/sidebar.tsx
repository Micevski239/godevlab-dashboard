"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Layers,
  PlusCircle,
  LogOut,
  Sparkles,
  BookmarkPlus,
  StickyNote,
  FileText,
  CalendarDays,
  Rocket,
  Check,
  ChevronDown,
  FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  getWorkspaceFromPathname,
  getWorkspaceOption,
  workspaceOptions,
  type DashboardWorkspace,
} from "@/lib/workspaces";
import type { Employee } from "@/types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type WorkspaceConfig = {
  sections: NavSection[];
  actions: NavItem[];
};

const workspaceConfigs: Record<DashboardWorkspace, WorkspaceConfig> = {
  gogevgelija: {
    sections: [
      {
        title: "Operations",
        items: [
          { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
          { href: "/dashboard/workers", label: "Employees", icon: Users },
        ],
      },
      {
        title: "Publishing",
        items: [
          { href: "/dashboard/content", label: "Content", icon: Layers },
          { href: "/dashboard/listings", label: "Listings", icon: FileText },
        ],
      },
      {
        title: "Inspiration",
        items: [
          { href: "/dashboard/posts", label: "Posts", icon: BookmarkPlus },
          { href: "/dashboard/notes", label: "Notes", icon: StickyNote },
        ],
      },
      {
        title: "Planning",
        items: [
          { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
          { href: "/dashboard/new-update", label: "New Update", icon: Rocket },
        ],
      },
    ],
    actions: [
      { href: "/dashboard/add", label: "Add Event", icon: PlusCircle },
      {
        href: "/dashboard/add-promotion",
        label: "Add Promotion",
        icon: PlusCircle,
      },
    ],
  },
  godevlab: {
    sections: [
      {
        title: "Operations",
        items: [
          { href: "/dashboard/godevlab", label: "Overview", icon: LayoutDashboard },
          { href: "/dashboard/godevlab/workers", label: "Employees", icon: Users },
        ],
      },
      {
        title: "Inspiration",
        items: [
          { href: "/dashboard/godevlab/posts", label: "Posts", icon: BookmarkPlus },
          { href: "/dashboard/godevlab/notes", label: "Notes", icon: StickyNote },
        ],
      },
      {
        title: "Planning",
        items: [
          {
            href: "/dashboard/godevlab/calendar",
            label: "Calendar",
            icon: CalendarDays,
          },
        ],
      },
      {
        title: "Project Tracking",
        items: [
          {
            href: "/dashboard/godevlab/projects",
            label: "Projects",
            icon: FolderKanban,
          },
        ],
      },
    ],
    actions: [],
  },
};

const workerRestrictedRoutes = new Set([
  "/dashboard/content",
  "/dashboard/posts",
  "/dashboard/notes",
  "/dashboard/new-update",
  "/dashboard/listings",
  "/dashboard/calendar",
  "/dashboard/godevlab/posts",
  "/dashboard/godevlab/notes",
  "/dashboard/godevlab/calendar",
  "/dashboard/godevlab/projects",
]);

interface SidebarProps {
  employee: Employee | null;
}

export function Sidebar({ employee }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const workspace = getWorkspaceFromPathname(pathname);
  const currentWorkspace = getWorkspaceOption(workspace);
  const workspaceConfig = workspaceConfigs[workspace];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/dashboard/godevlab") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r bg-white flex flex-col h-screen sticky top-0">
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 text-left transition-colors hover:bg-gray-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">
                  {currentWorkspace.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentWorkspace.subtitle}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 border-gray-200 bg-white shadow-lg"
          >
            <DropdownMenuLabel>Switch Dashboard</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {workspaceOptions.map((option) => (
              <DropdownMenuItem
                key={option.key}
                onSelect={() => router.push(option.basePath)}
                className="flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {option.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {option.subtitle}
                  </p>
                </div>
                {option.key === workspace && (
                  <Check className="h-4 w-4 text-brand-700" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      <nav className="flex-1 p-3 flex flex-col">
        <div className="space-y-5">
          {workspaceConfig.sections.map((section) => {
            const visibleItems = section.items.filter((item) => {
              if (employee?.role !== "worker") {
                return true;
              }

              return !workerRestrictedRoutes.has(item.href);
            });

            if (visibleItems.length === 0) {
              return null;
            }

            return (
              <div key={section.title} className="space-y-1.5">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-brand-50 text-brand-700"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {employee?.role !== "worker" && workspaceConfig.actions.length > 0 && (
          <div className="mt-auto space-y-2 pt-3">
            {workspaceConfig.actions.map((item) => (
              <Button
                key={item.href}
                asChild
                className={cn(
                  "w-full justify-start bg-brand-700 text-white hover:bg-brand-800",
                  isActive(item.href) && "bg-brand-800"
                )}
              >
                <Link href={item.href}>
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        )}
      </nav>

      <Separator />

      <div className="p-3 space-y-2">
        {employee && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">
              {employee.full_name}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {employee.role}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
