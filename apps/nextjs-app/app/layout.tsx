import type { Metadata } from "next";
import localFont from "next/font/local";
import { basePath } from "@/lib/utils";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import { Suspense } from "react";
import { ServerConnectivityMonitor } from "@/components/ServerConnectivityMonitor";
import { Toaster } from "@/components/ui/sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Streamystats",
  description:
    "A statistics service for Jellyfin, providing analytics and data visualization. 📈",
  manifest: `${basePath}/manifest.json`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader color="#1C4ED8" />
        {children}
        <Toaster richColors expand />
        <Suspense fallback={null}>
          <ServerConnectivityMonitor />
        </Suspense>
      </body>
    </html>
  );
}
