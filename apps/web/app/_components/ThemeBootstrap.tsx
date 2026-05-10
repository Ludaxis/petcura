/**
 * Inline script that runs before paint to flip <html data-theme> when the
 * persisted preference is "system" and the OS is dark. The cookie sets the
 * default for explicit "dark" / "light" via the server. This script only
 * upgrades the system case.
 */
const SCRIPT = `
(function () {
  try {
    var m = document.cookie.match(/(?:^|; )petcura-theme=(light|dark|system)/);
    var pref = m ? m[1] : 'system';
    if (pref === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      return;
    }
    if (pref === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {}
})();
`;

export function ThemeBootstrap() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
      suppressHydrationWarning
    />
  );
}
