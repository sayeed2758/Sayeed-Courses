import { NextResponse } from 'next/server';
import { getAdminClient } from '../../../../lib/supabase/admin';
import { assertSameOrigin, requireAdminIdentity } from '../../../../lib/admin-auth';

export const dynamic = 'force-dynamic';

function dbMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message?: unknown }).message || fallback);
  return error instanceof Error ? error.message : fallback;
}

export async function GET() {
  try {
    await requireAdminIdentity();
    const supabase = getAdminClient();
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ rows: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as Error & { status?: number }).status) || 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : dbMessage(error, 'Unable to load coupons.') }, { status });
  }
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try {
    const admin = await requireAdminIdentity();
    const body = await request.json();
    const code = String(body.code || '').trim().toUpperCase();
    const discount = Number(body.discount_percent);
    if (!code || code.length > 64 || !Number.isInteger(discount) || discount < 1 || discount > 100) return NextResponse.json({ error: 'Enter a valid coupon code and discount from 1% to 100%.' }, { status: 400 });
    const supabase = getAdminClient();
    const { data, error } = await supabase.from('coupons').insert({ code, discount_percent: discount, expires_at: body.expires_at || null, is_active: Boolean(body.is_active) }).select('id').single();
    if (error) {
      if (String((error as { code?: unknown }).code || '') === '23505') return NextResponse.json({ error: 'Coupon code already exists.' }, { status: 409 });
      throw error;
    }
    await supabase.from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'coupon.create', entity: 'coupons', entity_id: data?.id ?? null, detail: { code, discount_percent: discount } });
    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as Error & { status?: number }).status) || 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : dbMessage(error, 'Unable to create coupon.') }, { status });
  }
}

export async function PATCH(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try {
    const admin = await requireAdminIdentity();
    const body = await request.json();
    const id = Number(body.id);
    const code = String(body.code || '').trim().toUpperCase();
    const discount = Number(body.discount_percent);
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid coupon id.' }, { status: 400 });
    if (!code || code.length > 64 || !Number.isInteger(discount) || discount < 1 || discount > 100) return NextResponse.json({ error: 'Enter a valid coupon code and discount from 1% to 100%.' }, { status: 400 });
    const supabase = getAdminClient();
    const { error } = await supabase.from('coupons').update({ code, discount_percent: discount, expires_at: body.expires_at || null, is_active: Boolean(body.is_active), updated_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      if (String((error as { code?: unknown }).code || '') === '23505') return NextResponse.json({ error: 'Coupon code already exists.' }, { status: 409 });
      throw error;
    }
    await supabase.from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'coupon.update', entity: 'coupons', entity_id: id, detail: { code, discount_percent: discount } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as Error & { status?: number }).status) || 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : dbMessage(error, 'Unable to update coupon.') }, { status });
  }
}

export async function DELETE(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try {
    const admin = await requireAdminIdentity();
    const id = Number(new URL(request.url).searchParams.get('id'));
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid coupon id.' }, { status: 400 });
    const supabase = getAdminClient();
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;
    await supabase.from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'coupon.delete', entity: 'coupons', entity_id: id, detail: {} });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as Error & { status?: number }).status) || 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : dbMessage(error, 'Unable to delete coupon.') }, { status });
  }
}
