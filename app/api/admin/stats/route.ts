import { NextResponse } from 'next/server';
import { getAdminClient } from '../../../../lib/supabase/admin';
import { requireAdminIdentity } from '../../../../lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminIdentity();
    const supabase = getAdminClient();
    const [{ count: totalCourses }, { count: publishedCourses }, { count: notifications }, { count: coupons }, { data: reactions }] = await Promise.all([
      supabase.from('course_catalogue').select('*', { count: 'exact', head: true }),
      supabase.from('course_catalogue').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('notifications').select('*', { count: 'exact', head: true }),
      supabase.from('coupons').select('*', { count: 'exact', head: true }),
      supabase.from('course_reactions').select('reaction'),
    ]);
    const likes = (reactions || []).filter(r => r.reaction === 'like').length;
    const dislikes = (reactions || []).filter(r => r.reaction === 'dislike').length;
    return NextResponse.json({ total_courses: totalCourses || 0, published_courses: publishedCourses || 0, notifications: notifications || 0, coupons: coupons || 0, likes, dislikes });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as Error & { status?: number }).status) || 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unable to load stats.' }, { status });
  }
}
