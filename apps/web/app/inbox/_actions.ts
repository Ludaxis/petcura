"use server";

import { revalidatePath } from "next/cache";
import { normalizeLocale } from "@petcura/shared";
import { boardMoveSchema } from "@petcura/validation";
import { requireStaffContext } from "@/lib/auth/staff";
import { hasStaffPermission } from "@/lib/auth/permissions";

type ActionResult = { ok: true } | { ok: false; error: string };
type StaffContext = Awaited<ReturnType<typeof requireStaffContext>>;
export type BoardColumn =
  | "new"
  | "urgent"
  | "waiting_staff"
  | "waiting_owner"
  | "resolved";

type BoardMoveError = "not_found" | "forbidden" | "validation" | "internal";
export type BoardMoveResult =
  | { ok: true }
  | { ok: false; error: BoardMoveError };

async function loadRequestForInboxAction(
  ctx: StaffContext,
  requestId: string
) {
  const { data, error } = await ctx.supabase
    .from("requests")
    .select("id, status, assigned_staff_id")
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    return { request: null, error: error.message };
  }

  return { request: data, error: null };
}

function refreshInboxRequest(requestId: string) {
  revalidatePath("/inbox");
  revalidatePath(`/requests/${requestId}`);
}

export async function resolveInboxRequest(
  requestId: string,
  locale?: string
): Promise<ActionResult> {
  const lang = normalizeLocale(locale);
  const ctx = await requireStaffContext(lang, "/inbox");
  if (!hasStaffPermission(ctx, "requests:manage")) {
    return { ok: false, error: "forbidden" };
  }
  const { request, error: loadError } = await loadRequestForInboxAction(
    ctx,
    requestId
  );

  if (loadError) {
    return { ok: false, error: loadError };
  }

  if (!request) {
    return { ok: false, error: "not_found" };
  }

  if (request.status === "resolved") {
    refreshInboxRequest(requestId);
    return { ok: true };
  }

  const { error } = await ctx.supabase
    .from("requests")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", requestId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const { error: eventError } = await ctx.supabase
    .from("request_events")
    .insert({
      clinic_id: ctx.clinic.id,
      request_id: requestId,
      event_type: "resolved",
      actor_type: "staff",
      actor_id: ctx.user.id,
      payload_json: {
        from: request.status,
        to: "resolved",
        staff_id: ctx.membership.id,
        source: "inbox_keyboard"
      }
    });

  if (eventError) {
    return { ok: false, error: eventError.message };
  }

  refreshInboxRequest(requestId);
  return { ok: true };
}

type BulkResult =
  | { ok: true; affected: number }
  | { ok: false; error: string };

/**
 * Bulk-resolve a list of inbox request ids. Mirrors the single-row action's
 * load-then-update shape so the audit trail in `request_events` stays
 * symmetrical: every transition we apply ships its own event row regardless
 * of bulk size. Requests already in `resolved` are skipped silently to keep
 * the affected count truthful.
 *
 * Filter is scoped by clinic_id to stay inside RLS; the IN-list of ids is
 * the only client-supplied surface. We deliberately do not stream a single
 * SQL UPDATE — keeping per-row events readable is worth the extra writes
 * at our request volume.
 */
