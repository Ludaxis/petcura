"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  MoreHorizontal,
  PanelRightOpen,
  Save,
  Sparkles
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import type { Json, SupportedLocale } from "@petcura/shared";
import type { MarketingLeadStatus } from "@petcura/validation";
import { Badge, Button, cn } from "@petcura/ui";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  archiveMarketingLeads,
  recordMarketingLeadReplyHandoff,
  saveMarketingLeadAdminNote,
  updateMarketingLeadStatus
} from "../actions";

type LeadEvent = {
  id: string;
  action: string;
  actor_id: string | null;
  actor_email: string | null;
  created_at: string;
  payload_json: Json;
};

export type AdminLeadTableLead = {
  id: string;
  created_at: string;
  updated_at: string;
  source: string;
  status: MarketingLeadStatus;
  locale: string;
  clinic_name: string;
  contact_name: string;
  work_email: string;
  country: string;
  pms_system: string | null;
  monthly_request_volume: string | null;
  message: string | null;
  consent_given: boolean;
  admin_note: string | null;
  last_contacted_at: string | null;
  archived_at: string | null;
  events: LeadEvent[];
};

type Labels = {
  selected: string;
  reply: string;
  details: string;
  markContacted: string;
  markQualified: string;
  archive: string;
  copyEmails: string;
  convert: string;
  adminNote: string;
  saveNote: string;
  events: string;
  noEvents: string;
  updated: string;
  status: string;
  source: string;
  country: string;
  contact: string;
  pms: string;
  volume: string;
  message: string;
  consent: string;
  notProvided: string;
  actionDone: string;
  actionFailed: string;
  emailsCopied: string;
  archiveConfirm: string;
  statusNew: string;
  statusContacted: string;
  statusQualified: string;
  statusConverted: string;
  statusArchived: string;
};

type Props = {
  leads: AdminLeadTableLead[];
  locale: SupportedLocale;
  labels: Labels;
};

const statusTones: Record<MarketingLeadStatus, "neutral" | "teal" | "amber" | "red"> =
  {
    new: "amber",
    contacted: "teal",
    qualified: "teal",
    converted: "neutral",
    archived: "neutral"
  };

function statusLabel(status: MarketingLeadStatus, labels: Labels) {
  const map = {
    new: labels.statusNew,
    contacted: labels.statusContacted,
    qualified: labels.statusQualified,
    converted: labels.statusConverted,
    archived: labels.statusArchived
  } satisfies Record<MarketingLeadStatus, string>;

  return map[status];
}

function formatLeadValue(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return value.replaceAll("_", " ");
}

