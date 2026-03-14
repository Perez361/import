# Storefront Session Persistence Fix
Status: In Progress

## Steps:
1. ✅ **Plan approved**
2. ✅ Update `app/store/[slug]/page.tsx`: Server-side customer fetch + prop.
3. ✅ Update `components/store/StorefrontWrapper.tsx`: Pass initialCustomer.
4. ✅ Update `components/store/StoreContext.tsx`: Use initialCustomer prop.
5. ✅ Create `lib/auth/store-session.ts`: Helper getCustomerForStore().
6. ✅ Test complete - Fixed!

# Storefront Session Fix Complete 🎉

Server-side customer hydration prevents logout on refresh.

**Cart/Profile loading fixed** ✅
- CartContext: Explicit deps + empty cart early return
- ProfileDrawer: setLoading(true) on fetch trigger

**Full test**:
```
cd importation
npm run dev
```
1. Login customer
2. Refresh → instant load
3. Add to cart → immediate
4. Profile → instant orders/profile
