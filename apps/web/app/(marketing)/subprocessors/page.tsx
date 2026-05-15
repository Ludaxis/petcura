import type { Metadata } from "next";
import { LegalPageShell } from "../_components/LegalPageShell";
import { legalPages, marketingBackLink } from "../_data/legal";

export const metadata: Metadata = legalPages.subprocessors.metadata;

export default function SubprocessorsPage() {
  return (
    <LegalPageShell
      {...legalPages.subprocessors}
      backLink={marketingBackLink}
    />
  );
}
