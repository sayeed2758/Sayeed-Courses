export type LiveNotification = {
  id: string;
  title: string;
  body: string;
  type?: string | null;
  created_at: string;
};

export type LiveVoteState = {
  likes: number;
  dislikes: number;
  userVote: 'like' | 'dislike' | null;
};

export type RemoteVote = LiveVoteState & { course_id: number };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isLiveBackendConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function headers(extra: HeadersInit = {}) {
  return {
    apikey: SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${SUPABASE_ANON_KEY || ''}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function request(path: string, init: RequestInit = {}) {
  if (!isLiveBackendConfigured()) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, { ...init, headers: headers(init.headers), cache: 'no-store' });
    if (!response.ok) return null;
    return response;
  } catch {
    return null;
  }
}

export function getOrCreateSessionId() {
  if (typeof window === 'undefined') return '';
  const key = 'sayeed_courses_session_id_v1';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(key, id);
  return id;
}

export async function fetchReactionCounts(courseIds: number[]) {
  const response = await request('/rest/v1/rpc/get_course_reaction_counts', {
    method: 'POST',
    body: JSON.stringify({ course_ids: courseIds }),
  });
  if (!response) return null;
  const rows = (await response.json()) as Array<{ course_id: number; likes: number; dislikes: number; user_reaction?: 'like' | 'dislike' | null }>;
  return rows.map(row => ({
    course_id: row.course_id,
    likes: row.likes,
    dislikes: row.dislikes,
    userVote: row.user_reaction ?? null,
  }));
}

export async function setRemoteReaction(courseId: number, reaction: 'like' | 'dislike'): Promise<RemoteVote | null> {
  const sessionId = getOrCreateSessionId();
  const response = await request('/rest/v1/rpc/set_course_reaction', {
    method: 'POST',
    body: JSON.stringify({ p_course_id: courseId, p_session_id: sessionId, p_reaction: reaction }),
  });
  if (!response) return null;
  const rows = (await response.json()) as Array<{ course_id: number; likes: number; dislikes: number; user_reaction?: 'like' | 'dislike' | null }>;
  const row = rows[0];
  return row ? {
    course_id: row.course_id,
    likes: row.likes,
    dislikes: row.dislikes,
    userVote: row.user_reaction ?? null,
  } : null;
}

export async function fetchCourseCount() {
  const response = await request('/rest/v1/rpc/get_course_count', { method: 'POST', body: '{}' });
  if (!response) return null;
  const value = await response.json();
  return typeof value === 'number' ? value : Number(value);
}

export async function fetchNotifications(): Promise<LiveNotification[] | null> {
  const response = await request('/rest/v1/notifications?select=id,title,body,type,created_at&order=created_at.desc&limit=30');
  if (!response) return null;
  return (await response.json()) as LiveNotification[];
}
