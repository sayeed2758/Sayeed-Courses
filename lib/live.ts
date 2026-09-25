import { createClient, type RealtimeChannel } from '@supabase/supabase-js';

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
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
let client: ReturnType<typeof createClient> | null = null;

export function isLiveBackendConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

function getClient() {
  if (!isLiveBackendConfigured()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

async function request(path: string, init: RequestInit = {}) {
  if (!isLiveBackendConfigured()) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      ...init,
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY || '',
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY || ''}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return response;
  } catch {
    return null;
  }
}

export function getOrCreateSessionId() {
  if (typeof window === 'undefined') return '';
  const key = 'sayeed_courses_session_id_v2';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(key, id);
  return id;
}

export async function fetchReactionCounts(courseIds: number[]) {
  const sessionId = getOrCreateSessionId();
  const response = await request('/rest/v1/rpc/get_course_reaction_counts', {
    method: 'POST',
    body: JSON.stringify({ course_ids: courseIds, p_session_id: sessionId }),
  });
  if (!response) return null;
  const rows = (await response.json()) as Array<{
    course_id: number;
    likes: number;
    dislikes: number;
    user_reaction?: 'like' | 'dislike' | null;
  }>;
  return rows.map(row => ({
    course_id: Number(row.course_id),
    likes: Number(row.likes) || 0,
    dislikes: Number(row.dislikes) || 0,
    userVote: row.user_reaction === 'like' || row.user_reaction === 'dislike' ? row.user_reaction : null,
  }));
}

export async function setRemoteReaction(courseId: number, reaction: 'like' | 'dislike'): Promise<RemoteVote | null> {
  const sessionId = getOrCreateSessionId();
  const response = await request('/rest/v1/rpc/set_course_reaction', {
    method: 'POST',
    body: JSON.stringify({ p_course_id: courseId, p_session_id: sessionId, p_reaction: reaction }),
  });
  if (!response) return null;
  const rows = (await response.json()) as Array<{
    course_id: number;
    likes: number;
    dislikes: number;
    user_reaction?: 'like' | 'dislike' | null;
  }>;
  const row = rows[0];
  return row ? {
    course_id: Number(row.course_id),
    likes: Number(row.likes) || 0,
    dislikes: Number(row.dislikes) || 0,
    userVote: row.user_reaction === 'like' || row.user_reaction === 'dislike' ? row.user_reaction : null,
  } : null;
}

export async function fetchCourseCount() {
  const response = await request('/rest/v1/rpc/get_course_count', { method: 'POST', body: '{}' });
  if (!response) return null;
  const value = await response.json();
  const count = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(count) ? count : null;
}

export async function fetchNotifications(): Promise<LiveNotification[] | null> {
  const response = await request('/rest/v1/notifications?select=id,title,body,type,created_at&order=created_at.desc&limit=30');
  if (!response) return null;
  return (await response.json()) as LiveNotification[];
}

export function subscribeToLiveUpdates(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const supabase = getClient();
  if (!supabase) return () => {};

  const channels: RealtimeChannel[] = [];
  const subscriptions = [
    { name: `course-totals-${getOrCreateSessionId()}`, table: 'course_reaction_totals' },
    { name: `course-catalogue-${getOrCreateSessionId()}`, table: 'course_catalogue' },
    { name: `course-notifications-${getOrCreateSessionId()}`, table: 'notifications' },
  ] as const;

  subscriptions.forEach(({ name, table }) => {
    const channel = supabase
      .channel(name)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange())
      .subscribe();
    channels.push(channel);
  });

  return () => {
    channels.forEach(channel => { void supabase.removeChannel(channel); });
  };
}
