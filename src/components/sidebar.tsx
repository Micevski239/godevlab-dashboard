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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Employee } from "@/types";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/workers", label: "Employees", icon: Users },
  { href: "/dashboard/content", label: "Content", icon: Layers },
  { href: "/dashboard/posts", label: "Posts", icon: BookmarkPlus },
  { href: "/dashboard/notes", label: "Notes", icon: StickyNote },
  { href: "/dashboard/listings", label: "Listings", icon: FileText },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/add", label: "Add Event", icon: PlusCircle },
  { href: "/dashboard/add-promotion", label: "Add Promotion", icon: PlusCircle },
];

interface SidebarProps {
  employee: Employee | null;
}

export function Sidebar({ employee }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r bg-white flex flex-col h-screen sticky top-0">
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm">GoGevgelija</p>
          <p className="text-xs text-muted-foreground">Dashboard</p>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          if (
            employee?.role === "worker" &&
            (item.href === "/dashboard/content" || item.href === "/dashboard/posts" || item.href === "/dashboard/notes" || item.href === "/dashboard/listings" || item.href === "/dashboard/calendar" || item.href === "/dashboard/add" || item.href === "/dashboard/add-promotion")
          ) {
            return null;
          }

          return (
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
          );
        })}
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
