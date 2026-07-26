import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ybzbuleklawpmmfyqped.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemJ1bGVrbGF3cG1tZnlxcGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNzQxNTcsImV4cCI6MjEwMDY1MDE1N30.2pHpcuWI5hoRG0FjYQ4AXlvpxegrraLDwiKxFeNxxUo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
