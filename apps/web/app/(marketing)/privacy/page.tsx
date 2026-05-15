import type { Metadata } from "next";
import { LegalPageShell } from "../_components/LegalPageShell";
import { legalPages, marketingBackLink } from "../_data/legal";

export const metadata: Metadata = legalPages.privacy.metadata;

export default function PrivacyPage() {
  return (
    <LegalPageShell
      {...legalPages.privacy}
      backLink={marketingBackLink}
    />
  );
}
