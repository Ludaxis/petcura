"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { LayoutGrid, List, Rows3, Rows4 } from "lucide-react";
import { SegmentedControl } from "@petcura/ui";
import type { InboxView } from "@/lib/inbox/queries";

type Density = "comfortable" | "compact";

type Props = {
  view: InboxView;
  density: Density;
  labels: {
    list: string;
    board: string;
    comfortable: string;
    compact: string;
    viewGroup: string;
    densityGroup: string;
  };
};

export function InboxToolbarControls({ view, density, labels }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const update = (next: { view?: InboxView; density?: Density }) => {
    const sp = new URLSearchParams(params.toString());
    if (next.view !== undefined) {
      if (next.view === "list") sp.delete("view");
      else sp.set("view", next.view);
    }
    if (next.density !== undefined) {
      if (next.density === "comfortable") sp.delete("density");
      else sp.set("density", next.density);
    }
    const qs = sp.toString();
    startTransition(() => {
      router.push(qs.length > 0 ? `/inbox?${qs}` : "/inbox", { scroll: false });
    });
  };

  return (
    <div className="flex items-center gap-2">
      <SegmentedControl
        value={view}
        onValueChange={(next: InboxView) => update({ view: next })}
        aria-label={labels.viewGroup}
      >
        <SegmentedControl.Item
          value="list"
          label={labels.list}
          icon={<List aria-hidden="true" size={13} />}
        />
        <SegmentedControl.Item
          value="board"
          label={labels.board}
          icon={<LayoutGrid aria-hidden="true" size={13} />}
        />
      </SegmentedControl>

      <SegmentedControl
        value={density}
        onValueChange={(next: Density) => update({ density: next })}
        aria-label={labels.densityGroup}
        className="hidden sm:inline-flex"
      >
        <SegmentedControl.Item
          value="comfortable"
          label={labels.comfortable}
          icon={<Rows3 aria-hidden="true" size={13} />}
          iconOnly
        />
        <SegmentedControl.Item
          value="compact"
          label={labels.compact}
          icon={<Rows4 aria-hidden="true" size={13} />}
          iconOnly
        />
      </SegmentedControl>
    </div>
  );
}
