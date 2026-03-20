# ImportFlow PRO

Next.js + Supabase SaaS for mini-importation business management.

## Features
- Dual-role auth (importers/customers) with Supabase SSR + Google OAuth
- Admin dashboard: products, orders, shipments, customers, pre-orders, analytics, finances, storefront customization
- Customer storefronts: `/store/[slug]` with cart, orders, profile
- Mobile-responsive, Tailwind v4, React 19, Zod validation

## Getting Started
```bash
npm install
npm run dev
```
Visit http://localhost:3000

## Deploy
Vercel + Supabase (migrations in `/supabase/migrations/`)

## Architecture
- App Router, server actions
- Supabase Postgres (products/importers/customers/carts/orders)
- Multi-tenancy via store slugs
