"use client";

import { ChevronDown, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Server } from "@/lib/types";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

export interface UnwatchedItem {
  id: number;
  jellyfin_id: string;
  name: string;
  type: string;
  production_year: number | null;
  series_name: string | null;
  season_name: string | null;
  index_number: number | null;
  date_created: string;
  runtime_ticks: number | null;
}

export interface UnwatchedItemsResponse {
  data: UnwatchedItem[];
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

interface UnwatchedTableProps {
  server: Server;
  data: UnwatchedItemsResponse;
}

export function UnwatchedTable({ server: _server, data }: UnwatchedTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize states from URL query params
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialType = searchParams.get("type") || "movie";
  const initialSearch = searchParams.get("search") || "";

  const [page, setPage] = useState<number>(initialPage);
  const [type, setType] = useState<string>(initialType);
  const [search, setSearch] = useState<string>(initialSearch);
  const [_searchDebounce, setSearchDebounce] = useState<string>(initialSearch);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (page !== 1) params.set("page", page.toString());
    if (type !== "movie") params.set("type", type);
    if (search) params.set("search", search);

    const newUrl = `?${params.toString()}`;
    router.push(newUrl, { scroll: false });
  }, [page, type, search, router]);

  // Handle search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search);
      setPage(1); // Reset to page 1 when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const totalPages = data.total_pages;

    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage(1);
          }}
          isActive={page === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>,
    );

    // If there are too many pages, use ellipsis
    if (totalPages > 7) {
      const startPage = Math.max(2, page - 2);
      const endPage = Math.min(totalPages - 1, page + 2);

      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage(i);
              }}
              isActive={page === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>,
        );
      }

      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
    } else {
      // Show all pages if there are only a few
      for (let i = 2; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage(i);
              }}
              isActive={page === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>,
        );
      }
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setPage(totalPages);
            }}
            isActive={page === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-col md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search items..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              Type: {type === "movie" ? "Movies" : "Shows"}{" "}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                setType("movie");
                setPage(1);
              }}
            >
              Movies
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setType("series");
                setPage(1);
              }}
            >
              TV Shows
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Added Date</TableHead>
              <TableHead>Runtime</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6">
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((item: UnwatchedItem) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.production_year || "Unknown"}</TableCell>
                  <TableCell>
                    {new Date(item.date_created).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {item.runtime_ticks
                      ? formatMinutes(item.runtime_ticks / 600000000)
                      : "Unknown"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.total_pages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {renderPaginationItems()}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < data.total_pages) setPage(page + 1);
                }}
                className={
                  page >= data.total_pages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

function formatMinutes(minutes: number): string {
  if (Number.isNaN(minutes)) return "Unknown";

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours === 0) {
    return `${mins}m`;
  }

  return `${hours}h ${mins}m`;
}
