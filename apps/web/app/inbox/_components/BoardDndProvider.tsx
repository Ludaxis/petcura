"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Inbox, Languages } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type ScreenReaderInstructions
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Badge, Panel } from "@petcura/ui";
import {
  getRequestCategoryLabel,
  getUrgencyLabel,
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import type { InboxRowData } from "@/lib/inbox/queries";
import { moveRequestToColumn } from "../_actions";

/**
 * Board kanban with drag-and-drop.
 *
 * The five visible columns mix two domains — status and urgency. "Urgent" is
 * an urgency=high lane that leaves status alone; the other four are status
 * targets. The server action (`moveRequestToColumn`) picks the axis based on
 * the column id so this component only needs to pass the target column name.
 *
 * State strategy:
 *  - The server passes the full sorted row set as `initialRows`. We mirror
 *    that into local `rows` so we can apply optimistic moves before the
 *    server roundtrip lands.
 *  - On drop, we (1) flip the row's status/urgency locally, (2) fire the
 *    action, (3) on success call router.refresh() to pull authoritative
 *    state, (4) on failure restore the pre-drop snapshot.
 *  - We deliberately do not persist within-column ordering — the MVP is
 *    column-to-column movement only; visual reorder inside a column is a
 *    pure optimistic affordance.
 *
 * Accessibility:
 *  - PointerSensor + KeyboardSensor + TouchSensor covers mouse, keyboard,
 *    and touch. The TouchSensor activation constraint of 150ms + 5px keeps
 *    tap-to-navigate (existing <Link> behavior) intact: a quick tap follows
 *    the link; a long-press starts a drag.
 *  - Announcements localized via the i18n bundle. Both `accessibility`
 *    instructions and per-event announcements feed the dnd-kit live region.
 *  - touch-action: none on the card itself so a mid-drag move doesn't
 *    scroll the page.
 */

export type BoardColumnId =
  | "new"
  | "urgent"
  | "waiting_staff"
  | "waiting_owner"
  | "resolved";

const COLUMNS: ReadonlyArray<{ id: BoardColumnId }> = [
  { id: "new" },
  { id: "urgent" },
  { id: "waiting_staff" },
  { id: "waiting_owner" },
  { id: "resolved" }
];

export type BoardLabels = {
  columns: Record<BoardColumnId, string>;
  empty: string;
  translation: string;
  instructions: string;
  pickedUp: string;
  over: string;
  dropped: string;
  canceled: string;
  error: string;
  dropHint: string;
  cardDragLabel: string;
  title: string;
};

type BoardDndProviderProps = {
  initialRows: InboxRowData[];
  locale: SupportedLocale;
  formatDateTime: (iso: string) => string;
  labels: BoardLabels;
};

function fmt(template: string, vars: Record<string, string>) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(v);
  }
  return out;
}

function columnForRow(row: InboxRowData): BoardColumnId {
  if (row.status === "resolved") return "resolved";
  if (row.urgency === "high") return "urgent";
  return row.status as BoardColumnId;
}

/** Apply a target column to a row, returning a new row with the right axis flipped. */
function applyColumnToRow(
  row: InboxRowData,
  target: BoardColumnId
): InboxRowData {
  if (target === "urgent") {
    return { ...row, urgency: "high" };
  }
  if (target === "resolved") {
    return { ...row, status: "resolved" };
  }
  // Status move — clear "high" urgency if it was the only thing pinning the
  // card to the urgent lane, so the optimistic placement matches the server's
  // load-then-update semantics (the server doesn't touch urgency here, but
  // dropping a card from Urgent to e.g. Waiting Staff should visually leave
  // Urgent — i.e. the urgency stays "high" but its visible column flips to
  // the status lane). Therefore: don't touch urgency.
  return { ...row, status: target };
}

