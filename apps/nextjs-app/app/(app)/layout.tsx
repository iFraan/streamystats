"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { VersionBadge } from "@/components/VersionBadge";

type Props = PropsWithChildren;

const queryClient = new QueryClient();

export default function layout({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <VersionBadge />
    </QueryClientProvider>
  );
}
