"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ComponentProps } from "react";
import type { CommandPalette as CommandPaletteComponent } from "./CommandPalette";

/**
 * Defer-loaded CommandPalette. The cmdk library + theme/streaming logic is a
 * sizeable chunk and clinic staff only need it after the first ⌘K. Until
 * then this wrapper renders nothing.
 *
 * The trigger is the existing `petcura:open-cmdk` window event dispatched
 * from InboxKeyboard and the hidden Playwright test hook.
 * On first event we flip `mounted=true`; the dynamic import fires; the real
 * palette mounts and immediately listens for subsequent events, opening
 * itself the first time it hears one.
 */

type Props = ComponentProps<typeof CommandPaletteComponent>;

const InnerCommandPalette = dynamic(
  () => import("./CommandPalette").then((mod) => mod.CommandPalette),
  { ssr: false }
);

export function LazyCommandPalette(props: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    if (typeof window === "undefined") return;
    const onOpen = () => {
      // Signal to the palette's own effect that it should auto-open on first
      // mount — the lazy wrapper consumed the event before the palette was
      // listening, so the palette can't see this initial dispatch.
      (window as unknown as { __pcCmdkPending?: boolean }).__pcCmdkPending =
        true;
      setMounted(true);
    };
    window.addEventListener("petcura:open-cmdk", onOpen as EventListener);
    return () =>
      window.removeEventListener("petcura:open-cmdk", onOpen as EventListener);
  }, [mounted]);

  if (!mounted) return null;
  return <InnerCommandPalette {...props} />;
}