export function BoardDndProvider({
  initialRows,
  locale,
  formatDateTime,
  labels
}: BoardDndProviderProps) {
  const router = useRouter();
  const [rows, setRows] = useState<InboxRowData[]>(initialRows);
  // When the server hands us a fresh `initialRows` (after a router.refresh
  // resolves), adopt it as authoritative. Storing the previous reference in
  // state lets us derive the swap during render — the canonical React idiom
  // for resetting derived state on prop change (see "Resetting state on prop
  // change" in the React docs).
  const [lastInitial, setLastInitial] =
    useState<InboxRowData[]>(initialRows);
  if (lastInitial !== initialRows) {
    setLastInitial(initialRows);
    setRows(initialRows);
  }

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<BoardColumnId | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Keep a snapshot of rows at drag start so we can revert on action failure.
  const snapshotRef = useRef<InboxRowData[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }
    }),
    useSensor(TouchSensor, {
      // Long-press: 150ms hold without moving >5px before drag activates. Keeps
      // tap-to-navigate via <Link> intact for short touches.
      activationConstraint: { delay: 150, tolerance: 5 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const rowsByColumn = useMemo(() => {
    const grouped: Record<BoardColumnId, InboxRowData[]> = {
      new: [],
      urgent: [],
      waiting_staff: [],
      waiting_owner: [],
      resolved: []
    };
    for (const row of rows) {
      grouped[columnForRow(row)].push(row);
    }
    return grouped;
  }, [rows]);

  const activeRow = activeId ? rows.find((r) => r.id === activeId) : null;

  const screenReaderInstructions = useMemo<ScreenReaderInstructions>(
    () => ({
      draggable: labels.instructions
    }),
    [labels.instructions]
  );

  const announcements = useMemo<Announcements>(
    () => ({
      onDragStart({ active }: DragStartEvent) {
        const row = rows.find((r) => r.id === active.id);
        if (!row) return undefined;
        return fmt(labels.pickedUp, {
          pet: row.petName,
          column: labels.columns[columnForRow(row)]
        });
      },
      onDragOver({ over }: DragOverEvent) {
        if (!over) return undefined;
        const col = (over.id as string) as BoardColumnId;
        if (!labels.columns[col]) return undefined;
        return fmt(labels.over, { column: labels.columns[col] });
      },
      onDragEnd({ active, over }: DragEndEvent) {
        const row = rows.find((r) => r.id === active.id);
        if (!row) return undefined;
        if (!over) {
          return fmt(labels.canceled, {
            pet: row.petName,
            column: labels.columns[columnForRow(row)]
          });
        }
        const col = (over.id as string) as BoardColumnId;
        return fmt(labels.dropped, {
          pet: row.petName,
          column: labels.columns[col] ?? col
        });
      },
      onDragCancel({ active }: DragCancelEvent) {
        const row = rows.find((r) => r.id === active.id);
        if (!row) return undefined;
        return fmt(labels.canceled, {
          pet: row.petName,
          column: labels.columns[columnForRow(row)]
        });
      }
    }),
    [rows, labels]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setErrorMessage(null);
    snapshotRef.current = null;
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const over = event.over?.id;
    if (typeof over === "string" && COLUMNS.some((c) => c.id === over)) {
      setOverColumn(over as BoardColumnId);
    } else {
      setOverColumn(null);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeRowId = String(event.active.id);
      const target =
        event.over && typeof event.over.id === "string"
          ? (event.over.id as BoardColumnId)
          : null;
      setActiveId(null);
      setOverColumn(null);

      if (!target || !COLUMNS.some((c) => c.id === target)) {
        return;
      }

      const row = rows.find((r) => r.id === activeRowId);
      if (!row) return;
      const fromColumn = columnForRow(row);
      if (fromColumn === target) return;

      // Snapshot for revert, then optimistically flip the card.
      snapshotRef.current = rows;
      setRows((prev) =>
        prev.map((r) =>
          r.id === activeRowId ? applyColumnToRow(r, target) : r
        )
      );

      void (async () => {
        const result = await moveRequestToColumn({
          requestId: activeRowId,
          targetColumn: target
        });
        if (result.ok) {
          // Authoritative refresh — server has revalidated /inbox.
          router.refresh();
          snapshotRef.current = null;
        } else {
          // Revert the optimistic state and surface a toast.
          const snapshot = snapshotRef.current;
          if (snapshot) {
            setRows(snapshot);
          }
          snapshotRef.current = null;
          setErrorMessage(
            fmt(labels.error, { pet: row.petName })
          );
          // Auto-clear the toast after a beat so it doesn't linger.
          setTimeout(() => setErrorMessage(null), 4000);
        }
      })();
    },
    [rows, router, labels.error]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverColumn(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      accessibility={{
        screenReaderInstructions,
        announcements
      }}
    >
      <section
        aria-label={labels.title}
        className="grid gap-4 lg:grid-cols-5"
        data-board-dnd-root
      >
        {COLUMNS.map((column) => (
          <DroppableColumn
            key={column.id}
            columnId={column.id}
            label={labels.columns[column.id]}
            rows={rowsByColumn[column.id]}
            isOver={overColumn === column.id}
            activeId={activeId}
            locale={locale}
            labels={labels}
            formatDateTime={formatDateTime}
          />
        ))}
      </section>
      <DragOverlay dropAnimation={null}>
        {activeRow ? (
          <BoardCard
            row={activeRow}
            locale={locale}
            labels={labels}
            formatDateTime={formatDateTime}
            asOverlay
          />
        ) : null}
      </DragOverlay>
      {errorMessage ? (
        <div
          aria-live="assertive"
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--ink)] shadow-md"
          data-board-dnd-error
        >
          {errorMessage}
        </div>
      ) : null}
    </DndContext>
  );
}

type DroppableColumnProps = {
  columnId: BoardColumnId;
  label: string;
  rows: InboxRowData[];
  isOver: boolean;
  activeId: string | null;
  locale: SupportedLocale;
  labels: BoardLabels;
  formatDateTime: (iso: string) => string;
};

function DroppableColumn({
  columnId,
  label,
  rows,
  isOver,
  activeId,
  locale,
  labels,
  formatDateTime
}: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id: columnId });

  return (
    <Panel
      className={`min-h-80 p-3 transition ${
        isOver
          ? "border-[var(--primary)] bg-[var(--primary-soft)]/40"
          : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Inbox aria-hidden="true" size={16} />
          <h2 className="text-sm font-semibold" id={`board-col-${columnId}`}>
            {label}
          </h2>
        </div>
        <span className="rounded-full bg-[var(--surface-soft)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">
          {rows.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        aria-labelledby={`board-col-${columnId}`}
        className="grid min-h-16 gap-2"
        data-board-column={columnId}
        data-board-column-over={isOver ? "true" : undefined}
      >
        {rows.length === 0 ? (
          <p className="rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-3 text-sm leading-6 text-[var(--muted)]">
            {isOver
              ? fmt(labels.dropHint, { column: label })
              : labels.empty}
          </p>
        ) : null}
        {rows.map((row) => (
          <DraggableBoardCard
            key={row.id}
            row={row}
            locale={locale}
            labels={labels}
            formatDateTime={formatDateTime}
            isActive={activeId === row.id}
          />
        ))}
      </div>
    </Panel>
  );
}

type DraggableBoardCardProps = {
  row: InboxRowData;
  locale: SupportedLocale;
  labels: BoardLabels;
  formatDateTime: (iso: string) => string;
  isActive: boolean;
};

function DraggableBoardCard({
  row,
  locale,
  labels,
  formatDateTime,
  isActive
}: DraggableBoardCardProps) {
  const { setNodeRef, attributes, listeners, isDragging, transform } =
    useDraggable({
      id: row.id,
      data: { column: columnForRow(row) }
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
      }
    : undefined;

  // Drag listeners + a11y attributes live on the wrapping div so we can keep
  // <Link> spotless (Next typings demand exactOptionalPropertyTypes and the
  // dnd-kit listener map carries `undefined`-typed handlers that don't satisfy
  // <Link>'s prop signature). The wrapper is what the KeyboardSensor focuses
  // (it carries tabIndex/role from dnd-kit's attributes), so the keyboard
  // pick-up flow targets the right element. Mouse clicks bubble through to
  // the Link for navigation; the PointerSensor only activates beyond a 6px
  // drag distance, so a plain click still follows the link.
  return (
    <div
      ref={setNodeRef}
      style={{ touchAction: "none", ...style }}
      data-board-card-id={row.id}
      data-board-card-dragging={isDragging ? "true" : undefined}
      className={isDragging || isActive ? "opacity-40" : ""}
      {...attributes}
      {...listeners}
    >
      <BoardCard
        row={row}
        locale={locale}
        labels={labels}
        formatDateTime={formatDateTime}
      />
    </div>
  );
}

type BoardCardProps = {
  row: InboxRowData;
  locale: SupportedLocale;
  labels: BoardLabels;
  formatDateTime: (iso: string) => string;
  asOverlay?: boolean;
};

function BoardCard({
  row,
  locale,
  labels,
  formatDateTime,
  asOverlay
}: BoardCardProps) {
  const className = `group block rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-3 transition hover:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] ${
    asOverlay ? "scale-[1.02] shadow-lg ring-2 ring-[var(--primary)] cursor-grabbing" : "cursor-grab"
  }`;

  const dragLabel = fmt(labels.cardDragLabel, { pet: row.petName });

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{row.petName}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{row.ownerName}</p>
        </div>
        <ArrowUpRight
          aria-hidden="true"
          className="text-[var(--muted)] transition group-hover:text-[var(--primary)]"
          size={16}
        />
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
        {row.preview}
      </p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {formatDateTime(row.updatedAt)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge
          tone={
            row.urgency === "high"
              ? "red"
              : row.urgency === "medium"
                ? "amber"
                : "neutral"
          }
        >
          {getUrgencyLabel(row.urgency, locale)}
        </Badge>
        <Badge tone="neutral">
          {getRequestCategoryLabel(row.category, locale)}
        </Badge>
        {row.ownerLanguage !== locale ? (
          <Badge tone="teal">
            <Languages aria-hidden="true" size={12} />
            {labels.translation}
          </Badge>
        ) : null}
      </div>
    </>
  );

  if (asOverlay) {
    return (
      <div className={className} aria-label={dragLabel}>
        {body}
      </div>
    );
  }

  // Drag listeners live on the wrapping div (DraggableBoardCard); the inner
  // <Link> handles navigation. PointerSensor activates only past 6px drag, so
  // a stationary click still bubbles to the link and follows it.
  return (
    <Link
      href={withLocale(`/requests/${row.id}`, locale)}
      className={className}
      aria-label={dragLabel}
    >
      {body}
    </Link>
  );
}
