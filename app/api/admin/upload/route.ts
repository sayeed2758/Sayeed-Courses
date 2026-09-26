import { NextResponse } from 'next/server';
import { getAdminClient } from '../../../../lib/supabase/admin';
import { assertSameOrigin, requireAdminIdentity } from '../../../../lib/admin-auth';

export const dynamic = 'force-dynamic';

const BUCKET = 'course-thumbnails';
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });

  try {
    const admin = await requireAdminIdentity();
    const form = await request.formData();
    const entry = form.get('file');
    if (!(entry instanceof File)) return NextResponse.json({ error: 'Please select an image.' }, { status: 400 });
    if (!ALLOWED.has(entry.type)) return NextResponse.json({ error: 'Only JPG, PNG, WEBP or GIF images are supported.' }, { status: 400 });
    if (entry.size <= 0 || entry.size > MAX_SIZE) return NextResponse.json({ error: 'Image must be 5 MB or smaller.' }, { status: 400 });

    const supabase = getAdminClient();
    const storage = supabase.storage;

    const bucketCheck = await storage.getBucket(BUCKET);
    if (bucketCheck.error || !bucketCheck.data) {
      const created = await storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: `${MAX_SIZE}B`,
        allowedMimeTypes: [...ALLOWED],
      });
      if (created.error && !/already exists/i.test(created.error.message || '')) throw created.error;
    }

    const extension = entry.type === 'image/jpeg' ? 'jpg' : entry.type.split('/')[1] || 'img';
    const safeName = `course-${crypto.randomUUID()}.${extension}`;
    const { error } = await storage.from(BUCKET).upload(safeName, entry, {
      contentType: entry.type,
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) throw error;

    const { data } = storage.from(BUCKET).getPublicUrl(safeName);
    await supabase.from('admin_audit_log').insert({
      admin_user_id: admin.userId,
      action: 'thumbnail.upload',
      entity: 'course_catalogue',
      entity_id: null,
      detail: { path: safeName, content_type: entry.type },
    });

    return NextResponse.json({ ok: true, url: data.publicUrl }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as Error & { status?: number }).status) || 403 : 500;
    const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message || '') : '';
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : message || 'Unable to upload thumbnail.' }, { status });
  }
}
