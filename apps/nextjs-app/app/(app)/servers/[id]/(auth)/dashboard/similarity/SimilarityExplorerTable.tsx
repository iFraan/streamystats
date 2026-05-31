"use client";

import { ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { Poster } from "@/app/(app)/servers/[id]/(auth)/dashboard/Poster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueryParams } from "@/hooks/useQueryParams";
import type { SimilarityExplorerResponse } from "@/lib/db/similarity-explorer";
import type { ServerPublic, User } from "@/lib/types";
import { getSimilarityExplorerBadge } from "./similarity-explorer";

interface SimilarityExplorerTableProps {
  data: SimilarityExplorerResponse;
  selectedUserId: string;
  server: ServerPublic;
  showUserFilter: boolean;
  users: User[];
}

export function SimilarityExplorerTable({
  data,
  selectedUserId,
  server,
  showUserFilter,
  users,
}: SimilarityExplorerTableProps) {
  const searchParams = useSearchParams();
  const { updateQueryParams, isLoading } = useQueryParams();
  const currentPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const currentSearch = searchParams.get("search") ?? "";
  const currentSortOrder = searchParams.get("sort_order") ?? "desc";
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [debouncedSearch] = useDebounce(searchInput, 500);

  useEffect(() => {
    if (debouncedSearch !== currentSearch) {
      updateQueryParams({
        search: debouncedSearch || null,
        page: null,
      });
    }
  }, [currentSearch, debouncedSearch, updateQueryParams]);

  const updateFilter = (key: string, value: string) => {
    updateQueryParams({
      [key]: value === "all" ? null : value,
      page: null,
    });
  };

  const toggleSimilaritySort = () => {
    updateQueryParams({
      sort_order: currentSortOrder === "desc" ? "asc" : "desc",
      page: null,
    });
  };

  const pageStart =
    data.totalItems === 0 ? 0 : (data.page - 1) * data.perPage + 1;
  const pageEnd = (data.page - 1) * data.perPage + data.data.length;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <Input
          placeholder="Search items..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="lg:mr-auto lg:max-w-sm"
        />
        <Select
          value={searchParams.get("watched") ?? "all"}
          onValueChange={(value) => updateFilter("watched", value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full lg:w-[160px]">
            <SelectValue placeholder="Watched state" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All items</SelectItem>
              <SelectItem value="watched">Watched</SelectItem>
              <SelectItem value="unwatched">Unwatched</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={searchParams.get("type") ?? "all"}
          onValueChange={(value) => updateFilter("type", value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full lg:w-[160px]">
            <SelectValue placeholder="Item type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Movies and series</SelectItem>
              <SelectItem value="Movie">Movies</SelectItem>
              <SelectItem value="Series">Series</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {showUserFilter ? (
          <Select
            value={selectedUserId}
            onValueChange={(value) => updateFilter("userId", value)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full lg:w-[200px]">
              <SelectValue placeholder="Taste profile" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={toggleSimilaritySort}>
                  Similarity
                  <ArrowUpDown data-icon="inline-end" />
                </Button>
              </TableHead>
              <TableHead>Watched</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length > 0 ? (
              data.data.map((row) => {
                const similarityBadge = getSimilarityExplorerBadge(
                  row.similarity,
                );

                return (
                  <TableRow key={row.item.id}>
                    <TableCell>
                      <Link
                        href={`/servers/${server.id}/library/${row.item.id}`}
                        className="group flex items-center gap-4"
                      >
                        <Poster item={row.item} server={server} />
                        <div>
                          <p className="font-medium transition-colors group-hover:text-primary">
                            {row.item.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {row.item.type}
                            {row.item.productionYear
                              ? ` - ${row.item.productionYear}`
                              : ""}
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={similarityBadge.className}
                      >
                        {similarityBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.watched ? "secondary" : "outline"}>
                        {row.watched ? "Watched" : "Unwatched"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No items match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {pageStart} - {pageEnd} of {data.totalItems} results.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateQueryParams({ page: String(currentPage - 1) })}
            disabled={currentPage <= 1 || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateQueryParams({ page: String(currentPage + 1) })}
            disabled={currentPage >= data.totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