export async function bulkResolveInboxRequests(
  requestIds: string[],
  locale?: string
): Promise<BulkResult> {
  const lang = normalizeLocale(locale);
  const ctx = await requireStaffContext(lang, "/inbox");
  if (!hasStaffPermission(ctx, "requests:manage")) {
    return { ok: false, error: "forbidden" };
  }
  const ids = Array.from(new Set(requestIds)).filter((value) =>
    typeof value === "string" && value.length > 0
  );
  if (ids.length === 0) return { ok: true, affected: 0 };

  const { data: rows, error: loadError } = await ctx.supabase
    .from("requests")
    .select("id, status, assigned_staff_id")
    .eq("clinic_id", ctx.clinic.id)
    .in("id", ids);

  if (loadError) return { ok: false, error: loadError.message };
  if (!rows || rows.length === 0) return { ok: true, affected: 0 };

  const targets = rows.filter((r) => r.status !== "resolved");
  if (targets.length === 0) {
    refreshInboxRequest(rows[0]?.id ?? "");
    return { ok: true, affected: 0 };
  }

  const targetIds = targets.map((r) => r.id);
  const { error: updateError } = await ctx.supabase
    .from("requests")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("clinic_id", ctx.clinic.id)
    .in("id", targetIds);

  if (updateError) return { ok: false, error: updateError.message };

  const events = targets.map((r) => ({
    clinic_id: ctx.clinic.id,
    request_id: r.id,
    event_type: "resolved" as const,
    actor_type: "staff" as const,
    actor_id: ctx.user.id,
    payload_json: {
      from: r.status,
      to: "resolved",
      staff_id: ctx.membership.id,
      source: "inbox_bulk"
    }
  }));

  const { error: eventError } = await ctx.supabase
    .from("request_events")
    .insert(events);

  if (eventError) return { ok: false, error: eventError.message };

  revalidatePath("/inbox");
  for (const id of targetIds) revalidatePath(`/requests/${id}`);
  return { ok: true, affected: targets.length };
}

/**
 * Bulk-assign a list of inbox request ids to the calling staff member.
 * Same shape as bulkResolveInboxRequests — rows already owned by the
 * caller are skipped to keep `affected` accurate and to avoid duplicate
 * `assigned` events in the timeline.
 */
export async function bulkAssignInboxRequestsToMe(
  requestIds: string[],
  locale?: string
): Promise<BulkResult> {
  const lang = normalizeLocale(locale);
  const ctx = await requireStaffContext(lang, "/inbox");
  if (!hasStaffPermission(ctx, "requests:manage")) {
    return { ok: false, error: "forbidden" };
  }
  const ids = Array.from(new Set(requestIds)).filter((value) =>
    typeof value === "string" && value.length > 0
  );
  if (ids.length === 0) return { ok: true, affected: 0 };

  const { data: rows, error: loadError } = await ctx.supabase
    .from("requests")
    .select("id, status, assigned_staff_id")
    .eq("clinic_id", ctx.clinic.id)
    .in("id", ids);

  if (loadError) return { ok: false, error: loadError.message };
  if (!rows || rows.length === 0) return { ok: true, affected: 0 };

  const targets = rows.filter(
    (r) => r.assigned_staff_id !== ctx.membership.id
  );
  if (targets.length === 0) {
    refreshInboxRequest(rows[0]?.id ?? "");
    return { ok: true, affected: 0 };
  }

  const targetIds = targets.map((r) => r.id);
  const { error: updateError } = await ctx.supabase
    .from("requests")
    .update({ assigned_staff_id: ctx.membership.id })
    .eq("clinic_id", ctx.clinic.id)
    .in("id", targetIds);

  if (updateError) return { ok: false, error: updateError.message };

  const events = targets.map((r) => ({
    clinic_id: ctx.clinic.id,
    request_id: r.id,
    event_type: "assigned" as const,
    actor_type: "staff" as const,
    actor_id: ctx.user.id,
    payload_json: {
      from: r.assigned_staff_id,
      to: ctx.membership.id,
      staff_id: ctx.membership.id,
      source: "inbox_bulk"
    }
  }));

  const { error: eventError } = await ctx.supabase
    .from("request_events")
    .insert(events);

  if (eventError) return { ok: false, error: eventError.message };

  revalidatePath("/inbox");
  for (const id of targetIds) revalidatePath(`/requests/${id}`);
  return { ok: true, affected: targets.length };
}

