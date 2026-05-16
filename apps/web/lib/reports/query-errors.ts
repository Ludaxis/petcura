type ReportQueryError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
};

export function isMissingOptionalReportTableError(
  error: ReportQueryError,
  tableName: string
) {
  const haystack = [error.code, error.message, error.details]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    haystack.includes(tableName.toLowerCase()) &&
    (haystack.includes("schema cache") ||
      haystack.includes("does not exist") ||
      haystack.includes("relation") ||
      haystack.includes("pgrst205") ||
      haystack.includes("42p01"))
  );
}
