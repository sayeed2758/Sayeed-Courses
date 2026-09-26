import { createClient as createServerSupabase } from './supabase/server';

export type AdminIdentity = {
  userId: string;
  email: string;
  role: string;
};

export async function getSignedInUser() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return {
    id: String(data.claims.sub),
    email: typeof data.claims.email === 'string' ? data.claims.email : '',
  };
}

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const user = await getSignedInUser();
  if (!user) return null;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id,email,role,is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
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
