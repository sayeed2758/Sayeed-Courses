import { NextResponse } from 'next/server';
import { getAdminClient } from '../../../../lib/supabase/admin';
import { requireAdminIdentity } from '../../../../lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminIdentity();
    const admin = getAdminClient();
    const [{ count: totalCourses }, { count: publishedCourses }, { count: notifications }, { data: reactions }] = await Promise.all([
      admin.from('course_catalogue').select('*', { count: 'exact', head: true }),
      admin.from('course_catalogue').select('*', { count: 'exact', head: true }).eq('is_published', true),
      admin.from('notifications').select('*', { count: 'exact', head: true }),
      admin.from('course_reactions').select('reaction'),
    ]);
    const likes = (reactions || []).filter(r => r.reaction === 'like').length;
    const dislikes = (reactions || []).filter(r => r.reaction === 'dislike').length;
    return NextResponse.json({ total_courses: totalCourses || 0, published_courses: publishedCourses || 0, notifications: notifications || 0, likes, dislikes });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && 'status' in error ? 'Forbidden' : 'Unable to load stats.' }, { status: error instanceof Error && 'status' in error ? 403 : 500 });
  }
}
