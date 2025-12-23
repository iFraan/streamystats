"use client";

import { CalendarDays, Loader, Settings2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { HOLIDAYS } from "@/lib/holidays";
import { updateDisabledHolidaysAction } from "./holiday-actions";

interface HolidaySettingsManagerProps {
  serverId: number;
  disabledHolidays: string[];
}

export function HolidaySettingsManager({
  serverId,
  disabledHolidays: initialDisabled,
}: HolidaySettingsManagerProps) {
  const [open, setOpen] = useState(false);
  const [disabledHolidays, setDisabledHolidays] =
    useState<string[]>(initialDisabled);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (holidayId: string, enabled: boolean) => {
    const newDisabled = enabled
      ? disabledHolidays.filter((id) => id !== holidayId)
      : [...disabledHolidays, holidayId];

    setDisabledHolidays(newDisabled);

    startTransition(async () => {
      const result = await updateDisabledHolidaysAction(serverId, newDisabled);
      if (result.success) {
        toast.success(enabled ? "Holiday enabled" : "Holiday disabled");
      } else {
        // Revert on error
        setDisabledHolidays(
          enabled
            ? [...disabledHolidays, holidayId]
            : disabledHolidays.filter((id) => id !== holidayId),
        );
        toast.error(result.message || "Failed to update settings");
      }
    });
  };

  const formatDateRange = (holiday: (typeof HOLIDAYS)[0]) => {
    if (holiday.dateRanges.length === 0) return "Special";

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return holiday.dateRanges
      .map((r) => {
        const start = `${months[r.startMonth - 1]} ${r.startDay}`;
        const end = `${months[r.endMonth - 1]} ${r.endDay}`;
        return `${start} - ${end}`;
      })
      .join(", ");
  };

  const enabledCount = HOLIDAYS.length - disabledHolidays.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Seasonal Recommendations
        </CardTitle>
        <CardDescription>
          Configure which holidays and events show themed recommendations on
          your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Manage Holidays ({enabledCount}/{HOLIDAYS.length} enabled)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Holiday Settings
              </DialogTitle>
              <DialogDescription>
                Enable or disable themed recommendations for specific holidays
                and events. Changes are saved automatically.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-1">
                {HOLIDAYS.map((holiday) => {
                  const isEnabled = !disabledHolidays.includes(holiday.id);

                  return (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{holiday.name}</span>
                          {isPending && (
                            <Loader className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {holiday.description}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {formatDateRange(holiday)}
                        </p>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) =>
                          handleToggle(holiday.id, checked)
                        }
                        disabled={isPending}
                      />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              {enabledCount} of {HOLIDAYS.length} holidays enabled
            </div>
          </DialogContent>
        </Dialog>

        <p className="text-sm text-muted-foreground mt-3">
          When a holiday is active, themed movie and series recommendations will
          appear on your dashboard.
        </p>
      </CardContent>
    </Card>
  );
}
