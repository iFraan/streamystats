"use client";

import { addDays, format, isValid, parseISO } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryParams } from "@/hooks/useQueryParams";

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

interface ClientFiltersProps {
  users: { id: string; name: string }[];
  showUserFilter?: boolean;
}

export function ClientFilters({
  users,
  showUserFilter = true,
}: ClientFiltersProps) {
  const searchParams = useSearchParams();
  const { updateQueryParams, isLoading } = useQueryParams();
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);

  const disableFutureDays = React.useCallback((date: Date) => {
    return date > new Date();
  }, []);

  const rangeFromUrl = React.useMemo((): DateRange | undefined => {
    const from = parseDateParam(searchParams.get("startDate"));
    const to = parseDateParam(searchParams.get("endDate"));

    if (from && to) {
      return { from, to };
    }

    return undefined;
  }, [searchParams]);

  const [range, setRange] = React.useState<DateRange | undefined>(rangeFromUrl);

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

  const handleDateSelect = React.useCallback(
    (next: DateRange | undefined) => {
      if (!next) return;
      setRange(next);

      if (next.from && next.to) {
        commitRangeToUrl(next);
        setDatePickerOpen(false);
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

  const dateRangeLabel = React.useMemo(() => {
    const from = parseDateParam(searchParams.get("startDate"));
    const to = parseDateParam(searchParams.get("endDate"));

    if (!from && !to) return "All time";
    if (!from || !to) return "Pick a date range";
    return `${format(from, "MMM dd, yyyy")} – ${format(to, "MMM dd, yyyy")}`;
  }, [searchParams]);

  const selectedUserId = searchParams.get("userId") || "all";
  const handleUserChange = React.useCallback(
    (value: string) => {
      updateQueryParams({
        userId: value === "all" ? null : value,
      });
    },
    [updateQueryParams],
  );

  const hasFilters = React.useMemo(() => {
    return !!(
      searchParams.get("startDate") ||
      searchParams.get("endDate") ||
      searchParams.get("userId")
    );
  }, [searchParams]);

  const clearFilters = React.useCallback(() => {
    updateQueryParams({
      startDate: null,
      endDate: null,
      userId: null,
    });
  }, [updateQueryParams]);

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={isLoading}
                className="justify-start text-left font-normal sm:w-[320px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                captionLayout="dropdown"
                numberOfMonths={2}
                defaultMonth={range?.from || new Date()}
                selected={range}
                onSelect={handleDateSelect}
                initialFocus
                disabled={disableFutureDays}
              />
            </PopoverContent>
          </Popover>

          {showUserFilter && (
            <Select
              value={selectedUserId}
              onValueChange={handleUserChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

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
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLoading}
              onClick={clearFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
