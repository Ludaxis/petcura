"use client";

import {
  createTranslator,
  getRequestStatusLabel,
  inboxViewColumns,
  type SupportedLocale
} from "@petcura/shared";
import type { InboxRowData } from "@/lib/inbox/queries";
import type { BoardColumnId, BoardLabels } from "./BoardDndTypes";
import { LazyBoardDndProvider } from "./LazyBoardDndProvider";

/**
 * Client boundary for the board view. Promoted to a client component
 * specifically so the `LazyBoardDndProvider` import below sits inside an
 * existing client module — Turbopack only treats deferred `import()`
 * calls as truly deferred when the call-site is reached via another
 * client module. (A server component importing a client wrapper still
 * walks the wrapper's deferred imports as eager top-level client
 * modules, attributing the dnd-kit bundle to the route's first-load JS.)
 *
 * The `createTranslator` call works equally well on the client; the
 * translation bundle is already shared across all routes in the rootMainFiles
 * bundle. Doing it on the client keeps this boundary tight.
 */

type InboxBoardProps = {
  rows: InboxRowData[];
  locale: SupportedLocale;
};

export function InboxBoard({ rows, locale }: InboxBoardProps) {
  const t = createTranslator(locale);

  const columnLabels = inboxViewColumns.reduce(
    (acc, column) => {
      acc[column.value as BoardColumnId] =
        column.value === "urgent"
          ? t("inbox.board.column.urgent")
          : getRequestStatusLabel(column.labelKey, locale);
      return acc;
    },
    {} as Record<BoardColumnId, string>
  );

  const labels: BoardLabels = {
    columns: columnLabels,
    empty: t("inbox.empty"),
    translation: t("inbox.translation"),
    title: t("inbox.board.title"),
    instructions: t("inbox.board.dnd.instructions"),
    pickedUp: t("inbox.board.dnd.pickedUp"),
    over: t("inbox.board.dnd.over"),
    dropped: t("inbox.board.dnd.dropped"),
    canceled: t("inbox.board.dnd.canceled"),
    error: t("inbox.board.dnd.error"),
    dropHint: t("inbox.board.column.dropHint"),
    cardDragLabel: t("inbox.board.card.dragLabel")
  };

  return (
    <LazyBoardDndProvider
      initialRows={rows}
      locale={locale}
      labels={labels}
    />
  );
}
