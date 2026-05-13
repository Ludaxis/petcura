import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function OwnerRootLayout({ children }: Props) {
  return children;
}
