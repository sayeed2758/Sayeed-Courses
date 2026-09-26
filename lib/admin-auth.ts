import { createClient as createServerSupabase } from './supabase/server';
import { getAdminClient } from './supabase/admin';

export type AdminIdentity = {
  userId: string;
  email: string;
  role: string;
};

export async function getSignedInUser() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) return null;
  return {
    id: String(data.user.id),
    email: data.user.email || '',
  };
}

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const user = await getSignedInUser();
  if (!user) return null;

  // The allowlist check intentionally uses the server-only Supabase client.
  // This avoids browser-role RLS edge cases while keeping the admin_users table
  // completely inaccessible to public clients.
  let data: { user_id: string; email: string; role: string; is_active: boolean } | null = null;
  try {
    const adminClient = getAdminClient();
    const result = await adminClient
      .from('admin_users')
      .select('user_id,email,role,is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    if (result.error || !result.data) return null;
    data = result.data;
  } catch {
    return null;
  }

  return { userId: String(data.user_id), email: data.email || user.email, role: data.role || 'admin' };
}

export async function requireAdminIdentity() {
  const identity = await getAdminIdentity();
  if (!identity) {
    const error = new Error('ADMIN_FORBIDDEN');
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
  return identity;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}
