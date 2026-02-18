# MyShop MVP Foundation

Mobile-first MVP foundation for small sellers and micro businesses to launch a simple storefront quickly.

## Live Goal (Today)
- Deploy a working MVP foundation to Vercel
- Keep architecture compact and iteration-friendly

## Implemented Scope

### Phase A — Scaffold + Landing
- Next.js (App Router + TypeScript) scaffold
- Mobile-first landing page
- Bilingual-ready copy structure (`en` / `pt`) via centralized `copy` object
- Clear MVP disclaimer about local/session-only storage (no backend yet)

### Phase B — Setup + Catalog Skeleton + Preview
- 3-step store setup flow (session persisted)
- Catalog skeleton cards with sample items
- Storefront preview panel with social links
- Pricing/monetization section with explicit **PayPal-ready messaging only**

### Phase C — Push + Deploy
- Repository connected to GitHub
- Deployment expected via Vercel project link (`.vercel/project.json`)

## Important Monetization Note
This MVP **does not execute live payments**.
All payment references are messaging-only, preparing for a future PayPal integration phase.

## Tech
- Next.js 16
- React 19
- Tailwind CSS 4
- TypeScript

## Run Locally
```bash
npm install
npm run dev
```

## Build Check
```bash
npm run build
```

## Repo
`https://github.com/technokingoc/myshop`

## Next Steps (Post-MVP)
1. Add backend/API for persistent stores and catalog
2. Add auth and role-based store owner access
3. Integrate real PayPal checkout/subscriptions (server-side)
4. Add analytics + conversion funnel for storefront visits
