import { NextResponse } from 'next/server';
import { getAdminClient } from '../../../../lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code || '').trim().toUpperCase();
    if (!code || code.length > 64) return NextResponse.json({ valid: false, reason: 'not_valid' }, { headers: { 'Cache-Control': 'no-store' } });

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('coupons')
      .select('code,discount_percent,expires_at,is_active')
      .eq('code', code)
      .maybeSingle();

    if (error || !data) return NextResponse.json({ valid: false, reason: 'not_valid' }, { headers: { 'Cache-Control': 'no-store' } });

    const expired = !data.is_active || (data.expires_at && new Date(data.expires_at).getTime() <= Date.now());
    if (expired) {
      return NextResponse.json({ valid: false, reason: 'expired', code: data.code }, { headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json({
      valid: true,
      reason: 'valid',
      code: data.code,
      discount_percent: Number(data.discount_percent) || 0,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ valid: false, reason: 'not_valid' }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
