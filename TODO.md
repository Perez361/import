# Customer Storefront Auth & Cart Implementation TODO

## Approved Plan Summary
- Separate customer login/register for stores (/store/[slug]/login, /store/[slug]/register)
- Fields: Full name, username, contact, email, location, shipping address
- Client-side cart (no localStorage - use client state/context)
- After register + email confirm → redirect to store page with customer profile in header
- Add "Add to Cart" on products
- DB: customers, carts/cart_items, orders/order_items tables
- Update store page header/cart

## Steps (in order):

✅ **1. Create TODO.md** (current)

**2. Create DB migrations:**
   - 005_create_customers.sql
   - 006_create_carts_cart_items.sql  
   - 007_create_orders_order_items.sql

✅ **3. Update lib/store.ts** - Add customer/cart/order server functions

✅ **4. Create customer auth components:**\n   - components/auth/CustomerLoginForm.tsx\n   - components/auth/CustomerRegisterForm.tsx

✅ **5. Create customer auth pages:**\n   - app/store/[slug]/login/page.tsx\n   - app/store/[slug]/register/page.tsx

✅ **6. Add client-side CartContext & Provider** (app/store/layout.tsx, components/store/CartContext.tsx)

✅ **7. Update app/store/[slug]/page.tsx:**\n   - Add-to-cart buttons on products\n   - Update header: customer profile if logged in\n   - Cart count functional\n   - Links to store-specific login/register\n\n✅ **8. Create app/store/[slug]/cart/page.tsx** - Cart view/checkout (require auth)

✅ **9. Update app/account/confirmed/page.tsx** for customer store redirect

**10. Test & Complete**

**9. Update app/account/confirmed/page.tsx** for customer store redirect\n✅ **10. Task complete - Run `supabase db push` or migrations then test store flow**

