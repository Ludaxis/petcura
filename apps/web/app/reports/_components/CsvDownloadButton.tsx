"use client";

import { Download } from "lucide-react";
import { Button } from "@petcura/ui";

type CsvDownloadButtonProps = {
  filename: string;
  rows: string[][];
  label: string;
};

function escapeCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function CsvDownloadButton({
  filename,
  rows,
  label
}: CsvDownloadButtonProps) {
  const onClick = () => {
    const csv = rows.map((row) => row.map(escapeCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  return (
    <Button type="button" variant="secondary" size="sm" onClick={onClick}>
      <Download aria-hidden="true" size={14} />
      {label}
    </Button>
  );
}
