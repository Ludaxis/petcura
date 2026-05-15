import "server-only";

import type { Database, Json } from "@petcura/shared";
import type { MarketingLeadStatus } from "@petcura/validation";
import { createAdminClient } from "@/lib/supabase/admin";

type ClinicRow = Pick<
  Database["public"]["Tables"]["clinics"]["Row"],
  "id" | "name" | "slug" | "country" | "timezone" | "locale" | "created_at"
>;

type StaffRow = Pick<
  Database["public"]["Tables"]["clinic_staff"]["Row"],
  "id" | "clinic_id" | "user_id" | "role" | "is_active" | "created_at"
>;

export type AdminStaffMember = StaffRow & {
  email: string;
};

export type AdminClinic = ClinicRow & {
  staff: AdminStaffMember[];
};

type MarketingLeadRow = Pick<
  Database["public"]["Tables"]["marketing_leads"]["Row"],
  | "admin_note"
  | "archived_at"
  | "archived_by"
  | "id"
  | "created_at"
  | "updated_at"
  | "source"
  | "status"
  | "locale"
  | "clinic_name"
  | "contact_name"
  | "work_email"
  | "country"
  | "pms_system"
  | "monthly_request_volume"
  | "message"
  | "consent_given"
  | "last_contacted_at"
  | "last_contacted_by"
>;

export type AdminMarketingLeadEvent = Pick<
  Database["public"]["Tables"]["marketing_lead_events"]["Row"],
  | "id"
  | "lead_id"
  | "actor_id"
  | "actor_email"
  | "action"
  | "payload_json"
  | "created_at"
>;

export type AdminMarketingLead = Omit<MarketingLeadRow, "status"> & {
  status: MarketingLeadStatus;
  events: AdminMarketingLeadEvent[];
};

export type AdminMarketingLeadList = {
  leads: AdminMarketingLead[];
  total: number;
  statusCounts: Record<MarketingLeadStatus | "all", number>;
  countries: string[];
};

export type AdminLeadFilters = {
  status?: MarketingLeadStatus | "all" | undefined;
  query?: string | undefined;
  source?: string | undefined;
  country?: string | undefined;
  includeArchived?: boolean | undefined;
  limit?: number | undefined;
};

export type AdminActivityItem = {
  id: string;
  createdAt: string;
  actorEmail: string | null;
  actorId: string | null;
  action: string;
  entityType: "marketing_lead" | "audit_log";
  entityLabel: string;
  payload: Json;
};

export async function listAuthUserEmails() {
  const admin = createAdminClient();
  const usersById = new Map<string, string>();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000
    });

    if (error) {
      throw new Error(`Could not list auth users: ${error.message}`);
    }

    for (const user of data.users) {
      if (user.email) {
        usersById.set(user.id, user.email);
      }
    }

    if (data.users.length < 1000) {
      break;
    }
  }

  return usersById;
}

export async function listAdminClinics(): Promise<AdminClinic[]> {
  const admin = createAdminClient();

  const [{ data: clinics, error: clinicsError }, { data: staff, error: staffError }] =
    await Promise.all([
      admin
        .from("clinics")
        .select("id, name, slug, country, timezone, locale, created_at")
        .order("created_at", { ascending: true }),
      admin
        .from("clinic_staff")
        .select("id, clinic_id, user_id, role, is_active, created_at")
        .order("created_at", { ascending: true })
    ]);

  if (clinicsError) {
    throw new Error(`Could not list clinics: ${clinicsError.message}`);
  }

  if (staffError) {
    throw new Error(`Could not list clinic staff: ${staffError.message}`);
  }

  const usersById = await listAuthUserEmails();
  const staffByClinic = new Map<string, AdminStaffMember[]>();

  for (const member of staff ?? []) {
    const members = staffByClinic.get(member.clinic_id) ?? [];

    members.push({
      ...member,
      email: usersById.get(member.user_id) ?? member.user_id
    });
    staffByClinic.set(member.clinic_id, members);
  }

  return (clinics ?? []).map((clinic) => ({
    ...clinic,
    staff: staffByClinic.get(clinic.id) ?? []
  }));
}

