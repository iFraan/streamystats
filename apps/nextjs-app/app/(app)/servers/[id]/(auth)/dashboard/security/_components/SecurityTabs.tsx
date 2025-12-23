"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface SecurityTabsProps {
  stats: {
    unresolvedAnomalies: Record<string, number>;
  };
}

export function SecurityTabs({ stats }: SecurityTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalUnresolved = Object.values(stats.unresolvedAnomalies).reduce(
    (a, b) => a + b,
    0,
  );

  const isMapActive =
    pathname.endsWith("/map") || pathname.endsWith("/security");
  const isAnomaliesActive = pathname.endsWith("/anomalies");

  const preserveParams = () => {
    const params = new URLSearchParams(searchParams.toString());
    // Remove pagination when switching tabs
    params.delete("page");
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  const basePath = pathname.replace(/\/(map|anomalies)$/, "");

  return (
    <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
      <Link
        href={`${basePath}/map${preserveParams()}`}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          isMapActive
            ? "bg-background text-foreground shadow"
            : "hover:bg-background/50"
        }`}
      >
        Location Map
      </Link>
      <Link
        href={`${basePath}/anomalies${preserveParams()}`}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 relative ${
          isAnomaliesActive
            ? "bg-background text-foreground shadow"
            : "hover:bg-background/50"
        }`}
      >
        Anomalies
        {totalUnresolved > 0 && (
          <Badge
            variant="destructive"
            className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {totalUnresolved}
          </Badge>
        )}
      </Link>
    </div>
  );
}
