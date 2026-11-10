import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

test.skipIf(!process.env.STREAMYSTATS_TEST_DATABASE_URL)(
  "taste profiles isolate overlapping movie and series IDs by server",
  async () => {
    const child = Bun.spawn(
      [
        process.execPath,
        fileURLToPath(
          new URL("./__tests__/user-embedding-job.ts", import.meta.url),
        ),
      ],
      {
        env: {
          ...Bun.env,
          DATABASE_URL: Bun.env.STREAMYSTATS_TEST_DATABASE_URL,
        },
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    if (exitCode !== 0) throw new Error(stdout + stderr);
    expect(stdout).toContain("taste profile regressions passed");
  },
  60_000,
);