const leadSelect =
  "id, created_at, updated_at, source, status, locale, clinic_name, contact_name, work_email, country, pms_system, monthly_request_volume, message, consent_given, admin_note, last_contacted_at, last_contacted_by, archived_at, archived_by";
const legacyLeadSelect =
  "id, created_at, source, locale, clinic_name, contact_name, work_email, country, pms_system, monthly_request_volume, message, consent_given";

function normalizeSearchTerm(value: string | undefined) {
  return value?.trim().replace(/[,%]/g, " ").replace(/\s+/g, " ");
}

function isMissingWorkflowSchemaError(error: { message: string }) {
  return /marketing_leads\.(status|updated_at)|marketing_lead_events|does not exist/i.test(
    error.message
  );
}

async function listLegacyMarketingLeads({
  country,
  limit,
  query,
  source,
  status
}: AdminLeadFilters): Promise<AdminMarketingLeadList> {
  const admin = createAdminClient();

  if (status && status !== "all" && status !== "new") {
    return {
      leads: [],
      total: 0,
      statusCounts: {
        all: 0,
        new: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
        archived: 0
      },
      countries: []
    };
  }

  let leadQuery = admin
    .from("marketing_leads")
    .select(legacyLeadSelect, { count: "exact" });

  const searchTerm = normalizeSearchTerm(query);
  if (searchTerm) {
    const pattern = `%${searchTerm}%`;
    leadQuery = leadQuery.or(
      `clinic_name.ilike.${pattern},contact_name.ilike.${pattern},work_email.ilike.${pattern}`
    );
  }

  if (source) {
    leadQuery = leadQuery.eq("source", source);
  }

  if (country) {
    leadQuery = leadQuery.eq("country", country);
  }

  const [{ data, error, count }, { data: countryRows, error: countryError }] =
    await Promise.all([
      leadQuery.order("created_at", { ascending: false }).limit(limit ?? 50),
      admin
        .from("marketing_leads")
        .select("country")
        .order("country", { ascending: true })
    ]);

  if (error) {
    throw new Error(`Could not list marketing leads: ${error.message}`);
  }

  if (countryError) {
    throw new Error(`Could not list marketing lead countries: ${countryError.message}`);
  }

  const leads = (data ?? []).map((lead) => ({
    ...lead,
    admin_note: null,
    archived_at: null,
    archived_by: null,
    events: [],
    last_contacted_at: null,
    last_contacted_by: null,
    status: "new" as const,
    updated_at: lead.created_at
  }));
  const total = count ?? leads.length;

  return {
    leads,
    total,
    statusCounts: {
      all: total,
      new: total,
      contacted: 0,
      qualified: 0,
      converted: 0,
      archived: 0
    },
    countries: Array.from(
      new Set((countryRows ?? []).map((row) => row.country).filter(Boolean))
    )
  };
}

