import type { Server } from "@streamystats/database/schema";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserStatsSummary } from "@/lib/db/users";
import { formatDuration } from "@/lib/utils";

function filterAndLimitTopUsers(users: UserStatsSummary[]): UserStatsSummary[] {
  return users
    .filter((u) => u.userId !== "" && u.totalWatchTime > 0)
    .slice(0, 10);
}

export function WatchtimeTopUsersTable({
  server,
  users,
}: {
  server: Server;
  users: UserStatsSummary[];
}) {
  const topUsers = filterAndLimitTopUsers(users);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold">Top Users</CardTitle>
        <p className="text-sm text-muted-foreground">
          Showing the top {topUsers.length} users by watch time
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Watch Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topUsers.length > 0 ? (
              topUsers.map((user, idx) => (
                <TableRow
                  key={user.userId}
                  className="transition-colors duration-200 hover:bg-accent/60"
                >
                  <TableCell className="font-medium text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/servers/${server.id}/users/${user.userId}`}
                      className="transition-colors duration-200 hover:text-primary"
                    >
                      {user.userName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDuration(user.totalWatchTime)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-6 text-muted-foreground"
                >
                  No watch data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
