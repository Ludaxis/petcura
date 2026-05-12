/**
 * Types shared between server-rendered InboxBoard and the lazy-loaded
 * BoardDndProvider. Lives in its own module so the type-only import
 * doesn't pull the dnd-kit-laden component into the route's client
 * module graph.
 */

import type { InboxRowData } from "@/lib/inbox/queries";
import type { SupportedLocale } from "@petcura/shared";

export type BoardColumnId =
  | "new"
  | "urgent"
  | "waiting_staff"
  | "waiting_owner"
  | "resolved";

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

export type BoardDndProviderProps = {
  initialRows: InboxRowData[];
  locale: SupportedLocale;
  formatDateTime: (iso: string) => string;
  labels: BoardLabels;
};
