import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getRequestLocale } from "@/lib/locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "PetCura",
  description: "WhatsApp-native ClientOps inbox for veterinary clinics"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
