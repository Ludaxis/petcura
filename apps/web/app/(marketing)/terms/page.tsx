import type { Metadata } from "next";
import { LegalPageShell } from "../_components/LegalPageShell";
import { legalPages, marketingBackLink } from "../_data/legal";

export const metadata: Metadata = legalPages.terms.metadata;

export default function TermsPage() {
  return (
    <LegalPageShell
      {...legalPages.terms}
      backLink={marketingBackLink}
    />
  );
}
