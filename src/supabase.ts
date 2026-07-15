import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const hasSupabaseConfig = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== "your_supabase_project_url"
);

// Fallback to dummy values to prevent crash if not configured yet
export const supabase = createClient(
  hasSupabaseConfig ? supabaseUrl : "https://dummy-project.supabase.co",
  hasSupabaseConfig ? supabaseAnonKey : "dummy-anon-key"
);
