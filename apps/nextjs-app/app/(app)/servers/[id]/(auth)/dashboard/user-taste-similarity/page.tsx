import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { Container } from "@/components/Container";
import { FormattedDate } from "@/components/FormattedDate";
import { PageTitle } from "@/components/PageTitle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getServer } from "@/lib/db/server";
import { getUserTasteSimilarity } from "@/lib/db/user-taste-similarity";
import { isUserAdmin } from "@/lib/db/users";
import type {
  UserTasteSimilarityCell,
  UserTasteSimilarityPair,
} from "@/lib/user-taste-similarity";
import { cn } from "@/lib/utils";

function formatSimilarity(similarity: number | null): string {
  if (similarity === null) {
    return "N/A";
  }

  return `${Math.round(similarity * 100)}%`;
}

function getSimilarityCellTone(similarity: number | null): {
  className: string;
} {
  if (similarity === null) {
    return {
      className: "bg-muted text-muted-foreground",
    };
  }

  if (similarity === 1) {
    return {
      className: "border-red-700 bg-red-700 text-white",
    };
  }

  if (similarity >= 0.9) {
    return {
      className: "border-purple-700 bg-purple-700 text-white",
    };
  }

  if (similarity >= 0.8) {
    return {
      className: "border-emerald-700 bg-emerald-700 text-white",
    };
  }

  if (similarity >= 0.6) {
    return {
      className: "border-blue-700 bg-blue-700 text-white",
    };
  }

  if (similarity < 0.2) {
    return {
      className: "border-zinc-800 bg-zinc-800 text-white",
    };
  }

  return {
    className: "border-amber-700 bg-amber-700 text-white",
  };
}

function SimilarityCell({ cell }: { cell: UserTasteSimilarityCell }) {
  const tone = getSimilarityCellTone(cell.similarity);

  return (
    <div
      className={cn(
        "flex h-14 min-w-16 items-center justify-center rounded-md border text-xs font-semibold",
        tone.className,
      )}
    >
      {formatSimilarity(cell.similarity)}
    </div>
  );
}

function TopPairRow({
  pair,
  rank,
}: {
  pair: UserTasteSimilarityPair;
  rank: number;
}) {
  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md border px-3 py-2">
      <span className="text-sm text-muted-foreground">{rank}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {pair.leftUserName} + {pair.rightUserName}
        </p>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "border text-white",
          getSimilarityCellTone(pair.similarity).className,
        )}
      >
        {formatSimilarity(pair.similarity)}
      </Badge>
    </div>
  );
}

export default async function UserTasteSimilarityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [server, isAdmin] = await Promise.all([
    getServer({ serverId: id }),
    isUserAdmin(),
  ]);

  if (!server) {
    redirect("/not-found");
  }

  if (!isAdmin) {
    redirect(`/servers/${id}/dashboard`);
  }

  const data = await getUserTasteSimilarity({ serverId: server.id });
  const topPairs = data.pairs.slice(0, 10);
  const strongestPair = data.pairs[0];

  return (
    <Container>
      <PageTitle
        title="User Taste Similarity"
        subtitle="Admin-only comparison of user taste embeddings."
      />

      {data.users.length < 2 ? (
        <Alert>
          <Sparkles />
          <AlertTitle>Not enough user taste profiles</AlertTitle>
          <AlertDescription>
            Generate user embeddings for at least two users before comparing
            taste similarity.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Profiles</CardTitle>
                <CardDescription>Users with taste embeddings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data.users.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Compared Pairs</CardTitle>
                <CardDescription>Unique user combinations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data.pairs.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Closest Match</CardTitle>
                <CardDescription>
                  Highest taste similarity in this server
                </CardDescription>
              </CardHeader>
              <CardContent>
                {strongestPair ? (
                  <div className="flex flex-col gap-1">
                    <p className="truncate text-sm font-medium">
                      {strongestPair.leftUserName} +{" "}
                      {strongestPair.rightUserName}
                    </p>
                    <p className="text-3xl font-bold">
                      {formatSimilarity(strongestPair.similarity)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">N/A</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Taste Matrix</CardTitle>
                <CardDescription>
                  Darker cells mean stronger similarity between two users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 z-10 min-w-40 bg-card">
                          User
                        </TableHead>
                        {data.users.map((user) => (
                          <TableHead
                            key={user.userId}
                            className="min-w-20 text-center"
                          >
                            <span className="block truncate">
                              {user.userName}
                            </span>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.matrix.map((row) => (
                        <TableRow key={row.userId}>
                          <TableCell className="sticky left-0 z-10 min-w-40 bg-card">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">
                                {row.userName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {row.itemCount} items, updated{" "}
                                <FormattedDate
                                  date={row.lastCalculatedAt}
                                  format="date"
                                />
                              </span>
                            </div>
                          </TableCell>
                          {row.cells.map((cell) => (
                            <TableCell
                              key={cell.userId}
                              className="p-2 text-center"
                            >
                              <SimilarityCell cell={cell} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Closest Pairs</CardTitle>
                <CardDescription>
                  Top taste matches by cosine similarity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {topPairs.map((pair, index) => (
                    <TopPairRow
                      key={`${pair.leftUserId}-${pair.rightUserId}`}
                      pair={pair}
                      rank={index + 1}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </Container>
  );
}
