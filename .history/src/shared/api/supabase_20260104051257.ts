import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Browser client for client-side operations
 */
export function createClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Server client for server components and API routes
 */
export async function createServerClientFromCookies() {
    const cookieStore = await cookies();

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // Called from Server Component, ignore
                }
            },
        },
    });
}

/**
 * Admin client with service role key (bypasses RLS)
 */
export function createAdminClient() {
    return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

/**
 * Database types (generated from Supabase)
 */
export interface Report {
    id: string;
    user_id: string;
    type: 'planning' | 'daily' | 'weekly' | 'time';
    title: string;
    storage_path: string;
    project_key: string;
    date_from: string | null;
    date_to: string | null;
    created_at: string;
    metadata: Record<string, unknown>;
}
