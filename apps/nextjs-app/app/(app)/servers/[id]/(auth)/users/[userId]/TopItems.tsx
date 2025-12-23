"use client";

import { Clock, Film, Play, Tv } from "lucide-react";
import Link from "next/link";
import { Poster } from "@/app/(app)/servers/[id]/(auth)/dashboard/Poster";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Item, Server } from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";

export interface ItemWithStats extends Item {
  totalPlayCount: number;
  totalPlayDuration: number;
}

interface TopItemsListProps {
  items: ItemWithStats[];
  server: Server;
  title: string;
  type: "movie" | "series";
  className?: string;
}

export function TopItemsList({
  items,
  server,
  title,
  type,
  className,
}: TopItemsListProps) {
  const Icon = type === "movie" ? Film : Tv;

  return (
    <Card
      className={cn(
        "w-full bg-background/40 backdrop-blur-md border-white/10 shadow-xl overflow-hidden",
        className,
      )}
    >
      <CardHeader className="pb-3 border-b border-white/5">
        <CardTitle className="text-md font-bold flex items-center gap-3 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          <Icon className="w-6 h-6 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ItemsList items={items} server={server} type={type} />
      </CardContent>
    </Card>
  );
}

function ItemsList({
  items,
  server,
  type,
}: {
  items: ItemWithStats[];
  server: Server;
  type: "movie" | "series";
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>No {type === "movie" ? "movies" : "TV shows"} found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-white/5">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="group relative flex items-center gap-3 p-3 transition-colors hover:bg-white/5"
        >
          <div className="flex-shrink-0 relative">
            <div className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-lg z-10 ring-2 ring-background">
              {index + 1}
            </div>

            <Link
              href={`/servers/${server.id}/library/${item.id}`}
              className="block overflow-hidden rounded-md shadow-sm transition-transform group-hover:scale-105"
            >
              <Poster
                item={item}
                server={server}
                width={60}
                height={90}
                className="h-[90px] w-[60px]"
                preferredImageType="Primary"
              />
            </Link>
          </div>

          <div className="flex flex-1 flex-col gap-1.5 min-w-0">
            <Link
              href={`/servers/${server.id}/library/${item.id}`}
              className="truncate font-medium leading-tight group-hover:text-primary transition-colors"
            >
              {item.name}
            </Link>

            {(item.productionYear || item.seriesName) && (
              <div className="text-sm text-muted-foreground truncate">
                {item.seriesName ? item.seriesName : item.productionYear}
              </div>
            )}

            <div className="mt-1 flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="bg-white/5 text-xs h-6 px-2 font-medium gap-1.5"
              >
                <Play className="h-3 w-3" />
                {item.totalPlayCount}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-white/5 text-xs h-6 px-2 font-medium gap-1.5"
              >
                <Clock className="h-3 w-3" />
                {formatDuration(item.totalPlayDuration)}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
