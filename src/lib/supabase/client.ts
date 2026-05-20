import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ビルド時に環境変数がなくてもエラーにならないようにガード
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : (null as unknown as ReturnType<typeof createClient>); // クライアントサイドでの実行時には必ず存在することを想定
