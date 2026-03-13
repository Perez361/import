# Fix Database Error Saving New Customer User

## Plan Breakdown & Progress

### 1. ✅ [DONE] Analysis complete, plan approved

### 2. ✅ [DONE] Created supabase/migrations/008_create_customers_trigger.sql
- Add handle_new_customer_user() function 
- Trigger on auth.users INSERT if metadata.customer=true
- Resolve store_slug -> store_id
- Insert customers row using metadata fields

### 3. ✅ [DONE] Updated CustomerRegisterForm.tsx
- Pass ALL form data in auth.signUp metadata

### 4. Fix lib/auth/user-type.ts getCustomerUser()
- Change .single() to .maybeSingle() to avoid error if no row

### 5. Update app/account/confirmed/page.tsx
- Make store-aware using searchParams store slug
- Proper redirect instructions

### 6. Add client-side getImporterBySlug (optional fallback)
- If trigger insufficient, expose in lib/store client

### 7. Test & Followup
- supabase db push / migration up
- Test full register flow
- Verify customers row created
- Test cart/login post-register

**Next step: Create migration file**

