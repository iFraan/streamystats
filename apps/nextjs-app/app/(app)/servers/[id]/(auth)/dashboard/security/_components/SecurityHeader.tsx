import { BarChart2 } from "lucide-react";
import { SecuritySyncButton } from "@/components/SecuritySyncButton";

interface SecurityHeaderProps {
  serverId: number;
}

export function SecurityHeader({ serverId }: SecurityHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <BarChart2 className="w-4 h-4" />
      <h1 className="font-bold text-2xl">Security Dashboard</h1>
      <SecuritySyncButton serverId={serverId} />
    </div>
  );
}
