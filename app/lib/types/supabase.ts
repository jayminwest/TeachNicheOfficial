import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/app/types/database';

export type TypedSupabaseClient = SupabaseClient<Database>;
