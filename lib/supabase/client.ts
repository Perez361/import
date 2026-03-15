// Re-exports the importer client for backwards compatibility.
// All dashboard/importer code that does `import { createClient } from '@/lib/supabase/client'`
// will now get the isolated importer session automatically.
export { createImporterClient as createClient } from './importer-client'
