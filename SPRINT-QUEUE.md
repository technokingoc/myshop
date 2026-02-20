# MyShop Sprint Queue — Phase 3 (S56–S73)

> **Platform:** MyShop — Two-sided marketplace SaaS for Mozambique
> **Stack:** Next.js 16, Drizzle ORM + Neon, Tailwind
> **Phase 2 complete:** S36–S55 (20 sprints)
> **This phase:** S56–S73 (18 sprints)
> **Generated:** 2026-02-20

---

## [x] S56 — Seller Onboarding Wizard ✅

**Goal:** Guided first-time store setup flow that converts new users into active sellers.

- [ ] Multi-step wizard UI (progress bar, save/resume)
- [ ] Business info collection (name, category, location, logo upload)
- [ ] Template selection step with live previews
- [ ] "Add your first product" guided flow with inline tips
- [ ] Checklist dashboard ("Complete your store" card with progress %)
- [ ] Auto-publish store when checklist hits 100%
- [ ] PT/EN copy for all wizard steps

**Routes:** `/onboarding`, `/onboarding/[step]`, `/dashboard/setup-checklist`

---

## [x] S57 — Chat/Messaging: Core Infrastructure ✅

**Goal:** Real-time buyer-seller messaging system foundation.

- [ ] Conversations table schema (participants, last_message, unread_count)
- [ ] Messages table (text, timestamps, read receipts, soft delete)
- [ ] WebSocket or SSE connection for real-time delivery
- [ ] Conversation list UI (inbox view, unread badges)
- [ ] Message thread UI (chat bubbles, timestamps, typing indicator)
- [ ] "Message Seller" button on product and store pages
- [ ] Notification hooks (in-app badge count)

**Routes:** `/messages`, `/messages/[conversationId]`

---

## [x] S58 — Chat/Messaging: Order Context & Moderation ✅

**Goal:** Link conversations to orders, add safety features.

- [ ] Attach conversation to order (order inquiry thread)
- [ ] Order card embed in chat (status, items, total)
- [ ] Image/file sharing in messages
- [ ] Report/block user functionality
- [ ] Admin moderation panel for flagged conversations
- [ ] Auto-filter for prohibited content (phone numbers, external links — configurable)
- [ ] Email/push notification for new messages (respecting preferences)

**Routes:** `/admin/moderation/messages`

---

## [x] S59 — Reviews & Ratings v2: Core ✅

**Goal:** Enhanced review system with verified purchases and rich content.

- [ ] "Verified Purchase" badge on reviews (auto-linked to order)
- [ ] Photo/image upload on reviews (up to 5 images)
- [ ] Star breakdown display (5★ bar chart)
- [ ] Helpful/unhelpful voting on reviews
- [ ] Sort/filter reviews (most recent, most helpful, by rating)
- [ ] Review summary stats on product cards
- [ ] Prevent duplicate reviews per order item

**Routes:** `/products/[id]/reviews`, `/account/reviews`

---

## [x] S60 — Reviews & Ratings v2: Seller Responses & Admin ✅

**Goal:** Seller engagement with reviews, admin oversight.

- [ ] Seller response to reviews (single public reply per review)
- [ ] Review notification to seller (new review alert)
- [ ] Admin review moderation (approve, hide, flag)
- [ ] Review analytics for sellers (average rating trend, sentiment)
- [ ] Store rating aggregate (overall seller score)
- [ ] Review request email after order delivery (automated, configurable delay)

**Routes:** `/dashboard/reviews`, `/admin/moderation/reviews`

---

## [x] S61 — Delivery & Shipping: Zones & Calculators ✅

**Goal:** Configurable delivery zones and shipping cost calculation.

- [ ] Delivery zones schema (name, regions/neighborhoods, active flag)
- [ ] Seller delivery zone management UI (add/edit zones on map or list)
- [ ] Shipping rate rules (flat rate, weight-based, distance-based per zone)
- [ ] Free shipping threshold configuration
- [ ] Shipping calculator on product/cart pages
- [ ] "Delivers to your area?" checker with location input
- [ ] Pickup option (collect from store/point)

**Routes:** `/dashboard/shipping`, `/dashboard/shipping/zones`

---

## S62 — Delivery & Shipping: Tracking & Integration

**Goal:** Order tracking and delivery status updates.

