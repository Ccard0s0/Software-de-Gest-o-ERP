import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// A instância é criada apenas aqui, uma única vez ao carregar a app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);