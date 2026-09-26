import { NextResponse } from 'next/server';
import { getAdminClient } from '../../../../lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code || '').trim().toUpperCase();
    if (!code) return NextResponse.json({ valid: false, reason: 'not_valid' });
    const { data, error } = await getAdminClient().from('coupons').select('code,discount_percent,expires_at,is_active').eq('code', code).maybeSingle();
    if (error || !data) return NextResponse.json({ valid: false, reason: 'not_valid' });
    if (!data.is_active) return NextResponse.json({ valid: false, reason: 'expired' });
    if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return NextResponse.json({ valid: false, reason: 'expired' });
    return NextResponse.json({ valid: true, code: data.code, discount_percent: Number(data.discount_percent) });
  } catch {
    return NextResponse.json({ valid: false, reason: 'not_valid' });
  }
}
