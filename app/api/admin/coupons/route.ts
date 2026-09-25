import { NextResponse } from 'next/server';
import { getAdminClient } from '../../../../lib/supabase/admin';
import { assertSameOrigin, requireAdminIdentity } from '../../../../lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await requireAdminIdentity(); const { data, error } = await getAdminClient().from('coupons').select('*').order('created_at', { ascending: false }); if (error) throw error; return NextResponse.json({ rows: data || [] }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && 'status' in error ? 'Forbidden' : 'Unable to load coupons.' }, { status: error instanceof Error && 'status' in error ? 403 : 500 }); }
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try { const admin = await requireAdminIdentity(); const body = await request.json(); const code = String(body.code || '').trim().toUpperCase(); const discount = Number(body.discount_percent); if (!code || !Number.isInteger(discount) || discount < 1 || discount > 100) return NextResponse.json({ error: 'Enter a valid code and discount from 1% to 100%.' }, { status: 400 }); const { error } = await getAdminClient().from('coupons').insert({ code, discount_percent: discount, expires_at: body.expires_at || null, is_active: Boolean(body.is_active) }); if (error) throw error; await getAdminClient().from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'coupon.create', entity: 'coupons', detail: { code, discount_percent: discount } }); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && 'status' in error ? 'Forbidden' : error instanceof Error ? error.message : 'Unable to create coupon.' }, { status: error instanceof Error && 'status' in error ? 403 : 500 }); }
}

export async function PATCH(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try { const admin = await requireAdminIdentity(); const body = await request.json(); const id = Number(body.id); const code = String(body.code || '').trim().toUpperCase(); const discount = Number(body.discount_percent); if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid coupon id.' }, { status: 400 }); if (!code || !Number.isInteger(discount) || discount < 1 || discount > 100) return NextResponse.json({ error: 'Enter a valid code and discount from 1% to 100%.' }, { status: 400 }); const { error } = await getAdminClient().from('coupons').update({ code, discount_percent: discount, expires_at: body.expires_at || null, is_active: Boolean(body.is_active), updated_at: new Date().toISOString() }).eq('id', id); if (error) throw error; await getAdminClient().from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'coupon.update', entity: 'coupons', entity_id: id, detail: { code, discount_percent: discount } }); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && 'status' in error ? 'Forbidden' : error instanceof Error ? error.message : 'Unable to update coupon.' }, { status: error instanceof Error && 'status' in error ? 403 : 500 }); }
}

export async function DELETE(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try { const admin = await requireAdminIdentity(); const id = Number(new URL(request.url).searchParams.get('id')); if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid coupon id.' }, { status: 400 }); const { error } = await getAdminClient().from('coupons').delete().eq('id', id); if (error) throw error; await getAdminClient().from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'coupon.delete', entity: 'coupons', entity_id: id, detail: {} }); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && 'status' in error ? 'Forbidden' : error instanceof Error ? error.message : 'Unable to delete coupon.' }, { status: error instanceof Error && 'status' in error ? 403 : 500 }); }
}
