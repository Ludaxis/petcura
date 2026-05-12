import {
  createTranslator,
  getRequestStatusLabel,
  inboxViewColumns,
  type SupportedLocale
} from "@petcura/shared";
import type { InboxRowData } from "@/lib/inbox/queries";
import {
  BoardDndProvider,
  type BoardColumnId,
  type BoardLabels
} from "./BoardDndProvider";

type InboxBoardProps = {
  rows: InboxRowData[];
  locale: SupportedLocale;
  formatDateTime: (iso: string) => string;
};

/**
 * Server-rendered shell around the client DnD board. We resolve every
 * localized string here so the client island stays pure — no translator
 * instantiation in the browser bundle.
 *
 * The five columns are kept in lockstep with `inboxViewColumns` (the shared
 * source of truth) so a future column rename only touches one file.
 */
export function InboxBoard({ rows, locale, formatDateTime }: InboxBoardProps) {
  const t = createTranslator(locale);

  const columnLabels = inboxViewColumns.reduce(
    (acc, column) => {
      acc[column.value as BoardColumnId] = getRequestStatusLabel(
        column.labelKey,
        locale
      );
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
    <BoardDndProvider
      initialRows={rows}
      locale={locale}
      formatDateTime={formatDateTime}
      labels={labels}
    />
  );
}