function makeMailto(lead: AdminLeadTableLead) {
  const subject = `PetCura pilot demo for ${lead.clinic_name}`;
  const body = [
    `Hi ${lead.contact_name},`,
    "",
    "Thanks for requesting a PetCura pilot demo.",
    "I would be happy to learn more about your clinic workflow and WhatsApp intake fit.",
    "",
    "Best,"
  ].join("\n");

  return `mailto:${lead.work_email}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

function convertHref(lead: AdminLeadTableLead, locale: SupportedLocale) {
  const params = new URLSearchParams({
    lang: locale,
    tab: "clinics",
    prefillClinicName: lead.clinic_name,
    prefillCountry: lead.country,
    prefillLeadId: lead.id
  });

  return `/admin?${params.toString()}`;
}

function renderPayload(payload: Json) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "";
  }

  return Object.entries(payload)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

export function AdminLeadTable({
  leads,
  locale,
  labels
}: Props) {
  const router = useRouter();
  const [selectedState, setSelected] = useState<Set<string>>(() => new Set());
  const [activeLead, setActiveLead] = useState<AdminLeadTableLead | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleLeadIds = useMemo(() => new Set(leads.map((lead) => lead.id)), [leads]);
  const selected = useMemo(() => {
    if (selectedState.size === 0) return selectedState;
    return new Set(Array.from(selectedState).filter((id) => visibleLeadIds.has(id)));
  }, [selectedState, visibleLeadIds]);
  const selectedLeads = useMemo(
    () => leads.filter((lead) => selected.has(lead.id)),
    [leads, selected]
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short"
      }),
    [locale]
  );
  const allSelected = leads.length > 0 && selected.size === leads.length;
  const someSelected = selected.size > 0 && !allSelected;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  const toggleLead = (leadId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const openLead = (lead: AdminLeadTableLead) => {
    setActiveLead(lead);
    setNoteDraft(lead.admin_note ?? "");
  };

  const selectAll = () => {
    setSelected(allSelected ? new Set() : new Set(leads.map((lead) => lead.id)));
  };

  const runStatus = (leadIds: string[], status: "contacted" | "qualified") => {
    startTransition(async () => {
      const result = await updateMarketingLeadStatus(leadIds, status, locale);
      if (result.ok) {
        showToast(labels.actionDone.replace("{count}", String(result.affected)));
        clearSelection();
        router.refresh();
      } else {
        showToast(labels.actionFailed);
      }
    });
  };

  const runArchive = (leadIds: string[]) => {
    if (!window.confirm(labels.archiveConfirm)) return;
    startTransition(async () => {
      const result = await archiveMarketingLeads(leadIds, locale);
      if (result.ok) {
        showToast(labels.actionDone.replace("{count}", String(result.affected)));
        clearSelection();
        router.refresh();
      } else {
        showToast(labels.actionFailed);
      }
    });
  };

  const runReply = (lead: AdminLeadTableLead) => {
    startTransition(async () => {
      const result = await recordMarketingLeadReplyHandoff(lead.id, locale);
      if (result.ok) router.refresh();
    });
  };

  const saveNote = () => {
    if (!activeLead) return;
    startTransition(async () => {
      const result = await saveMarketingLeadAdminNote(
        activeLead.id,
        noteDraft,
        locale
      );
      if (result.ok) {
        showToast(labels.actionDone.replace("{count}", String(result.affected)));
        router.refresh();
      } else {
        showToast(labels.actionFailed);
      }
    });
  };

  const copyEmails = async () => {
    const emails = selectedLeads.map((lead) => lead.work_email).join(", ");
    if (!emails) return;

    try {
      await navigator.clipboard.writeText(emails);
      showToast(labels.emailsCopied);
    } catch {
      showToast(labels.actionFailed);
    }
  };

  return (
    <>
      <div className="divide-y divide-[var(--line)] md:hidden">
        {leads.map((lead) => (
          <article className="grid gap-3 p-4" key={lead.id}>
            <div className="flex items-start gap-3">
              <Checkbox
                aria-label={`${labels.contact}: ${lead.clinic_name}`}
                checked={selected.has(lead.id)}
                className="mt-1"
                onCheckedChange={() => toggleLead(lead.id)}
              />
              <div className="min-w-0 flex-1">
                <div className="break-words font-semibold text-[var(--ink)]">
                  {lead.clinic_name}
                </div>
                <div className="mt-1 break-words text-[12.5px] leading-5 text-[var(--muted)]">
                  {lead.contact_name} · {lead.work_email}
                </div>
              </div>
              <Badge tone={statusTones[lead.status]}>
                {statusLabel(lead.status, labels)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--muted-2)]">
                  {labels.source}
                </div>
                <div className="mt-1 capitalize text-[var(--muted)]">
                  {formatLeadValue(lead.source, labels.notProvided)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--muted-2)]">
                  {labels.country}
                </div>
                <div className="mt-1 text-[var(--muted)]">{lead.country}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--muted-2)]">
                  {labels.pms}
                </div>
                <div className="mt-1 text-[var(--muted)]">
                  {formatLeadValue(lead.pms_system, labels.notProvided)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--muted-2)]">
                  {labels.updated}
                </div>
                <div className="mt-1 text-[var(--muted)]">
                  {dateFormatter.format(new Date(lead.updated_at))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button asChild size="sm" variant="ghost">
                <a href={makeMailto(lead)} onClick={() => runReply(lead)}>
                  <Mail aria-hidden="true" size={14} />
                  {labels.reply}
                </a>
              </Button>
              <Button
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => openLead(lead)}
              >
                <PanelRightOpen aria-hidden="true" size={14} />
                {labels.details}
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[960px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-[11px] uppercase tracking-[0.04em] text-[var(--muted-2)]">
              <th className="w-10 px-4 py-3">
                <Checkbox
                  aria-label={labels.selected.replace("{count}", String(leads.length))}
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={selectAll}
                />
              </th>
              <th className="px-2 py-3">{labels.contact}</th>
              <th className="px-2 py-3">{labels.status}</th>
              <th className="px-2 py-3">{labels.source}</th>
              <th className="px-2 py-3">{labels.country}</th>
              <th className="px-2 py-3">{labels.pms}</th>
              <th className="px-2 py-3 text-right">{labels.volume}</th>
              <th className="px-2 py-3">{labels.updated}</th>
              <th className="px-4 py-3 text-right">{labels.details}</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                data-admin-lead-row
                data-selected={selected.has(lead.id) ? "true" : undefined}
                className="group border-t border-[var(--line)] data-[selected=true]:bg-[var(--primary-soft)]"
              >
                <td className="border-t border-[var(--line)] px-4 py-3">
                  <Checkbox
                    aria-label={`${labels.contact}: ${lead.clinic_name}`}
                    checked={selected.has(lead.id)}
                    onCheckedChange={() => toggleLead(lead.id)}
                  />
                </td>
                <td className="max-w-[260px] border-t border-[var(--line)] px-2 py-3">
                  <div className="font-semibold text-[var(--ink)]">
                    {lead.clinic_name}
                  </div>
                  <div className="mt-1 truncate text-[12.5px] text-[var(--muted)]">
                    {lead.contact_name} · {lead.work_email}
                  </div>
                </td>
                <td className="border-t border-[var(--line)] px-2 py-3">
                  <Badge tone={statusTones[lead.status]}>
                    {statusLabel(lead.status, labels)}
                  </Badge>
                </td>
                <td className="border-t border-[var(--line)] px-2 py-3 capitalize text-[var(--muted)]">
                  {formatLeadValue(lead.source, labels.notProvided)}
                </td>
                <td className="border-t border-[var(--line)] px-2 py-3 text-[var(--muted)]">
                  {lead.country}
                </td>
                <td className="border-t border-[var(--line)] px-2 py-3 text-[var(--muted)]">
                  {formatLeadValue(lead.pms_system, labels.notProvided)}
                </td>
                <td className="border-t border-[var(--line)] px-2 py-3 text-right tabular-nums text-[var(--muted)]">
                  {formatLeadValue(lead.monthly_request_volume, "-")}
                </td>
                <td className="border-t border-[var(--line)] px-2 py-3 text-[12.5px] text-[var(--muted)]">
                  {dateFormatter.format(new Date(lead.updated_at))}
                </td>
                <td className="border-t border-[var(--line)] px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild size="sm" variant="ghost">
                      <a href={makeMailto(lead)} onClick={() => runReply(lead)}>
                        <Mail aria-hidden="true" size={14} />
                        {labels.reply}
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() => openLead(lead)}
                    >
                      <PanelRightOpen aria-hidden="true" size={14} />
                      {labels.details}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label={labels.details}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <MoreHorizontal aria-hidden="true" size={15} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onSelect={() => runStatus([lead.id], "contacted")}
                        >
                          <CheckCircle2 aria-hidden="true" size={14} />
                          {labels.markContacted}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => runStatus([lead.id], "qualified")}
                        >
                          <Sparkles aria-hidden="true" size={14} />
                          {labels.markQualified}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={convertHref(lead, locale)}>
                            <ExternalLink aria-hidden="true" size={14} />
                            {labels.convert}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => runArchive([lead.id])}
                        >
                          <Archive aria-hidden="true" size={14} />
                          {labels.archive}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected.size > 0 ? (
        <div
          className={cn(
            "fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4rem+0.5rem)] z-40 mx-auto flex w-[min(92vw,760px)] flex-wrap items-center gap-2 rounded-[12px] border border-[var(--line)] bg-[var(--paper)] px-3 py-3 shadow-xl md:bottom-4"
          )}
          role="region"
          aria-label={labels.selected.replace("{count}", String(selected.size))}
          aria-busy={isPending}
        >
          <span className="mr-auto font-mono text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[var(--primary-strong)]">
            {labels.selected.replace("{count}", String(selected.size))}
          </span>
          <Button size="sm" type="button" variant="secondary" onClick={copyEmails}>
            <Copy aria-hidden="true" size={14} />
            {labels.copyEmails}
          </Button>
          <Button
            disabled={isPending}
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => runStatus(Array.from(selected), "contacted")}
          >
            {labels.markContacted}
          </Button>
          <Button
            disabled={isPending}
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => runStatus(Array.from(selected), "qualified")}
          >
            {labels.markQualified}
          </Button>
          <Button
            disabled={isPending}
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => runArchive(Array.from(selected))}
          >
            <Archive aria-hidden="true" size={14} />
            {labels.archive}
          </Button>
        </div>
      ) : null}

      <Sheet
        open={Boolean(activeLead)}
        onOpenChange={(open) => {
          if (!open) setActiveLead(null);
        }}
      >
        {activeLead ? (
          <SheetContent
            className="w-full border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] sm:max-w-xl"
            side="right"
          >
            <SheetHeader className="border-b border-[var(--line)] pr-12">
              <SheetTitle className="text-[20px] font-semibold">
                {activeLead.clinic_name}
              </SheetTitle>
              <SheetDescription>
                {activeLead.contact_name} · {activeLead.work_email}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-4 overflow-y-auto px-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.04em] text-[var(--muted-2)]">
                    {labels.status}
                  </div>
                  <div className="mt-1">
                    <Badge tone={statusTones[activeLead.status]}>
                      {statusLabel(activeLead.status, labels)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.04em] text-[var(--muted-2)]">
                    {labels.source}
                  </div>
                  <div className="mt-1 capitalize text-[var(--muted)]">
                    {formatLeadValue(activeLead.source, labels.notProvided)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.04em] text-[var(--muted-2)]">
                    {labels.country}
                  </div>
                  <div className="mt-1 text-[var(--muted)]">{activeLead.country}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.04em] text-[var(--muted-2)]">
                    {labels.updated}
                  </div>
                  <div className="mt-1 text-[var(--muted)]">
                    {dateFormatter.format(new Date(activeLead.updated_at))}
                  </div>
                </div>
              </div>

              <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)] p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--muted-2)]">
                  {labels.message}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
                  {activeLead.message ?? labels.notProvided}
                </p>
                <p className="mt-3 text-xs text-[var(--muted-2)]">
                  {labels.consent} ·{" "}
                  {dateFormatter.format(new Date(activeLead.created_at))}
                </p>
              </div>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--muted-2)]">
                  {labels.adminNote}
                </span>
                <textarea
                  className="mt-2 min-h-28 w-full resize-y rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm leading-6 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
                  maxLength={1200}
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                />
              </label>

              <div>
                <h3 className="text-sm font-semibold text-[var(--ink)]">
                  {labels.events}
                </h3>
                {activeLead.events.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {labels.noEvents}
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {activeLead.events.map((event) => (
                      <div
                        className="rounded-[var(--radius)] border border-[var(--line)] p-3"
                        key={event.id}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold capitalize text-[var(--ink)]">
                            {event.action.replaceAll("_", " ")}
                          </span>
                          <time className="text-xs text-[var(--muted-2)]">
                            {dateFormatter.format(new Date(event.created_at))}
                          </time>
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {event.actor_email ?? event.actor_id ?? "system"}
                        </p>
                        {renderPayload(event.payload_json) ? (
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            {renderPayload(event.payload_json)}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <SheetFooter className="border-t border-[var(--line)]">
              <Button disabled={isPending} type="button" onClick={saveNote}>
                <Save aria-hidden="true" size={15} />
                {labels.saveNote}
              </Button>
            </SheetFooter>
          </SheetContent>
        ) : null}
      </Sheet>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+4rem+0.5rem)] right-4 z-50 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3.5 py-1.5 text-[11.5px] font-medium text-[var(--ink)] shadow-md md:bottom-4"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
