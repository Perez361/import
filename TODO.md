# Fix Store Session Check Failed (IDB Lock Abort)

## Steps:
- [x] 1. Add retry logic and error suppression for IDB abort in StoreContext.tsx fetchCustomer
- [x] 2. Implement debounce/flag to prevent concurrent calls
- [ ] 3. Add BroadcastChannel for cross-tab coordination
- [x] 4. Update supabase/client.ts auth config (autoRefreshToken: false)
- [x] 7. Add proper cache management (next.config.ts headers/experimental)

