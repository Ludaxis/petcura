import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<{
    lang?: string | string[];
    pets_error?: string | string[];
    pets_status?: string | string[];
  }>;
};

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PetsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const search = new URLSearchParams({ tab: "pets" });
  const lang = param(sp.lang);
  const status = param(sp.pets_status);
  const error = param(sp.pets_error);
  if (lang) search.set("lang", lang);
  if (status) search.set("directory_status", status);
  if (error) search.set("directory_error", error);
  redirect(`/directory?${search.toString()}`);
}
