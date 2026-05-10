import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PetCura",
  description: "WhatsApp-native ClientOps inbox for veterinary clinics"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
