"use client";

import { format, isValid, parseISO } from "date-fns";
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

interface HistoryFiltersProps {
  users: { id: string; name: string }[];
  deviceNames: string[];
  clientNames: string[];
  playMethods: string[];
}

export function HistoryFilters({
  users,
  deviceNames,
  clientNames,
  playMethods,
}: HistoryFiltersProps) {
  const searchParams = useSearchParams();
  const { updateQueryParams, isLoading } = useQueryParams();

  const [datePickerOpen, setDatePickerOpen] = React.useState(false);

  const dateRange = React.useMemo((): DateRange => {
    const from = parseDateParam(searchParams.get("startDate"));
    const to = parseDateParam(searchParams.get("endDate"));
    return { from, to };
  }, [searchParams]);

  const dateRangeLabel = React.useMemo(() => {
    if (!dateRange?.from) return "Date range";
    if (!dateRange.to) return format(dateRange.from, "MMM dd, yyyy");
    return `${format(dateRange.from, "MMM dd, yyyy")} – ${format(dateRange.to, "MMM dd, yyyy")}`;
  }, [dateRange]);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (!range) return;
    const params: Record<string, string | null> = { page: "1" };
    if (range.from) {
      params.startDate = formatDateParam(range.from);
    } else {
      params.startDate = null;
    }
    if (range.to) {
      params.endDate = formatDateParam(range.to);
    } else {
      params.endDate = null;
    }
    updateQueryParams(params);
    if (range.from && range.to) {
      setDatePickerOpen(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    updateQueryParams({
      [key]: value === "all" ? null : value,
      page: "1",
    });
  };

  const hasFilters = React.useMemo(() => {
    return !!(
      searchParams.get("startDate") ||
      searchParams.get("endDate") ||
      searchParams.get("userId") ||
      searchParams.get("itemType") ||
      searchParams.get("deviceName") ||
      searchParams.get("clientName") ||
      searchParams.get("playMethod")
    );
  }, [searchParams]);

  const clearFilters = () => {
    updateQueryParams({
      startDate: null,
      endDate: null,
      userId: null,
      itemType: null,
      deviceName: null,
      clientName: null,
      playMethod: null,
      page: "1",
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground",
            )}
            disabled={isLoading}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRangeLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
            disabled={(date) => date > new Date()}
          />
        </PopoverContent>
      </Popover>

      <Select
        value={searchParams.get("userId") || "all"}
        onValueChange={(value) => handleFilterChange("userId", value)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[180px]">
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

      <Select
        value={searchParams.get("itemType") || "all"}
        onValueChange={(value) => handleFilterChange("itemType", value)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="Movie">Movie</SelectItem>
          <SelectItem value="Series">Series</SelectItem>
          <SelectItem value="Episode">Episode</SelectItem>
          <SelectItem value="Audio">Audio</SelectItem>
          <SelectItem value="MusicAlbum">Music Album</SelectItem>
          <SelectItem value="MusicArtist">Music Artist</SelectItem>
        </SelectContent>
      </Select>

      {deviceNames.length > 0 && (
        <Select
          value={searchParams.get("deviceName") || "all"}
          onValueChange={(value) => handleFilterChange("deviceName", value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All devices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All devices</SelectItem>
            {deviceNames.map((device) => (
              <SelectItem key={device} value={device}>
                {device}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {clientNames.length > 0 && (
        <Select
          value={searchParams.get("clientName") || "all"}
          onValueChange={(value) => handleFilterChange("clientName", value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clients</SelectItem>
            {clientNames.map((client) => (
              <SelectItem key={client} value={client}>
                {client}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {playMethods.length > 0 && (
        <Select
          value={searchParams.get("playMethod") || "all"}
          onValueChange={(value) => handleFilterChange("playMethod", value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            {playMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearFilters}
          title="Clear filters"
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
