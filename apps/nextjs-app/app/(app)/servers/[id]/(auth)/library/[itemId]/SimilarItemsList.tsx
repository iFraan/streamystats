"use client";

import { Poster } from "@/app/(app)/servers/[id]/(auth)/dashboard/Poster";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { SeriesRecommendationItem } from "@/lib/db/similar-series-statistics";
import type { RecommendationItem } from "@/lib/db/similar-statistics";
import { formatDuration } from "@/lib/utils";
import type { Server } from "@streamystats/database/schema";
import { Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

interface SimilarItemsProps {
  items: Array<RecommendationItem | SeriesRecommendationItem>;
  server: Server;
  currentItemType: string;
}

function formatRuntime(runtimeTicks: number): string {
  // Convert ticks to milliseconds (1 tick = 100 nanoseconds)
  const milliseconds = runtimeTicks / 10000;
  return formatDuration(Math.round(milliseconds / 1000));
}

export function SimilarItemsList({
  items,
  server,
  currentItemType,
}: SimilarItemsProps) {
  if (items.length === 0) {
    return null;
  }

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case "Series":
        return "Similar Series";
      case "Movie":
        return "Similar Movies";
      case "Episode":
        return "Similar Episodes";
      default:
        return "Similar Items";
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return "text-green-500";
    if (similarity >= 0.6) return "text-blue-500";
    return "text-yellow-500";
  };

  return (
    <div>
      <div className="rounded-lg border bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
        <div className="relative z-10">
          <div className="p-4 pb-3">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              {getItemTypeLabel(currentItemType)}
            </h2>
          </div>

          <div className="">
            <ScrollArea dir="ltr" className="w-full py-1">
              <div className="flex gap-4 flex-nowrap px-4 w-max">
                {items.map((recommendation) => {
                  const { item, similarity } = recommendation;

                  return (
                    <div
                      key={item.id || `${item.name}-${item.productionYear}`}
                      className="flex-shrink-0 group relative"
                    >
                      <div className="relative w-[152px] sm:w-[184px] py-2">
                        <Link
                          href={`/servers/${server.id}/library/${item.id}`}
                          className="flex flex-col overflow-hidden border border-border bg-card rounded-lg hover:border-primary/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:z-10 relative"
                        >
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                            <Poster
                              item={item}
                              server={server}
                              width={184}
                              height={240}
                              preferredImageType="Primary"
                              className="w-full h-[208px] sm:h-[256px] rounded-t-lg"
                            />
                            <div className="absolute top-2 left-2 z-20">
                              <Badge
                                className={`${getSimilarityColor(
                                  similarity,
                                )} bg-background/90 backdrop-blur-sm border-0 shadow-lg text-xs px-1.5 py-0.5`}
                              >
                                <TrendingUp className="h-2.5 w-2.5 mr-1" />
                                {Math.round(similarity * 100)}%
                              </Badge>
                            </div>
                          </div>

                          <div className="p-3 space-y-2 bg-gradient-to-b from-card to-card/95">
                            <div>
                              <h3 className="text-foreground text-sm font-bold truncate">
                                {item.name}
                              </h3>
                              <p className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1.5">
                                {item.productionYear}
                                {item.runtimeTicks && (
                                  <>
                                    <span>•</span>
                                    {formatRuntime(Number(item.runtimeTicks))}
                                  </>
                                )}
                                {item.type === "Series" && (
                                  <>
                                    <span>•</span>
                                    Series
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
