import { NextResponse } from 'next/server';
import { getAdminClient } from '../../../../lib/supabase/admin';
import { assertSameOrigin, requireAdminIdentity } from '../../../../lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await requireAdminIdentity(); const { data, error } = await getAdminClient().from('notifications').select('*').order('created_at', { ascending: false }).limit(100); if (error) throw error; return NextResponse.json({ rows: data || [] }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && 'status' in error ? 'Forbidden' : 'Unable to load notifications.' }, { status: error instanceof Error && 'status' in error ? 403 : 500 }); }
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try { const admin = await requireAdminIdentity(); const body = await request.json(); const payload = { title: String(body.title || '').trim(), body: String(body.body || '').trim(), type: String(body.type || 'info'), is_published: Boolean(body.is_published) }; if (!payload.title || !payload.body) return NextResponse.json({ error: 'Title and body are required.' }, { status: 400 }); const { error } = await getAdminClient().from('notifications').insert(payload); if (error) throw error; await getAdminClient().from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'notification.create', entity: 'notifications', detail: { title: payload.title } }); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && 'status' in error ? 'Forbidden' : error instanceof Error ? error.message : 'Unable to create notification.' }, { status: error instanceof Error && 'status' in error ? 403 : 500 }); }
}

export async function PATCH(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try { const admin = await requireAdminIdentity(); const body = await request.json(); const id = Number(body.id); if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid notification id.' }, { status: 400 }); const payload = { title: String(body.title || '').trim(), body: String(body.body || '').trim(), type: String(body.type || 'info'), is_published: Boolean(body.is_published) }; const { error } = await getAdminClient().from('notifications').update(payload).eq('id', id); if (error) throw error; await getAdminClient().from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'notification.update', entity: 'notifications', entity_id: id, detail: { title: payload.title } }); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && 'status' in error ? 'Forbidden' : error instanceof Error ? error.message : 'Unable to update notification.' }, { status: error instanceof Error && 'status' in error ? 403 : 500 }); }
}

export async function DELETE(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try { const admin = await requireAdminIdentity(); const id = Number(new URL(request.url).searchParams.get('id')); if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid notification id.' }, { status: 400 }); const { error } = await getAdminClient().from('notifications').delete().eq('id', id); if (error) throw error; await getAdminClient().from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'notification.delete', entity: 'notifications', entity_id: id, detail: {} }); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && 'status' in error ? 'Forbidden' : error instanceof Error ? error.message : 'Unable to delete notification.' }, { status: error instanceof Error && 'status' in error ? 403 : 500 }); }
}
