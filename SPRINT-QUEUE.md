# MyShop Sprint Queue — Roadmap to Production-Grade E-commerce SaaS

## Vision
World-class two-sided marketplace SaaS for SMEs, informal sellers, and customers.
Comparable to: Shopify, Ecwid, Jumia seller tools.
Must be production-ready for real Mozambique merchants.

## Sprint Queue (execute in order)

### Phase 1: Core Commerce Polish (CURRENT)
- [x] **S36: Product Management Premium** — Drag-and-drop image reordering. Image zoom on hover. Variant management (size/color/material). Stock tracking with low-stock alerts. Bulk product actions (activate/deactivate/delete). Product duplication.
- [x] **S37: Order Flow & Tracking** — Order timeline (placed → confirmed → shipped → delivered). Status update with notes. Customer notification on status change. Print order/packing slip. Order search and filters. Refund/cancel flow.
- [x] **S38: Storefront Search & Filters** ✅ — Full-text product search. Filter by price range, category, location, rating. Sort by price/date/popularity. Search suggestions. Mobile filter drawer.
- [x] **S39: Seller Analytics Dashboard** ✅ — Revenue chart (daily/weekly/monthly). Top selling products. Customer demographics. Conversion funnel. Comparison with previous period. Export reports.

### Phase 2: Customer Experience
- [x] **S40: Customer Checkout Flow** ✅ — Cart review → Shipping info → Payment method → Order confirmation. Guest checkout option. Save shipping address. Order summary email. Mobile-optimized checkout.
- [x] **S41: Customer Account Premium** ✅ — Order history with reorder. Wishlist management. Saved addresses. Review management. Account settings.
- [x] **S42: Product Reviews & Ratings** ✅ — Star rating + text review. Photo reviews. Review moderation for sellers. Average rating display. Sort reviews by helpful/recent.
- [x] **S43: Notifications System** ✅ — Deployed 2026-02-19 — In-app notification center. Email notifications (order placed, shipped, delivered). Seller alerts (new order, low stock, new review). Notification preferences.

### Phase 3: Seller Tools
- [x] **S44: Coupon & Promotion Engine** ✅ — Deployed 2026-02-19 — Percentage/fixed discount coupons. Minimum order threshold. Usage limits. Expiration dates. Automatic promotion banners. Flash sale support.
- [x] **S45: Shipping & Delivery** ✅ — Deployed 2026-02-19 20:45 — Shipping zones by location. Flat rate / weight-based / free shipping rules. Delivery time estimates. Pickup option. Multiple shipping methods per store.
- [x] **S46: Seller Onboarding v2** ✅ — Deployed 2026-02-19 — Step-by-step store setup wizard. Product import (CSV). Store customization preview. Business verification flow. First sale checklist.
- [x] **S47: Inventory Management** ✅ — Deployed 2026-02-19 — Stock level tracking. Low stock alerts. Restock reminders. Stock history. Multi-warehouse support (future).

### Phase 4: Platform & Scale
- [x] **S48: Payment Integration** ✅ — Deployed 2026-02-20 — M-Pesa integration (Mozambique). Bank transfer instructions. Payment confirmation flow. Payment status tracking. Revenue settlement.
- [x] **S49: SEO & Performance** ✅ — Deployed 2026-02-20 — Dynamic meta tags per product/store. Structured data (JSON-LD). Sitemap generation. Image optimization (WebP, lazy load). Core Web Vitals optimization. Target Lighthouse 90+.
- [x] **S50: Admin Panel v2** ✅ — Deployed 2026-02-20 — Platform-wide analytics. Seller verification workflow. Content moderation queue. Category/location management UI. Platform fee configuration. User management.
- [x] **S51: Multi-language v2** ✅ — Deployed 2026-02-20 — Complete EN/PT coverage. Seller store language setting. Customer language preference. RTL prep (future).

### Phase 5: Growth & Monetization
- [x] **S52: Subscription Billing** ✅ — Deployed 2026-02-20 — Stripe/payment integration for seller tiers. Free → Pro → Business upgrade flow. Usage metering. Invoice generation. Grace period handling.
- [x] **S53: Store Discovery v2** ✅ — Deployed 2026-02-20 — Featured stores carousel. New arrivals section. Trending products. Location-based recommendations. Category landing pages.
- [ ] **S54: Marketing Tools** — Email marketing for sellers (new product, promotion). Social sharing buttons. Referral program. Affiliate links.
- [ ] **S55: API & Webhooks** — REST API for inventory sync. Order webhook notifications. Product feed export. Integration marketplace prep.

## Design Standards (every sprint)
- Light/white base, restrained accents
- Mobile-first, desktop parity
- EN/PT bilingual
- Lucide icons, no emojis in UI
- Professional e-commerce feel (Shopify quality bar)
- Skeleton loaders, empty states, error boundaries
- Accessible (WCAG AA)