export async function assignInboxRequestToMe(
  requestId: string,
  locale?: string
): Promise<ActionResult> {
  const lang = normalizeLocale(locale);
  const ctx = await requireStaffContext(lang, "/inbox");
  if (!hasStaffPermission(ctx, "requests:manage")) {
    return { ok: false, error: "forbidden" };
  }
  const { request, error: loadError } = await loadRequestForInboxAction(
    ctx,
    requestId
  );

  if (loadError) {
    return { ok: false, error: loadError };
  }

  if (!request) {
    return { ok: false, error: "not_found" };
  }

  if (request.assigned_staff_id === ctx.membership.id) {
    refreshInboxRequest(requestId);
    return { ok: true };
  }

  const { error } = await ctx.supabase
    .from("requests")
    .update({ assigned_staff_id: ctx.membership.id })
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", requestId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const { error: eventError } = await ctx.supabase
    .from("request_events")
    .insert({
      clinic_id: ctx.clinic.id,
      request_id: requestId,
      event_type: "assigned",
      actor_type: "staff",
      actor_id: ctx.user.id,
      payload_json: {
        from: request.assigned_staff_id,
        to: ctx.membership.id,
        staff_id: ctx.membership.id,
        source: "inbox_keyboard"
      }
    });

  if (eventError) {
    return { ok: false, error: eventError.message };
  }

  refreshInboxRequest(requestId);
  return { ok: true };
}

/**
 * Move a request between board columns by drag-and-drop.
 *
 * The board layout mixes two axes — most columns map to `RequestStatus`, but
 * "Urgent" is an urgency=high lane that leaves status alone. The action picks
 * the axis based on the dropped column and writes a `moved_to_column`
 * request_event with the before/after snapshot so the audit trail records
 * board-driven changes distinctly from keyboard/bulk transitions.
 *
 * Load-then-update mirrors the rest of the inbox actions: we re-read the row
 * inside the clinic scope so RLS is the source of truth for "can this staff
 * see this request" before we touch anything. Idempotent — moving a card to
 * the column it's already in returns { ok: true } without writing events.
 */
export async function moveRequestToColumn(input: {
  requestId: string;
  targetColumn: BoardColumn;
}): Promise<BoardMoveResult> {
  const parsed = boardMoveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation" };
  }

  const { requestId, targetColumn } = parsed.data;
  const ctx = await requireStaffContext("en", "/inbox");
  if (!hasStaffPermission(ctx, "requests:manage")) {
    return { ok: false, error: "forbidden" };
  }

  const { data: request, error: loadError } = await ctx.supabase
    .from("requests")
    .select("id, status, urgency")
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", requestId)
    .maybeSingle();

  if (loadError) return { ok: false, error: "internal" };
  if (!request) return { ok: false, error: "not_found" };

  // Decide which axis the column targets and compute the next row + before/
  // after labels for the event payload. The "Urgent" lane is the only column
  // that flips urgency; everything else moves status.
  const fromColumn: BoardColumn =
    request.status === "resolved"
      ? "resolved"
      : request.urgency === "high"
        ? "urgent"
        : (request.status as BoardColumn);

  if (fromColumn === targetColumn) {
    return { ok: true };
  }

  type RequestUpdate = {
    status?: "new" | "waiting_staff" | "waiting_owner" | "resolved";
    urgency?: "low" | "medium" | "high";
    resolved_at?: string | null;
  };
  let update: RequestUpdate;
  if (targetColumn === "urgent") {
    update = { urgency: "high" };
  } else if (targetColumn === "resolved") {
    update = { status: "resolved", resolved_at: new Date().toISOString() };
  } else {
    // Moving back out of "Resolved" requires clearing resolved_at so the
    // timeline doesn't carry a stale closure timestamp. We also clear it for
    // any non-resolved status transition to stay symmetrical with the existing
    // updateRequestStatus action.
    update = { status: targetColumn, resolved_at: null };
  }

  const { error: updateError } = await ctx.supabase
    .from("requests")
    .update(update)
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", requestId);

  if (updateError) return { ok: false, error: "internal" };

  const { error: eventError } = await ctx.supabase
    .from("request_events")
    .insert({
      clinic_id: ctx.clinic.id,
      request_id: requestId,
      event_type: "moved_to_column",
      actor_type: "staff",
      actor_id: ctx.user.id,
      payload_json: {
        from: fromColumn,
        to: targetColumn,
        previous_status: request.status,
        previous_urgency: request.urgency,
        staff_id: ctx.membership.id,
        source: "inbox_board_dnd"
      }
    });

  if (eventError) return { ok: false, error: "internal" };

  refreshInboxRequest(requestId);
  return { ok: true };
}
