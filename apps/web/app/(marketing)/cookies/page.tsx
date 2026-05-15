import type { Metadata } from "next";
import { LegalPageShell } from "../_components/LegalPageShell";
import { legalPages, marketingBackLink } from "../_data/legal";

export const metadata: Metadata = legalPages.cookies.metadata;

export default function CookiesPage() {
  return (
    <LegalPageShell
      {...legalPages.cookies}
      backLink={marketingBackLink}
    />
  );
}
