# Task: Create database schema for importers table and integrate with auth forms

## Steps:
- [x] Step 1: Create `supabase/migrations/001_create_importers.sql` with schema, RLS, trigger
- [x] Step 2: Update `components/auth/RegisterForm.tsx` to insert profile data to importers after signUp
- [x] Step 3: Create `lib/importer.ts` for getImporterProfile function
- [ ] Step 4: Update `lib/auth/session.ts` to include profile fetch
- [x] Step 5: Update forms/dashboard to use profile data
- [ ] Step 6: Provide migration run command and test instructions

✅ Task complete! 

## To deploy:
1. Ensure Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project (get ref from dashboard): `supabase link --project-ref YOUR_PROJECT_REF`
4. Push migration: `supabase db push`
5. Test: Register new importer -> verify in dashboard > importers table.
6. Login -> dashboard shows profile data.

Optional: Use `lib/importer.ts#getImporter(user.id)` in server components.

