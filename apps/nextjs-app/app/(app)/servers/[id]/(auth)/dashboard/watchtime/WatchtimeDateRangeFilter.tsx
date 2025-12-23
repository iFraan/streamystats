"use client";

import { addDays, format, isValid, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQueryParams } from "@/hooks/useQueryParams";
import { cn } from "@/lib/utils";

const DATE_PARAM_FORMAT = "yyyy-MM-dd";

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  if (!isValid(parsed)) return undefined;
  return parsed;
}

function formatDateParam(date: Date): string {
  return format(date, DATE_PARAM_FORMAT);
}

function getDefaultRange(): DateRange {
  const to = new Date();
  const from = addDays(to, -7);
  return { from, to };
}

export function WatchtimeDateRangeFilter({
  className,
}: {
  className?: string;
}) {
  const searchParams = useSearchParams();
  const { updateQueryParams, isLoading } = useQueryParams();
  const [open, setOpen] = React.useState(false);

  const disableFutureDays = React.useCallback((date: Date) => {
    return date > new Date();
  }, []);

  const rangeFromUrl = React.useMemo((): DateRange => {
    const from = parseDateParam(searchParams.get("startDate"));
    const to = parseDateParam(searchParams.get("endDate"));

    if (from && to) {
      return { from, to };
    }

    return getDefaultRange();
  }, [searchParams]);

  const [range, setRange] = React.useState<DateRange>(rangeFromUrl);

  React.useEffect(() => {
    setRange(rangeFromUrl);
  }, [rangeFromUrl]);

  const commitRangeToUrl = React.useCallback(
    (next: DateRange) => {
      if (!next.from || !next.to) return;

      updateQueryParams({
        startDate: formatDateParam(next.from),
        endDate: formatDateParam(next.to),
      });
    },
    [updateQueryParams],
  );

  const handleSelect = React.useCallback(
    (next: DateRange | undefined) => {
      if (!next) return;
      setRange(next);

      if (next.from && next.to) {
        commitRangeToUrl(next);
        setOpen(false);
      }
    },
    [commitRangeToUrl],
  );

  const applyPreset = React.useCallback(
    (days: number) => {
      const to = new Date();
      const from = addDays(to, -days);
      const next = { from, to } satisfies DateRange;
      setRange(next);
      commitRangeToUrl(next);
    },
    [commitRangeToUrl],
  );

  const apply7d = React.useCallback(() => applyPreset(7), [applyPreset]);
  const apply30d = React.useCallback(() => applyPreset(30), [applyPreset]);
  const apply90d = React.useCallback(() => applyPreset(90), [applyPreset]);

  const label = React.useMemo(() => {
    if (!range?.from) return "Pick a date range";
    if (!range.to) return format(range.from, "MMM dd, yyyy");
    return `${format(range.from, "MMM dd, yyyy")} – ${format(range.to, "MMM dd, yyyy")}`;
  }, [range?.from, range?.to]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={isLoading}
              className="justify-start text-left font-normal sm:w-[320px]"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              captionLayout="dropdown"
              numberOfMonths={2}
              defaultMonth={range?.from}
              selected={range}
              onSelect={handleSelect}
              initialFocus
              disabled={disableFutureDays}
            />
          </PopoverContent>
        </Popover>

        <div className="flex gap-2 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isLoading}
            onClick={apply7d}
          >
            7d
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isLoading}
            onClick={apply30d}
          >
            30d
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isLoading}
            onClick={apply90d}
          >
            90d
          </Button>
        </div>
      </div>
    </div>
  );
}
