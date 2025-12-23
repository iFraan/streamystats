import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MostActiveUsersDay, MostWatchedDay } from "@/lib/db/statistics";
import { formatDuration } from "@/lib/utils";

function formatDateLabel(dateStr: string): string {
  const parsed = parseISO(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return format(parsed, "MMM d, yyyy");
}

export function WatchtimeHighlights({
  mostWatchedDay,
  mostActiveUsersDay,
  isAdmin,
}: {
  mostWatchedDay: MostWatchedDay | null;
  mostActiveUsersDay: MostActiveUsersDay | null;
  isAdmin: boolean;
}) {
  const gridCols = isAdmin ? "md:grid-cols-2" : "md:grid-cols-1";

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-2`}>
      <Card>
        <CardHeader className="space-y-0 pb-0">
          <CardTitle className="text-sm font-medium">
            <p className="text-neutral-500">Most Watched Day</p>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mostWatchedDay ? (
            <div className="text-start">
              <p className="text-2xl font-bold">
                {formatDuration(mostWatchedDay.watchTime)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDateLabel(mostWatchedDay.date)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data in range</p>
          )}
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader className="space-y-0 pb-0">
            <CardTitle className="text-sm font-medium">
              <p className="text-neutral-500">Most Active Users Day</p>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostActiveUsersDay ? (
              <div className="text-start">
                <p className="text-2xl font-bold">
                  {mostActiveUsersDay.activeUsers}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDateLabel(mostActiveUsersDay.date)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data in range</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