- [ ] Order status flow (confirmed → preparing → shipped → in-transit → delivered)
- [ ] Tracking number input by seller
- [ ] Tracking page for buyers (timeline view of status updates)
- [ ] Delivery confirmation by buyer (with optional photo proof)
- [ ] Estimated delivery date display
- [ ] SMS/notification on status changes
- [ ] Admin delivery analytics (average delivery time, issues)

**Routes:** `/orders/[id]/tracking`, `/dashboard/orders/[id]/shipping`

---

## S63 — Inventory Alerts & Stock Management

**Goal:** Proactive inventory management with notifications and suggestions.

- [ ] Low stock threshold setting per product/variant
- [ ] Low stock notification (in-app, email) to seller
- [ ] Out-of-stock auto-hide option (configurable)
- [ ] Restock suggestions based on sales velocity
- [ ] Stock history log (changes over time)
- [ ] Dashboard stock overview (at-risk, out-of-stock, healthy)
- [ ] Bulk stock update from dashboard

**Routes:** `/dashboard/inventory`, `/dashboard/inventory/alerts`

---

## S64 — Bulk Operations: Import/Export

**Goal:** CSV-based bulk product management for efficiency.

- [ ] CSV export of all products (with variants, prices, stock)
- [ ] CSV import with validation and preview (dry-run mode)
- [ ] Column mapping UI for flexible CSV formats
- [ ] Error report for failed rows (downloadable)
- [ ] Bulk image upload via ZIP
- [ ] Import/export history log
- [ ] Template CSV download with sample data

**Routes:** `/dashboard/products/import`, `/dashboard/products/export`

---

## S65 — Bulk Operations: Pricing & Batch Actions

**Goal:** Bulk pricing updates and batch product actions.

- [ ] Bulk price adjustment (% increase/decrease, fixed amount)
- [ ] Bulk category/tag assignment
- [ ] Bulk publish/unpublish/archive
- [ ] Bulk delete with confirmation
- [ ] Select-all with filters (e.g., "all out-of-stock")
- [ ] Background job processing for large batches (progress indicator)
- [ ] Undo/rollback for bulk price changes (within 24h)

**Routes:** `/dashboard/products/bulk`

---

## S66 — Promotions Engine: Flash Sales & Bundles

**Goal:** Time-limited sales and product bundling.

- [ ] Flash sale creation (start/end time, discount %, product selection)
- [ ] Flash sale countdown timer on storefront
- [ ] Flash sale banner/badge on product cards
- [ ] Bundle deals (buy X + Y together, save Z%)
- [ ] Bundle display on product pages ("Frequently bought together")
- [ ] Promotion scheduling (upcoming, active, expired views)
- [ ] Promotion performance analytics (revenue, units sold)

**Routes:** `/dashboard/promotions`, `/dashboard/promotions/new`, `/store/[slug]/sales`

---

## S67 — Promotions Engine: Volume Discounts & Rules

**Goal:** Quantity-based pricing and advanced promotion rules.

- [ ] Volume discount tiers (buy 5+ save 10%, buy 10+ save 20%)
- [ ] Volume pricing display on product pages
- [ ] Stackability rules (can coupon + volume discount combine?)
- [ ] Minimum order value promotions
- [ ] First-time buyer discounts (auto-applied)
- [ ] Promotion conflict resolution (best price wins vs. priority)
- [ ] Promotion usage limits (total redemptions, per-customer)

**Routes:** `/dashboard/promotions/volume`, `/dashboard/promotions/rules`

---

## S68 — Seller Analytics v2: Revenue & Performance

**Goal:** Comprehensive seller dashboards with actionable insights.

- [ ] Revenue dashboard (daily/weekly/monthly charts, YoY comparison)
- [ ] Product performance table (views, conversion rate, revenue per product)
- [ ] Top products & trending products widgets
- [ ] Sales by category/tag breakdown
- [ ] Average order value trend
- [ ] Export analytics as CSV/PDF
- [ ] Date range picker with presets (7d, 30d, 90d, custom)

**Routes:** `/dashboard/analytics`, `/dashboard/analytics/products`

---

## S69 — Seller Analytics v2: Customer Insights

**Goal:** Customer behavior data for sellers.

