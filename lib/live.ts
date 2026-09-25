export type LiveNotification = { id: string; title: string; body: string; type?: string | null; created_at: string };
export type LiveVoteState = { likes: number; dislikes: number; userVote: 'like' | 'dislike' | null };
export type RemoteVote = LiveVoteState & { course_id: number };
export type LiveCourse = {
  id: number; number: number; title: string; category: string; educator: string; meta: string;
  price: number; palette: string; rating: string; reviews: number; likes: number; dislikes: number;
  thumbnail_url: string | null; telegram_url: string | null; is_published: boolean;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isLiveBackendConfigured() { return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY); }
function headers(extra: HeadersInit = {}) { return { apikey: SUPABASE_PUBLISHABLE_KEY || '', Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY || ''}`, 'Content-Type': 'application/json', ...extra }; }
async function request(path: string, init: RequestInit = {}) { if (!isLiveBackendConfigured()) return null; try { const response = await fetch(`${SUPABASE_URL}${path}`, { ...init, headers: headers(init.headers), cache: 'no-store' }); if (!response.ok) return null; return response; } catch { return null; } }

export function getOrCreateSessionId() { if (typeof window === 'undefined') return ''; const key='sayeed_courses_session_id_v1'; const existing=window.localStorage.getItem(key); if(existing) return existing; const id=crypto.randomUUID(); window.localStorage.setItem(key,id); return id; }

export async function fetchCourseCatalogue(): Promise<LiveCourse[] | null> {
  const response = await request('/rest/v1/course_catalogue?select=id,title,category,educator,price,thumbnail_url,telegram_url,rating,review_count,is_published,created_at&is_published=eq.true&order=id.asc');
  if (!response) return null;
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows.map((row, index) => {
    const id = Number(row.id); const price = Number(row.price || 0); const rating = Number(row.rating || 4.5);
    return { id, number: index + 1, title: String(row.title || ''), category: String(row.category || 'Coding & Tech'), educator: String(row.educator || ''), meta: '', price, palette: ['teal','orange','purple','blue'][index % 4], rating: Math.min(5, Math.max(4, rating)).toFixed(1), reviews: Number(row.review_count || 0), likes: 0, dislikes: 0, thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null, telegram_url: row.telegram_url ? String(row.telegram_url) : null, is_published: true };
  });
}

export async function fetchReactionCounts(courseIds: number[]) { const response=await request('/rest/v1/rpc/get_course_reaction_counts',{method:'POST',body:JSON.stringify({course_ids:courseIds})}); if(!response)return null; const rows=await response.json() as Array<{course_id:number;likes:number;dislikes:number;user_reaction?:'like'|'dislike'|null}>; return rows.map(row=>({course_id:row.course_id,likes:row.likes,dislikes:row.dislikes,userVote:row.user_reaction??null})); }
export async function setRemoteReaction(courseId:number,reaction:'like'|'dislike'):Promise<RemoteVote|null>{const sessionId=getOrCreateSessionId();const response=await request('/rest/v1/rpc/set_course_reaction',{method:'POST',body:JSON.stringify({p_course_id:courseId,p_session_id:sessionId,p_reaction:reaction})});if(!response)return null;const rows=await response.json() as Array<{course_id:number;likes:number;dislikes:number;user_reaction?:'like'|'dislike'|null}>;const row=rows[0];return row?{course_id:row.course_id,likes:row.likes,dislikes:row.dislikes,userVote:row.user_reaction??null}:null;}
export async function fetchCourseCount(){const response=await request('/rest/v1/rpc/get_course_count',{method:'POST',body:'{}'});if(!response)return null;const value=await response.json();return typeof value==='number'?value:Number(value);}
export async function fetchNotifications():Promise<LiveNotification[]|null>{const response=await request('/rest/v1/notifications?select=id,title,body,type,created_at&is_published=eq.true&order=created_at.desc&limit=30');if(!response)return null;return await response.json() as LiveNotification[];}
