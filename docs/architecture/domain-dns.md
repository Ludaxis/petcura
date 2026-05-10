# Domain and DNS

## Cloudflare Zone

- Domain: `petcura.app`
- Cloudflare account: Joyixir
- Zone status: active
- Nameservers: `brit.ns.cloudflare.com`, `neil.ns.cloudflare.com`

## Application DNS

- `app.petcura.app`
  - `CNAME cname.vercel-dns.com`
  - DNS-only
  - production app target, added to Vercel project `petcura`

- `staging.petcura.app`
  - `CNAME cname.vercel-dns.com`
  - DNS-only
  - staging app target, added to Vercel project `petcura`

Root `petcura.app` and `www.petcura.app` still point at Namecheap parking. Keep them unchanged until the app experience is ready to become the public root site.

## Email DNS

Namecheap email forwarding records are currently preserved:

- MX records: `eforward1-5.registrar-servers.com`
- SPF TXT: `v=spf1 include:spf.efwd.registrar-servers.com ~all`

Do not remove these until a replacement email provider is configured.

## Supabase Domain

Hosted Supabase currently uses the default project URL:

- `https://uprbtdyibuxrvtahxksf.supabase.co`

Supabase custom domain is not active yet because the Custom Domain add-on is not enabled on the hosted project. Do not create `supabase.petcura.app` DNS until Supabase provides the required verification/target records.
