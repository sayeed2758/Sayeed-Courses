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

export type LiveCourse = {
  id: number;
  number: number;
  title: string;
  category: string;
  educator: string;
  meta: string;
  price: number;
  palette: string;
  rating: number;
  reviews: number;
  likes: number;
  dislikes: number;
  thumbnail_url: string | null;
  telegram_url: string | null;
  is_published: boolean;
  initial_likes: number;
  initial_dislikes: number;
  created_at: string;
};

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
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      ...init,
      headers: headers(init.headers),
      cache: 'no-store',
    });
    return response.ok ? response : null;
  } catch {
    return null;
  }
}

export function getOrCreateSessionId() {
  if (typeof window === 'undefined') return '';
  const key = 'sayeed_courses_session_id_v2';
  const oldKey = 'sayeed_courses_session_id_v1';
  const existing = window.localStorage.getItem(key) || window.localStorage.getItem(oldKey);
  if (existing && existing.length >= 12 && existing.length <= 120) {
    if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, existing);
    return existing;
  }
  const id = crypto.randomUUID();
  window.localStorage.setItem(key, id);
  return id;
}

export async function fetchCourseCatalogue(): Promise<LiveCourse[] | null> {
  const response = await request('/rest/v1/course_catalogue?select=id,title,category,educator,price,thumbnail_url,telegram_url,rating,review_count,is_published,initial_likes,initial_dislikes,created_at&is_published=eq.true&order=id.asc');
  if (!response) return null;
  try {
    const rows = await response.json() as Array<Record<string, unknown>>;
    return rows.map((row, index) => {
      const rating = Number(row.rating);
      return {
        id: Number(row.id),
        number: index + 1,
        title: String(row.title || 'Untitled Course'),
        category: String(row.category || 'Other'),
        educator: String(row.educator || ''),
        meta: '',
        price: Number(row.price || 0),
        palette: ['teal', 'orange', 'purple', 'blue'][index % 4],
        rating: Number.isFinite(rating) ? Math.min(5, Math.max(4, rating)) : 4.5,
        reviews: Number(row.review_count || 0),
        likes: Number(row.initial_likes || 0),
        dislikes: Number(row.initial_dislikes || 0),
        thumbnail_url: typeof row.thumbnail_url === 'string' && row.thumbnail_url.trim() ? row.thumbnail_url : null,
        telegram_url: typeof row.telegram_url === 'string' && row.telegram_url.trim() ? row.telegram_url : null,
        is_published: row.is_published !== false,
        initial_likes: Number(row.initial_likes || 0),
        initial_dislikes: Number(row.initial_dislikes || 0),
        created_at: typeof row.created_at === 'string' ? row.created_at : '2026-09-25T12:00:00.000Z',
      };
    });
  } catch {
    return null;
  }
}

export async function fetchReactionCounts(courseIds: number[]): Promise<RemoteVote[] | null> {
  if (!isLiveBackendConfigured() || !courseIds.length) return [];
  const ids = [...new Set(courseIds.filter(Number.isInteger).filter(id => id > 0))].slice(0, 100);
  if (!ids.length) return [];

  // Use the public, security-definer RPC first. This avoids relying on the server secret for public reactions.
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_course_reaction_counts`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ course_ids: ids }),
      cache: 'no-store',
    });
    if (response.ok) {
      const rows = await response.json() as Array<{ course_id: number; likes: number; dislikes: number }>;
      return rows.map(row => ({
        course_id: Number(row.course_id),
        likes: Number(row.likes) || 0,
        dislikes: Number(row.dislikes) || 0,
        userVote: null,
      }));
    }
  } catch {
    // Fallback below.
  }

  try {
    const response = await fetch(`/api/reactions?ids=${encodeURIComponent(ids.join(','))}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const rows = await response.json() as Array<{ course_id: number; likes: number; dislikes: number }>;
    return rows.map(row => ({
      course_id: Number(row.course_id),
      likes: Number(row.likes) || 0,
      dislikes: Number(row.dislikes) || 0,
      userVote: null,
    }));
  } catch {
    return null;
  }
}

