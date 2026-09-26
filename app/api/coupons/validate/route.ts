import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code || '').trim().toUpperCase();
    if (!code || code.length > 64) return NextResponse.json({ valid: false, reason: 'not_valid' });
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('validate_coupon', { p_code: code });
    if (error) return NextResponse.json({ valid: false, reason: 'not_valid' });
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return NextResponse.json({ valid: false, reason: 'not_valid' });
    if (row.reason === 'expired') return NextResponse.json({ valid: false, reason: 'expired' });
    if (!row.valid) return NextResponse.json({ valid: false, reason: 'not_valid' });
    return NextResponse.json({ valid: true, code: String(row.code || code), discount_percent: Number(row.discount_percent || 0) });
  } catch {
    return NextResponse.json({ valid: false, reason: 'not_valid' });
  }
}
