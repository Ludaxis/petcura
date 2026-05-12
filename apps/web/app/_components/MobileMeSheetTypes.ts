import type { SupportedLocale } from "@petcura/shared";
import type { ThemePreference } from "./ThemeToggle";

export type MobileMeSheetLabels = {
  sheetTitle: string;
  signedInAs: string;
  theme: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  language: string;
  profile: string;
  settings: string;
  admin: string;
  help: string;
  helpHref: string;
  signOut: string;
  close: string;
};

export type MobileMeSheetProps = {
  email: string;
  displayName?: string | undefined;
  avatarUrl?: string | null | undefined;
  clinicName?: string | undefined;
  roleLabel: string;
  initials: string;
  locale: SupportedLocale;
  currentPath: string;
  initialTheme: ThemePreference;
  isSuperAdmin: boolean;
  labels: MobileMeSheetLabels;
  signOutAction: (formData: FormData) => void | Promise<void>;
};
