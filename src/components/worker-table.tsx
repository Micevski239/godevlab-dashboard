"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { Employee, TimeEntry } from "@/types";
import { cn } from "@/lib/utils";
import { getWorkspaceBasePath } from "@/lib/workspaces";

interface WorkerTableProps {
  employees: Employee[];
  todayEntries: TimeEntry[];
}

export function WorkerTable({ employees, todayEntries }: WorkerTableProps) {
  const pathname = usePathname();
  const basePath = getWorkspaceBasePath(pathname);

  const getEmployeeStatus = (employeeId: string) => {
    const entries = todayEntries.filter((e) => e.employee_id === employeeId);
    const active = entries.find((e) => !e.clock_out);
    if (active) return "clocked-in";
    if (entries.length > 0) return "clocked-out";
    return "not-started";
  };

  const getEmployeeTodayHours = (employeeId: string) => {
    const entries = todayEntries.filter((e) => e.employee_id === employeeId);
    return entries.reduce((acc, entry) => {
      const start = new Date(entry.clock_in).getTime();
      const end = entry.clock_out
        ? new Date(entry.clock_out).getTime()
        : Date.now();
      return acc + (end - start) / (1000 * 60 * 60);
    }, 0);
  };

  const statusConfig = {
    "clocked-in": {
      label: "Working",
      className: "bg-green-100 text-green-700",
    },
    "clocked-out": { label: "Done", className: "bg-gray-100 text-gray-700" },
    "not-started": {
      label: "Not started",
      className: "bg-yellow-100 text-yellow-700",
    },
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
              Name
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
              Role
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
              Status
            </th>
            <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">
              Today
            </th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => {
            const status = getEmployeeStatus(emp.id);
            const hours = getEmployeeTodayHours(emp.id);
            const config = statusConfig[status];

            return (
              <tr
                key={emp.id}
                className="border-b last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`${basePath}/workers/${emp.id}`}
                    className="text-sm font-medium hover:text-brand-700 transition-colors"
                  >
                    {emp.full_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{emp.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm capitalize text-muted-foreground">
                    {emp.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", config.className)}
                  >
                    {config.label}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-mono">
                    {hours > 0 ? `${hours.toFixed(1)}h` : "\u2014"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