- [ ] Customer list with purchase history summary
- [ ] Repeat customer rate metric
- [ ] Customer acquisition source tracking (referral, search, direct)
- [ ] Customer segments (new, returning, high-value, at-risk)
- [ ] Geographic distribution of customers (province/city)
- [ ] Peak shopping hours/days heatmap
- [ ] Customer lifetime value estimate

**Routes:** `/dashboard/analytics/customers`

---

## S70 — Payment v2: PayGate & Split Payments

**Goal:** Additional payment methods and advanced payment flows.

- [ ] PayGate integration (card payments via PayGate gateway)
- [ ] Split payment support (part M-Pesa, part card)
- [ ] Payment method selection UI redesign
- [ ] Automatic retry for failed payments
- [ ] Payment receipt generation (PDF)
- [ ] Seller payout improvements (faster settlement, payout history)
- [ ] Admin payment reconciliation dashboard

**Routes:** `/checkout/payment`, `/dashboard/payouts`, `/admin/payments`

---

## S71 — Payment v2: Installments & Buy Now Pay Later

**Goal:** Installment payment option for higher-value purchases.

- [ ] Installment plan configuration (2x, 3x, 4x splits)
- [ ] Installment eligibility rules (min order value, customer history)
- [ ] Installment schedule display at checkout
- [ ] Automatic installment collection (M-Pesa scheduled debits)
- [ ] Installment tracking for buyers (upcoming payments)
- [ ] Overdue payment handling (reminders, grace period)
- [ ] Seller receives full amount upfront (platform absorbs risk)

**Routes:** `/checkout/installments`, `/account/installments`

---

## S72 — Mobile Optimization & PWA

**Goal:** Progressive Web App with offline capabilities.

- [ ] PWA manifest and service worker setup
- [ ] Add to Home Screen prompt (smart banner)
- [ ] Offline catalog browsing (cached products/store pages)
- [ ] Offline cart (sync when back online)
- [ ] Push notifications (order updates, messages, promotions)
- [ ] Touch-optimized UI audit and fixes
- [ ] Image lazy loading and responsive image sets
- [ ] App-like page transitions

**Routes:** `/manifest.json`, service worker at `/sw.js`

---

## S73 — Performance & SEO v2

**Goal:** Core Web Vitals optimization and advanced SEO.

- [ ] Image CDN integration (automatic resizing, WebP/AVIF conversion)
- [ ] Lazy loading for all images and heavy components
- [ ] Bundle analysis and code splitting optimization
- [ ] Core Web Vitals monitoring dashboard (LCP, FID, CLS)
- [ ] Structured data expansion (Product, Offer, Review, FAQ schemas)
- [ ] Dynamic sitemap improvements (priority, change frequency)
- [ ] Prefetching for likely navigation paths
- [ ] Performance budget CI checks

**Routes:** `/admin/performance`

---

## Customer Loyalty (S74 — Overflow/Next Phase)

> Deferred to next phase. Points program and repeat purchase incentives require S68-S69 analytics foundation and S71 payment infrastructure.

---

## Sprint Dependency Map

```
S56 (Onboarding) ──────────────────────────────────────────────┐
S57 (Chat Core) → S58 (Chat Orders/Mod)                       │
S59 (Reviews Core) → S60 (Reviews Seller/Admin)               │
S61 (Shipping Zones) → S62 (Tracking)                         │
S63 (Inventory Alerts) ─── standalone                         │
S64 (Bulk Import) → S65 (Bulk Pricing)                        │
S66 (Flash Sales) → S67 (Volume Discounts)                    │
S68 (Seller Analytics) → S69 (Customer Insights)              │
S70 (PayGate/Split) → S71 (Installments)                      │
S72 (PWA) ─── standalone                                      │
S73 (Performance) ─── standalone                              │
```

## Recommended Execution Order

| Priority | Sprints | Rationale |
|----------|---------|-----------|
| 🔴 High | S56, S57–S58 | Onboarding drives seller growth; messaging is table-stakes for marketplace trust |
| 🟠 Medium-High | S59–S60, S61–S62 | Reviews build buyer confidence; shipping is critical for order completion |
| 🟡 Medium | S63, S64–S65, S66–S67 | Operational efficiency for active sellers |
| 🔵 Foundation | S68–S69 | Data-driven seller success |
| 🟣 Growth | S70–S71 | Payment flexibility drives conversion |
| ⚪ Polish | S72–S73 | Performance and mobile excellence |
