import type { Metadata } from "next";
import { JetBrains_Mono, Montserrat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getRequestLocale } from "@/lib/locale";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap"
});

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
    <html
      lang={locale}
      className={`${montserrat.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