export async function listAdminMarketingLeads({
  status = "all",
  query,
  source,
  country,
  includeArchived = false,
  limit = 50
}: AdminLeadFilters = {}): Promise<AdminMarketingLeadList> {
  const admin = createAdminClient();
  let leadQuery = admin
    .from("marketing_leads")
    .select(leadSelect, { count: "exact" });

  if (status !== "all") {
    leadQuery = leadQuery.eq("status", status);
  } else if (!includeArchived) {
    leadQuery = leadQuery.neq("status", "archived");
  }

  const searchTerm = normalizeSearchTerm(query);
  if (searchTerm) {
    const pattern = `%${searchTerm}%`;
    leadQuery = leadQuery.or(
      `clinic_name.ilike.${pattern},contact_name.ilike.${pattern},work_email.ilike.${pattern}`
    );
  }

  if (source) {
    leadQuery = leadQuery.eq("source", source);
  }

  if (country) {
    leadQuery = leadQuery.eq("country", country);
  }

  const { data, error, count } = await leadQuery
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingWorkflowSchemaError(error)) {
      return listLegacyMarketingLeads({
        country,
        limit,
        query,
        source,
        status
      });
    }

    throw new Error(`Could not list marketing leads: ${error.message}`);
  }

  const leads = data ?? [];
  const leadIds = leads.map((lead) => lead.id);
  const eventsByLead = new Map<string, AdminMarketingLeadEvent[]>();

  if (leadIds.length > 0) {
    const { data: events, error: eventsError } = await admin
      .from("marketing_lead_events")
      .select("id, lead_id, actor_id, actor_email, action, payload_json, created_at")
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false });

    if (eventsError) {
      throw new Error(`Could not list marketing lead events: ${eventsError.message}`);
    }

    for (const event of events ?? []) {
      const items = eventsByLead.get(event.lead_id) ?? [];
      items.push(event);
      eventsByLead.set(event.lead_id, items);
    }
  }

  const [{ data: countRows, error: countError }, { data: countryRows, error: countryError }] =
    await Promise.all([
      admin.from("marketing_leads").select("status"),
      admin
        .from("marketing_leads")
        .select("country")
        .neq("status", "archived")
        .order("country", { ascending: true })
    ]);

  if (countError) {
    throw new Error(`Could not count marketing leads: ${countError.message}`);
  }

  if (countryError) {
    throw new Error(`Could not list marketing lead countries: ${countryError.message}`);
  }

  const statusCounts: AdminMarketingLeadList["statusCounts"] = {
    all: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    archived: 0
  };

  for (const row of countRows ?? []) {
    const rowStatus = row.status as MarketingLeadStatus;
    statusCounts[rowStatus] += 1;
    if (rowStatus !== "archived") {
      statusCounts.all += 1;
    }
  }

  return {
    leads: leads.map((lead) => ({
      ...lead,
      status: lead.status as MarketingLeadStatus,
      events: eventsByLead.get(lead.id) ?? []
    })),
    total: count ?? leads.length,
    statusCounts,
    countries: Array.from(
      new Set((countryRows ?? []).map((row) => row.country).filter(Boolean))
    )
  };
}

export async function listAdminActivity(limit = 60): Promise<AdminActivityItem[]> {
  const admin = createAdminClient();
  const [{ data: leadEvents, error: leadEventsError }, { data: auditLogs, error: auditLogsError }] =
    await Promise.all([
      admin
        .from("marketing_lead_events")
        .select("id, lead_id, actor_id, actor_email, action, payload_json, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      admin
        .from("audit_logs")
        .select("id, actor_id, action, entity_type, entity_id, payload_json, created_at")
        .order("created_at", { ascending: false })
        .limit(limit)
    ]);

  if (leadEventsError && !isMissingWorkflowSchemaError(leadEventsError)) {
    throw new Error(`Could not list marketing lead activity: ${leadEventsError.message}`);
  }

  if (auditLogsError) {
    throw new Error(`Could not list audit activity: ${auditLogsError.message}`);
  }

  const leadItems: AdminActivityItem[] = leadEventsError
    ? []
    : (leadEvents ?? []).map((event) => ({
    id: `lead-${event.id}`,
    createdAt: event.created_at,
    actorEmail: event.actor_email,
    actorId: event.actor_id,
    action: event.action,
    entityType: "marketing_lead",
    entityLabel: event.lead_id,
    payload: event.payload_json
  }));

  const auditItems: AdminActivityItem[] = (auditLogs ?? []).map((event) => ({
    id: `audit-${event.id}`,
    createdAt: event.created_at,
    actorEmail: null,
    actorId: event.actor_id,
    action: event.action,
    entityType: "audit_log",
    entityLabel: `${event.entity_type}${event.entity_id ? ` · ${event.entity_id}` : ""}`,
    payload: event.payload_json
  }));

  return [...leadItems, ...auditItems]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();
  const normalizedEmail = email.toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000
    });

    if (error) {
      throw new Error(`Could not list auth users: ${error.message}`);
    }

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );

    if (match) {
      return match;
    }

    if (data.users.length < 1000) {
      return null;
    }
  }

  return null;
}

export async function ensureAuthUser(email: string) {
  const existingUser = await findAuthUserByEmail(email);

  if (existingUser) {
    return existingUser;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      petcura_source: "admin_bootstrap"
    }
  });

  if (error) {
    throw new Error(`Could not create auth user: ${error.message}`);
  }

  return data.user;
}
