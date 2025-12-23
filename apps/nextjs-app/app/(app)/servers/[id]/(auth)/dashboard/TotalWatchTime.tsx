import type { Server } from "@streamystats/database";
import { Clock } from "lucide-react";
import { redirect } from "next/navigation";
import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMe, getTotalWatchTime, isUserAdmin } from "@/lib/db/users";
import { formatDuration } from "@/lib/utils";

interface Props {
  server: Server;
  startDate: string;
  endDate: string;
}

const TotalWatchTime: React.FC<Props> = async ({
  server,
  startDate,
  endDate,
}) => {
  const [me, isAdmin] = await Promise.all([getMe(), isUserAdmin()]);

  if (!me) {
    redirect("/not-found");
  }

  const d1 = await getTotalWatchTime({
    serverId: server.id,
    userId: isAdmin ? undefined : me.id,
    startDate,
    endDate,
  });

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="text-sm font-medium">
          <p className="text-neutral-500">Total Watch Time</p>
        </CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-start">
          <p className="text-3xl font-bold">{formatDuration(d1)}</p>
          <p className="text-sm text-muted-foreground">
            Total time spent watching in selected period
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalWatchTime;
