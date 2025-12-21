import { Container } from "@/components/Container";
import { getServer } from "@/lib/db/server";
import { redirect } from "next/navigation";
import { HolidaySettingsManager } from "../HolidaySettingsManager";

export default async function SeasonalRecommendationsSettings(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const server = await getServer({ serverId: id });
  if (!server) {
    redirect("/setup");
  }

  return (
    <Container className="flex flex-col">
      <h1 className="text-3xl font-bold mb-8">Seasonal Recommendations</h1>

      <div className="space-y-8">
        <HolidaySettingsManager
          serverId={server.id}
          disabledHolidays={server.disabledHolidays || []}
        />
      </div>
    </Container>
  );
}
