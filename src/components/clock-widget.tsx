"use client";

import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut } from "lucide-react";
import { useClock } from "@/hooks/use-clock";
import { useCurrentEmployee } from "@/hooks/use-employee";
import { getWorkspaceFromPathname } from "@/lib/workspaces";

export function ClockWidget() {
  const pathname = usePathname();
  const workspace = getWorkspaceFromPathname(pathname);
  const { data: employee } = useCurrentEmployee();
  const {
    isClockedIn,
    elapsedFormatted,
    clockIn,
    clockOut,
    isClockingIn,
    isClockingOut,
    isLoading,
  } = useClock(employee?.id, workspace);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isClockedIn ? "border-green-200 bg-green-50/50" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isClockedIn
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isClockedIn ? "Currently Working" : "Not Clocked In"}
              </p>
              {isClockedIn && (
                <p className="text-2xl font-mono font-bold text-green-700">
                  {elapsedFormatted}
                </p>
              )}
            </div>
          </div>

          {isClockedIn ? (
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => clockOut(undefined)}
              disabled={isClockingOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isClockingOut ? "..." : "Clock Out"}
            </Button>
          ) : (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => clockIn()}
              disabled={isClockingIn}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isClockingIn ? "..." : "Clock In"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
