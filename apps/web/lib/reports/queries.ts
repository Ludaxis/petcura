import "server-only";

import type { Database, StaffRole } from "@petcura/shared";
import { hasClinicPermission } from "@petcura/shared";
import type { StaffContext } from "@/lib/auth/staff";
import { buildReportsDashboard, createReportRange } from "./metrics";
import { isMissingOptionalReportTableError } from "./query-errors";
import type {
  BuildReportsInput,
  ReportAiMemoryRow,
  ReportAiOutputRow,
  ReportInvoiceRow,
  ReportMessageRow,
  ReportOutboundRow,
  ReportPetRow,
  ReportRequestEventRow,
  ReportRangePreset,
  ReportReminderRow,
  ReportRequestRow,
  ReportVaccinationRow,
  ReportWeightRow
} from "./types";

type Supabase = StaffContext["supabase"];

function asArray<T>(value: T[] | null) {
  return value ?? [];
}

function jsonArray(value: Database["public"]["Tables"]["requests"]["Row"]["risk_flags_json"]) {
  return Array.isArray(value) ? value : [];
}

export async function getReportsDashboard(options: {
  supabase: Supabase;
  clinic: StaffContext["clinic"];
  membership: StaffContext["membership"];
  preset?: ReportRangePreset;
  now?: Date;
}) {
  const range = createReportRange(options.preset ?? "30d", options.now);
  const canViewFinancial = hasClinicPermission(
    options.membership.role as StaffRole,
    "reports:financial"
  );

  const [
    ownersResult,
    petsResult,
    requestsResult,
    requestEventsResult,
    remindersResult,
    vaccinationsResult,
    weightsResult,
    aiOutputsResult,
    aiMemoryResult,
    outboundResult
  ] = await Promise.all([
    options.supabase
      .from("owners")
      .select("id, name, phone, created_at")
      .eq("clinic_id", options.clinic.id)
      .is("deleted_at", null),
    options.supabase
      .from("pets")
      .select("id, owner_id, name, species")
      .eq("clinic_id", options.clinic.id)
      .is("deleted_at", null),
    options.supabase
      .from("requests")
      .select(
        "id, owner_id, pet_id, category, status, urgency, channel, created_at, updated_at, resolved_at, risk_flags_json"
      )
      .eq("clinic_id", options.clinic.id)
      .gte("created_at", range.previousStart)
      .lt("created_at", range.end),
    options.supabase
      .from("request_events")
      .select("id, request_id, event_type, created_at")
      .eq("clinic_id", options.clinic.id)
      .gte("created_at", range.previousStart)
      .lt("created_at", range.end),
    options.supabase
      .from("reminders")
      .select("id, type, status, due_at, sent_at, acknowledged_at, completed_at")
      .eq("clinic_id", options.clinic.id)
      .gte("due_at", range.previousStart)
      .lt("due_at", range.end),
    options.supabase
      .from("vaccinations")
      .select("id, pet_id, vaccine_name, administered_at, next_due_at")
      .eq("clinic_id", options.clinic.id)
      .or("next_due_at.not.is.null,administered_at.not.is.null"),
    options.supabase
      .from("pet_weight_entries")
      .select("id, pet_id, weight_kg, measured_at")
      .eq("clinic_id", options.clinic.id)
      .order("measured_at", { ascending: false })
      .limit(1000),
    options.supabase
      .from("ai_outputs")
      .select("id, kind, status, review_status, accepted, latency_ms, created_at")
      .eq("clinic_id", options.clinic.id)
      .gte("created_at", range.previousStart)
      .lt("created_at", range.end),
    options.supabase
      .from("ai_memory_items")
      .select("id, status, created_at")
      .eq("clinic_id", options.clinic.id)
      .gte("created_at", range.previousStart)
      .lt("created_at", range.end),
    options.supabase
      .from("outbound_messages")
      .select(
        "id, channel, source, status, fallback_of_outbound_message_id, created_at"
      )
      .eq("clinic_id", options.clinic.id)
      .gte("created_at", range.previousStart)
      .lt("created_at", range.end)
  ]);

  for (const [name, result] of [
    ["owners", ownersResult],
    ["pets", petsResult],
    ["requests", requestsResult],
    ["request events", requestEventsResult],
    ["reminders", remindersResult],
    ["vaccinations", vaccinationsResult],
    ["pet weight entries", weightsResult],
    ["AI outputs", aiOutputsResult],
    ["AI memory", aiMemoryResult],
    ["outbound messages", outboundResult]
  ] as const) {
    if (result.error) {
      throw new Error(`Could not load report ${name}: ${result.error.message}`);
    }
  }

  let invoiceRows: ReportInvoiceRow[] = [];
  if (canViewFinancial) {
    const { data, error } = await options.supabase
      .from("pms_invoice_summaries")
      .select(
        "id, owner_id, pet_id, issued_at, currency, gross_amount_cents, service_category, voided_at"
      )
      .eq("clinic_id", options.clinic.id)
      .gte("issued_at", range.previousStart)
      .lt("issued_at", range.end);

    if (error && isMissingOptionalReportTableError(error, "pms_invoice_summaries")) {
      console.warn(
        "[reports] Optional PMS invoice summaries table is unavailable; financial report panels will render as not connected."
      );
    } else if (error) {
      throw new Error(`Could not load report PMS invoices: ${error.message}`);
    } else {
      invoiceRows = asArray(data).map((row): ReportInvoiceRow => ({
        id: row.id,
        ownerId: row.owner_id,
        petId: row.pet_id,
        issuedAt: row.issued_at,
        currency: row.currency,
        grossAmountCents: row.gross_amount_cents,
        serviceCategory: row.service_category,
        voidedAt: row.voided_at
      }));
    }
  }

  const requestRows = asArray(requestsResult.data).map((row): ReportRequestRow => ({
    id: row.id,
    ownerId: row.owner_id,
    petId: row.pet_id,
    category: row.category,
    status: row.status,
    urgency: row.urgency,
    channel: row.channel,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
    riskFlags: jsonArray(row.risk_flags_json)
  }));

  const requestIds = requestRows.map((request) => request.id);
  let messageRows: ReportMessageRow[] = [];
  if (requestIds.length > 0) {
    const { data, error } = await options.supabase
      .from("messages")
      .select("id, request_id, sender_type, created_at")
      .eq("clinic_id", options.clinic.id)
      .in("request_id", requestIds)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Could not load report messages: ${error.message}`);
    }

    messageRows = asArray(data).map((row) => ({
      id: row.id,
      requestId: row.request_id,
      senderType: row.sender_type,
      createdAt: row.created_at
    }));
  }

  const input: BuildReportsInput = {
    range,
    clinicName: options.clinic.name,
    canViewFinancial,
    owners: asArray(ownersResult.data).map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      createdAt: row.created_at
    })),
    pets: asArray(petsResult.data).map((row): ReportPetRow => ({
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      species: row.species
    })),
    requests: requestRows,
    messages: messageRows,
    requestEvents: asArray(requestEventsResult.data).map(
      (row): ReportRequestEventRow => ({
        id: row.id,
        requestId: row.request_id,
        eventType: row.event_type,
        createdAt: row.created_at
      })
    ),
    reminders: asArray(remindersResult.data).map((row): ReportReminderRow => ({
      id: row.id,
      type: row.type,
      status: row.status,
      dueAt: row.due_at,
      sentAt: row.sent_at,
      acknowledgedAt: row.acknowledged_at,
      completedAt: row.completed_at
    })),
    vaccinations: asArray(vaccinationsResult.data).map(
      (row): ReportVaccinationRow => ({
        id: row.id,
        petId: row.pet_id,
        vaccineName: row.vaccine_name,
        administeredAt: row.administered_at,
        nextDueAt: row.next_due_at
      })
    ),
    weights: asArray(weightsResult.data).map((row): ReportWeightRow => ({
      id: row.id,
      petId: row.pet_id,
      weightKg: Number(row.weight_kg),
      measuredAt: row.measured_at
    })),
    aiOutputs: asArray(aiOutputsResult.data).map((row): ReportAiOutputRow => ({
      id: row.id,
      kind: row.kind,
      status: row.status,
      reviewStatus: row.review_status,
      accepted: row.accepted,
      latencyMs: row.latency_ms,
      createdAt: row.created_at
    })),
    aiMemoryItems: asArray(aiMemoryResult.data).map(
      (row): ReportAiMemoryRow => ({
        id: row.id,
        status: row.status,
        createdAt: row.created_at
      })
    ),
    outboundMessages: asArray(outboundResult.data).map(
      (row): ReportOutboundRow => ({
        id: row.id,
        channel: row.channel,
        source: row.source,
        status: row.status,
        fallbackOfOutboundMessageId: row.fallback_of_outbound_message_id,
        createdAt: row.created_at
      })
    ),
    invoices: invoiceRows
  };

  return buildReportsDashboard(input);
}
