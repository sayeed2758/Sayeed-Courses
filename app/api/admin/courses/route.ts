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
    const { data, error } = await supabase.from('course_catalogue').select('*').order('id', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ rows: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as Error & { status?: number }).status) || 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : dbMessage(error, 'Unable to load courses.') }, { status });
  }
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try {
    const admin = await requireAdminIdentity();
    const body = await request.json();
    const payload = {
      title: String(body.title || '').trim(),
      category: String(body.category || '').trim(),
      educator: String(body.educator || '').trim() || null,
      price: Number(body.price || 0),
      thumbnail_url: String(body.thumbnail_url || '').trim() || null,
      telegram_url: String(body.telegram_url || '').trim() || null,
      rating: Math.min(5, Math.max(4, Number(body.rating || 4.5))),
      review_count: Math.max(0, Number(body.review_count || 0)),
      is_published: Boolean(body.is_published),
    };
    if (!payload.title || !payload.category || !Number.isFinite(payload.price)) {
      return NextResponse.json({ error: 'Title, category and price are required.' }, { status: 400 });
    }
    const supabase = await createClient();
    const { data, error } = await supabase.from('course_catalogue').insert(payload).select('id').single();
    if (error) throw error;
    await supabase.from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'course.create', entity: 'course_catalogue', entity_id: data?.id ?? null, detail: { title: payload.title } });
    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as Error & { status?: number }).status) || 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : dbMessage(error, 'Unable to create course.') }, { status });
  }
}

export async function PATCH(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try {
    const admin = await requireAdminIdentity();
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid course id.' }, { status: 400 });
    const payload = {
      title: String(body.title || '').trim(),
      category: String(body.category || '').trim(),
      educator: String(body.educator || '').trim() || null,
      price: Number(body.price || 0),
      thumbnail_url: String(body.thumbnail_url || '').trim() || null,
      telegram_url: String(body.telegram_url || '').trim() || null,
      rating: Math.min(5, Math.max(4, Number(body.rating || 4.5))),
      review_count: Math.max(0, Number(body.review_count || 0)),
      is_published: Boolean(body.is_published),
      updated_at: new Date().toISOString(),
    };
    if (!payload.title || !payload.category || !Number.isFinite(payload.price)) return NextResponse.json({ error: 'Title, category and price are required.' }, { status: 400 });
    const supabase = await createClient();
    const { error } = await supabase.from('course_catalogue').update(payload).eq('id', id);
    if (error) throw error;
    await supabase.from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'course.update', entity: 'course_catalogue', entity_id: id, detail: { title: payload.title } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as Error & { status?: number }).status) || 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : dbMessage(error, 'Unable to update course.') }, { status });
  }
}

export async function DELETE(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  try {
    const admin = await requireAdminIdentity();
    const id = Number(new URL(request.url).searchParams.get('id'));
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid course id.' }, { status: 400 });
    const supabase = await createClient();
    const { error } = await supabase.from('course_catalogue').delete().eq('id', id);
    if (error) throw error;
    await supabase.from('admin_audit_log').insert({ admin_user_id: admin.userId, action: 'course.delete', entity: 'course_catalogue', entity_id: id, detail: {} });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as Error & { status?: number }).status) || 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : dbMessage(error, 'Unable to delete course.') }, { status });
  }
}
