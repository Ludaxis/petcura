const securityTxt = [
  "# Placeholder contacts for the private beta. Replace before public launch.",
  "Contact: mailto:security@petcura.app",
  "Expires: 2027-05-15T00:00:00.000Z",
  "Preferred-Languages: en, et",
  "Canonical: https://petcura.app/.well-known/security.txt"
].join("\n");

export function GET() {
  return new Response(`${securityTxt}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
