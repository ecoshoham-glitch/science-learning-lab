# Deployment

**Nothing is deployed.** Public deployment requires the owner's explicit approval of the exact URL.

## Hosting comparison (2026-10-08)

| | Cloudflare Workers (OpenNext adapter) | Vercel |
| --- | --- | --- |
| Next.js support | Via adapter. Supports App Router, RSC, SSG/SSR/ISR, route handlers, server actions, middleware. **Node.js middleware/proxy not supported yet** | First-party; every feature |
| Next.js 16 `proxy.ts` | Runs only on Node → not supported. We removed our proxy, so not an issue today | Supported |
| Cloudflare's own recommendation | Recommends its new Vinext (1.0, released 2026-09-28) for new apps; OpenNext for existing apps | – |
| Commercial use on free plan | Allowed (100k requests/day free) | Hobby plan is non-commercial only |
| Paid plan | $5/month per account (10M requests included) | $20/month per developer seat |
| Static assets | Free and unlimited | 1 TB/month included on Pro |
| Protected previews | Needs Cloudflare Access (free up to 50 users) | Built in (Vercel Authentication) |
| Simulation sandbox domain | Static hosting, free | Possible, but Cloudflare is the natural fit anyway |

Estimated hosting cost per month: Cloudflare $0 (pilot) to ~$5–10 (10,000 users); Vercel $20 (pilot) to
~$20–50 (10,000 users). Database (Supabase), storage and AI are the same in both options.

## Recommendation

Cloudflare Workers with the OpenNext adapter, on the free plan until traffic requires the $5 plan;
simulation packages on a separate Cloudflare-hosted domain. Conditions:

1. A protected test deployment must pass the full end-to-end suite before we commit.
2. Phase 2 server features (Supabase auth, AI gateway) must avoid Node-only middleware; session refresh
   happens in server components/route handlers.
3. Fallback: if a required Next.js feature fails on Cloudflare, move the app to Vercel Pro (+$15/month);
   the code is host-neutral.

Vinext is promising but only 10 days old as of this writing; re-evaluate in 2027.

## Sources

- Cloudflare: OpenNext guide (supported/unsupported features)
- Next.js blog, "Next.js across platforms" (2026-03-25): stable Adapter API in 16.2
- Cloudflare blog, "Introducing Vinext 1.0" (2026-09-28)
- Vercel and Cloudflare Workers pricing pages and summaries, checked 2026-10-08
