import { NextResponse } from 'next/server';
import { getAdminClient } from '../../../lib/supabase/admin';
import { assertSameOrigin } from '../../../lib/admin-auth';

export const dynamic = 'force-dynamic';

type Reaction = 'like' | 'dislike';

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function normaliseIds(value: string | null) {
  return [...new Set((value || '').split(',').map(Number).filter(Number.isInteger).filter(id => id > 0))].slice(0, 100);
}

export async function GET(request: Request) {
  const ids = normaliseIds(new URL(request.url).searchParams.get('ids'));
  if (!ids.length) return json([]);

  try {
    const supabase = getAdminClient();
    const [{ data: courses, error: courseError }, { data: reactions, error: reactionError }] = await Promise.all([
      supabase.from('course_catalogue').select('id,initial_likes,initial_dislikes').in('id', ids).eq('is_published', true),
      supabase.from('course_reactions').select('course_id,reaction').in('course_id', ids),
    ]);
    if (courseError) throw courseError;
    if (reactionError) throw reactionError;

    const counts = new Map<number, { likes: number; dislikes: number }>();
    for (const course of courses || []) {
      counts.set(Number(course.id), { likes: Number(course.initial_likes) || 0, dislikes: Number(course.initial_dislikes) || 0 });
    }
    for (const reaction of reactions || []) {
      const count = counts.get(Number(reaction.course_id));
      if (!count) continue;
      if (reaction.reaction === 'like') count.likes += 1;
      if (reaction.reaction === 'dislike') count.dislikes += 1;
    }

    return json(ids.map(course_id => ({ course_id, likes: counts.get(course_id)?.likes || 0, dislikes: counts.get(course_id)?.dislikes || 0 })));
  } catch {
    return json({ error: 'Unable to load reactions.' }, 500);
  }
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return json({ error: 'Invalid origin.' }, 403);

  try {
    const body = await request.json();
    const courseId = Number(body.course_id);
    const reaction = String(body.reaction || '') as Reaction;
    const sessionId = String(body.session_id || '');

    if (!Number.isInteger(courseId) || courseId <= 0) return json({ error: 'Invalid course id.' }, 400);
    if (reaction !== 'like' && reaction !== 'dislike') return json({ error: 'Invalid reaction.' }, 400);
    if (sessionId.length < 12 || sessionId.length > 120) return json({ error: 'Invalid session.' }, 400);

    const supabase = getAdminClient();
    const { data: course, error: courseError } = await supabase
      .from('course_catalogue')
      .select('id,initial_likes,initial_dislikes')
      .eq('id', courseId)
      .eq('is_published', true)
      .maybeSingle();
    if (courseError) throw courseError;
    if (!course) return json({ error: 'Course not found.' }, 404);

    const { data: oldReaction, error: oldError } = await supabase
      .from('course_reactions')
      .select('reaction')
      .eq('course_id', courseId)
      .eq('session_id', sessionId)
      .maybeSingle();
    if (oldError) throw oldError;

    if (oldReaction?.reaction === reaction) {
      const { error } = await supabase.from('course_reactions').delete().eq('course_id', courseId).eq('session_id', sessionId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('course_reactions').upsert({
        course_id: courseId,
        session_id: sessionId,
        reaction,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'course_id,session_id' });
      if (error) throw error;
    }

    const { data: reactions, error: countError } = await supabase
      .from('course_reactions')
      .select('reaction,session_id')
      .eq('course_id', courseId);
    if (countError) throw countError;

    let likes = Number(course.initial_likes) || 0;
    let dislikes = Number(course.initial_dislikes) || 0;
    let userReaction: Reaction | null = null;
    for (const item of reactions || []) {
      if (item.reaction === 'like') likes += 1;
      if (item.reaction === 'dislike') dislikes += 1;
      if (item.session_id === sessionId && (item.reaction === 'like' || item.reaction === 'dislike')) userReaction = item.reaction;
    }

    return json([{ course_id: courseId, likes, dislikes, user_reaction: userReaction }]);
  } catch (error) {
    const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message || '') : '';
    return json({ error: message || 'Unable to save reaction.' }, 500);
  }
}
