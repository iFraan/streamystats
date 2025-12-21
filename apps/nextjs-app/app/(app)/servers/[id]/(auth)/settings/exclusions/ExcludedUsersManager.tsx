"use client";

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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import type { User } from "@streamystats/database/schema";
import { Loader, Settings2, UserX } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateExcludedUsersAction } from "./actions";

interface ExcludedUsersManagerProps {
  serverId: number;
  users: User[];
  excludedUserIds: string[];
}

export function ExcludedUsersManager({
  serverId,
  users,
  excludedUserIds: initialExcluded,
}: ExcludedUsersManagerProps) {
  const [open, setOpen] = useState(false);
  const [excludedUserIds, setExcludedUserIds] =
    useState<string[]>(initialExcluded);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (userId: string, visible: boolean) => {
    const newExcluded = visible
      ? excludedUserIds.filter((id) => id !== userId)
      : [...excludedUserIds, userId];

    setExcludedUserIds(newExcluded);

    startTransition(async () => {
      const result = await updateExcludedUsersAction(serverId, newExcluded);
      if (result.success) {
        toast.success(visible ? "User now visible" : "User hidden from stats");
      } else {
        setExcludedUserIds(
          visible
            ? [...excludedUserIds, userId]
            : excludedUserIds.filter((id) => id !== userId),
        );
        toast.error(result.message || "Failed to update settings");
      }
    });
  };

  const excludedCount = excludedUserIds.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserX className="h-5 w-5" />
          Excluded Users
        </CardTitle>
        <CardDescription>
          Users excluded from statistics will not appear in leaderboards, watch
          time totals, or any other aggregated data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Manage Users ({excludedCount} hidden)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Exclude Users from Statistics
              </DialogTitle>
              <DialogDescription>
                Toggle visibility for each user. Hidden users will not appear in
                any statistics. Changes are saved automatically.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-1">
                {users.map((user) => {
                  const isVisible = !excludedUserIds.includes(user.id);

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name}</span>
                          {user.isAdministrator && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                          {isPending && (
                            <Loader className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {isVisible ? "Visible in stats" : "Hidden from stats"}
                        </p>
                      </div>
                      <Switch
                        checked={isVisible}
                        onCheckedChange={(checked) =>
                          handleToggle(user.id, checked)
                        }
                        disabled={isPending}
                      />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              {users.length - excludedCount} of {users.length} users visible
            </div>
          </DialogContent>
        </Dialog>

        <p className="text-sm text-muted-foreground mt-3">
          Hidden users&apos; watch activity is still recorded but excluded from
          all statistics views.
        </p>
      </CardContent>
    </Card>
  );
}
