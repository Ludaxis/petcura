import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<{
    lang?: string | string[];
    customers_error?: string | string[];
    customers_status?: string | string[];
  }>;
};

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CustomersPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const search = new URLSearchParams({ tab: "owners" });
  const lang = param(sp.lang);
  const status = param(sp.customers_status);
  const error = param(sp.customers_error);
  if (lang) search.set("lang", lang);
  if (status) search.set("directory_status", status);
  if (error) search.set("directory_error", error);
  redirect(`/directory?${search.toString()}`);
}
