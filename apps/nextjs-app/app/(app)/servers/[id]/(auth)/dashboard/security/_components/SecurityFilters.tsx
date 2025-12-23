"use client";

import { format, isValid, parseISO } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
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

interface SecurityFiltersProps {
  users: { id: string; name: string }[];
}

export function SecurityFilters({ users }: SecurityFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const hasFilters = !!(
    searchParams.get("userId") ||
    searchParams.get("dateFrom") ||
    searchParams.get("dateTo")
  );

  const dateRange = useMemo((): DateRange | undefined => {
    const fromStr = searchParams.get("dateFrom");
    const toStr = searchParams.get("dateTo");
    const from = fromStr ? parseISO(fromStr) : undefined;
    const to = toStr ? parseISO(toStr) : undefined;
    if (from && isValid(from) && to && isValid(to)) {
      return { from, to };
    }
    if (from && isValid(from)) {
      return { from };
    }
    return undefined;
  }, [searchParams]);

  const dateRangeLabel = useMemo(() => {
    if (!dateRange?.from) return "Date range";
    if (!dateRange.to) return format(dateRange.from, "MMM dd, yyyy");
    return `${format(dateRange.from, "MMM dd")} - ${format(
      dateRange.to,
      "MMM dd, yyyy",
    )}`;
  }, [dateRange]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page"); // Reset pagination on filter change
    router.push(`?${params.toString()}`);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (range?.from) {
      params.set("dateFrom", format(range.from, "yyyy-MM-dd"));
    } else {
      params.delete("dateFrom");
    }
    if (range?.to) {
      params.set("dateTo", format(range.to, "yyyy-MM-dd"));
      setDatePickerOpen(false);
    } else {
      params.delete("dateTo");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("userId");
    params.delete("dateFrom");
    params.delete("dateTo");
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={searchParams.get("userId") || "all"}
        onValueChange={(value) => handleFilterChange("userId", value)}
      >
        <SelectTrigger className="w-[160px]">
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

      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-start">
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
          />
        </PopoverContent>
      </Popover>

      {hasFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearFilters}
          title="Clear filters"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
