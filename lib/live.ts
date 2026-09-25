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

export type LiveCourse = {
  id: number;
  number: number;
  title: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  initial_likes: number;
  initial_dislikes: number;
  thumbnail_url?: string | null;
  telegram_url?: string | null;
  palette?: string;
  created_at: string;
};

export type RemoteVote = LiveVoteState & { course_id: number };

export type CouponValidation = {
  status: 'valid' | 'expired' | 'not_valid';
  message: string;
  discount_percent: number;
  discount_amount: number;
  total: number;
  code?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isLiveBackendConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

function headers(extra: HeadersInit = {}) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY || '',
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY || ''}`,
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
  const key = 'sayeed_courses_session_id_v2';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(key, id);
  return id;
}

export async function fetchCourseCatalogue(): Promise<LiveCourse[] | null> {
  const response = await request('/rest/v1/course_catalogue?select=id,number,title,category,price,rating,reviews,initial_likes,initial_dislikes,thumbnail_url,telegram_url,created_at,is_active&is_active=eq.true&order=number.asc');
  if (!response) return null;
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows.map((row, index) => ({
    id: Number(row.id),
    number: Number(row.number ?? index + 1),
    title: String(row.title ?? 'Untitled Course'),
    category: String(row.category ?? 'Other'),
    price: Number(row.price ?? 0),
    rating: Math.min(5, Math.max(4, Number(row.rating ?? 4.5))),
    reviews: Number(row.reviews ?? 0),
    initial_likes: Number(row.initial_likes ?? 0),
    initial_dislikes: Number(row.initial_dislikes ?? 0),
    thumbnail_url: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : null,
    telegram_url: typeof row.telegram_url === 'string' ? row.telegram_url : null,
    palette: ['teal', 'orange', 'purple', 'blue'][index % 4],
    created_at: String(row.created_at ?? new Date().toISOString()),
  }));
}

export async function fetchReactionCounts(courseIds: number[]): Promise<RemoteVote[] | null> {
  if (!courseIds.length) return [];
  const response = await request('/rest/v1/rpc/get_course_reaction_counts', {
    method: 'POST',
    body: JSON.stringify({ course_ids: courseIds, p_session_id: getOrCreateSessionId() }),
  });
  if (!response) return null;
  const rows = await response.json() as Array<{ course_id: number; likes: number; dislikes: number; user_reaction?: 'like' | 'dislike' | null }>;
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
  const rows = await response.json() as Array<{ course_id: number; likes: number; dislikes: number; user_reaction?: 'like' | 'dislike' | null }>;
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
  return await response.json() as LiveNotification[];
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation | null> {
  const response = await request('/rest/v1/rpc/validate_coupon', {
    method: 'POST',
    body: JSON.stringify({ p_code: code.trim(), p_subtotal: subtotal }),
  });
  if (!response) return null;
  const rows = await response.json() as CouponValidation[];
  return rows[0] || null;
}
