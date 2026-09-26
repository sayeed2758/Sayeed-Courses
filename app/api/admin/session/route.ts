import { NextResponse } from 'next/server';
import { getAdminIdentity } from '../../../../lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await getAdminIdentity();
  if (!admin) return NextResponse.json({ ok: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ ok: true, admin }, { headers: { 'Cache-Control': 'no-store' } });
}
