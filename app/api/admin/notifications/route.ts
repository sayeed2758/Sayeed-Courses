import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { assertSameOrigin, requireAdminIdentity } from '../../../../lib/admin-auth';

export const dynamic = 'force-dynamic';

function dbMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message?: unknown }).message || fallback);
  return error instanceof Error ? error.message : fallback;
}

export async function GET() {
  try {
    await requireAdminIdentity();
    const supabase = await createClient();
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ rows: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as Error & { status?: number }).status) || 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : dbMessage(error, 'Unable to load notifications.') }, { status });
  }
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try {
    const admin = await requireAdminIdentity();
    const body = await request.json();
    const payload = { title: String(body.title || '').trim(), body: String(body.body || '').trim(), type: String(body.type || 'info'), is_published: Boolean(body.is_published) };
    if (!payload.title || !payload.body) return NextResponse.json({ error: 'Title and body are required.' }, { status: 400 });
    const supabase = await createClient();
    const { data, error } = await supabase.from('notifications').insert(payload).select('id').single();
    if (error) throw error;
    await supabase.from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'notification.create', entity: 'notifications', entity_id: data?.id ?? null, detail: { title: payload.title } });
    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as Error & { status?: number }).status) || 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : dbMessage(error, 'Unable to create notification.') }, { status });
  }
}

export async function PATCH(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try {
    const admin = await requireAdminIdentity();
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid notification id.' }, { status: 400 });
    const payload = { title: String(body.title || '').trim(), body: String(body.body || '').trim(), type: String(body.type || 'info'), is_published: Boolean(body.is_published), updated_at: new Date().toISOString() };
    if (!payload.title || !payload.body) return NextResponse.json({ error: 'Title and body are required.' }, { status: 400 });
    const supabase = await createClient();
    const { error } = await supabase.from('notifications').update(payload).eq('id', id);
    if (error) throw error;
    await supabase.from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'notification.update', entity: 'notifications', entity_id: id, detail: { title: payload.title } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as Error & { status?: number }).status) || 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : dbMessage(error, 'Unable to update notification.') }, { status });
  }
}

export async function DELETE(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try {
    const admin = await requireAdminIdentity();
    const id = Number(new URL(request.url).searchParams.get('id'));
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid notification id.' }, { status: 400 });
    const supabase = await createClient();
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) throw error;
    await supabase.from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'notification.delete', entity: 'notifications', entity_id: id, detail: {} });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as Error & { status?: number }).status) || 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : dbMessage(error, 'Unable to delete notification.') }, { status });
  }
}
