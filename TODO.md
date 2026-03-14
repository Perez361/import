# Fix Store Session Check Failed (IDB Lock Abort)

## Steps:
- [x] 1. Add retry logic and error suppression for IDB abort in StoreContext.tsx fetchCustomer
- [x] 2. Implement debounce/flag to prevent concurrent calls
- [ ] 3. Add BroadcastChannel for cross-tab coordination
- [x] 4. Update supabase/client.ts auth config (autoRefreshToken: false)
- [ ] 5. Test with importer dashboard + multiple store tabs/customer logins
- [ ] 6. Verify no console errors/toasts, update this TODO

