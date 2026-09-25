import { redirect } from 'next/navigation';
import { getAdminIdentity } from '../../lib/admin-auth';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await getAdminIdentity();
  if (!admin) redirect('/admin/login');
  return <AdminDashboard admin={admin} />;
}
