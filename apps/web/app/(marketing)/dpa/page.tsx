import type { Metadata } from "next";
import { LegalPageShell } from "../_components/LegalPageShell";
import { legalPages, marketingBackLink } from "../_data/legal";

export const metadata: Metadata = legalPages.dpa.metadata;

export default function DpaPage() {
  return (
    <LegalPageShell
      {...legalPages.dpa}
      backLink={marketingBackLink}
    />
  );
}
