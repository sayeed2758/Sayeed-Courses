import { redirect } from 'next/navigation';
import { getAdminIdentity, getSignedInUser } from '../../lib/admin-auth';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await getAdminIdentity();
  if (!admin) {
    const user = await getSignedInUser();
    redirect(user ? '/admin/login?error=forbidden' : '/admin/login');
    return null;
  }
  return <AdminDashboard admin={admin} />;
}