export async function setRemoteReaction(courseId: number, reaction: 'like' | 'dislike'): Promise<RemoteVote | null> {
  if (!isLiveBackendConfigured()) return null;
  const sessionId = getOrCreateSessionId();
  if (!sessionId) return null;

  // Direct RPC: the SQL function already exists in the project schema and is granted to anon.
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_course_reaction`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        p_course_id: courseId,
        p_session_id: sessionId,
        p_reaction: reaction,
      }),
      cache: 'no-store',
    });
    if (response.ok) {
      const rows = await response.json() as Array<{
        course_id: number;
        likes: number;
        dislikes: number;
        user_reaction?: string | null;
      }>;
      const row = rows[0];
      if (row) {
        return {
          course_id: Number(row.course_id),
          likes: Number(row.likes) || 0,
          dislikes: Number(row.dislikes) || 0,
          userVote: row.user_reaction === 'like' || row.user_reaction === 'dislike' ? row.user_reaction : null,
        };
      }
    }
  } catch {
    // Fall back to the server route for installations using an older schema.
  }

  try {
    const response = await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId, reaction, session_id: sessionId }),
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const rows = await response.json() as Array<{
      course_id: number;
      likes: number;
      dislikes: number;
      user_reaction?: string | null;
    }>;
    const row = rows[0];
    return row
      ? {
          course_id: Number(row.course_id),
          likes: Number(row.likes) || 0,
          dislikes: Number(row.dislikes) || 0,
          userVote: row.user_reaction === 'like' || row.user_reaction === 'dislike' ? row.user_reaction : null,
        }
      : null;
  } catch {
    return null;
  }
}

export async function fetchCourseCount(): Promise<number | null> {
  if (!isLiveBackendConfigured()) return null;

  // Count only currently published catalogue entries so the public number stays truthful.
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/course_catalogue?select=id&is_published=eq.true`, {
      method: 'HEAD',
      headers: { ...headers(), Prefer: 'count=exact' },
      cache: 'no-store',
    });
    if (response.ok) {
      const range = response.headers.get('content-range');
      const match = range?.match(/\/(\d+)$/);
      if (match) return Number(match[1]);
    }
  } catch {
    // Fallback to the original RPC below.
  }

  const response = await request('/rest/v1/rpc/get_course_count', { method: 'POST', body: '{}' });
  if (!response) return null;
  try {
    const value = await response.json();
    const count = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

export async function fetchNotifications(): Promise<LiveNotification[] | null> {
  const response = await request('/rest/v1/notifications?select=id,title,body,type,created_at&is_published=eq.true&order=created_at.desc&limit=30');
  if (!response) return null;
  try {
    const rows = await response.json() as Array<Record<string, unknown>>;
    return rows.map(row => ({
      id: String(row.id),
      title: String(row.title || ''),
      body: String(row.body || ''),
      type: typeof row.type === 'string' ? row.type : 'info',
      created_at: typeof row.created_at === 'string' ? row.created_at : '2026-09-25T12:00:00.000Z',
    }));
  } catch {
    return null;
  }
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation | null> {
  try {
    const response = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase(), subtotal: Number(subtotal) || 0 }),
      cache: 'no-store',
    });
    const result = await response.json().catch(() => null);
    if (!result) return null;
    if (result.reason === 'expired') {
      return { status: 'expired', message: 'Coupon Expired', discount_percent: 0, discount_amount: 0, total: subtotal, code: result.code };
    }
    if (!result.valid) {
      return { status: 'not_valid', message: 'Not Valid', discount_percent: 0, discount_amount: 0, total: subtotal };
    }
    const percent = Math.min(100, Math.max(1, Number(result.discount_percent) || 0));
    const amount = Math.round((subtotal * percent) / 100);
    return {
      status: 'valid',
      message: 'Coupon applied',
      discount_percent: percent,
      discount_amount: amount,
      total: Math.max(0, subtotal - amount),
      code: String(result.code || code.toUpperCase()),
    };
  } catch {
    return null;
  }
}
