# Fix Next.js Build Error - Turbopack Supabase Server Import in Client

## Steps:
- [x] 1. Create & fix lib/supabase/server-only.ts (pure server client, TS errors fixed)
- [x] 2. Update lib/store.ts to import from server-only.ts
- [x] 3. Refactor components/store/CartContext.tsx to use client Supabase
- [x] 5. Fixed TypeScript errors in CartContext.tsx

- [ ] 5. Test npm run build
- [ ] 6. Test cart/register functionality
- [ ] 7. Update TODO.md as complete
