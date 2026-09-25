'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createClient } from '../../lib/supabase/client';

type AdminIdentity = { userId: string; email: string; role: string };
type Course = { id: number; title: string; category: string; educator: string; price: number; thumbnail_url: string | null; telegram_url: string | null; rating: number; review_count: number; is_published: boolean; created_at: string };
type Notification = { id: number; title: string; body: string; type: string; is_published: boolean; created_at: string };
type Coupon = { id: number; code: string; discount_percent: number; expires_at: string | null; is_active: boolean; created_at: string };

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, { ...init, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Request failed.');
  return data;
}

const blankCourse = { title: '', category: 'Coding & Tech', educator: '', price: '299', thumbnail_url: '', telegram_url: '', rating: '4.5', review_count: '0', is_published: true };
const blankNotification = { title: '', body: '', type: 'info', is_published: true };
const blankCoupon = { code: '', discount_percent: '30', expires_at: '', is_active: true };

export default function AdminDashboard({ admin }: { admin: AdminIdentity }) {
  const [tab, setTab] = useState<'overview' | 'courses' | 'notifications' | 'coupons'>('overview');
  const [courses, setCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [courseForm, setCourseForm] = useState(blankCourse);
  const [notificationForm, setNotificationForm] = useState(blankNotification);
  const [couponForm, setCouponForm] = useState(blankCoupon);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editingNotificationId, setEditingNotificationId] = useState<number | null>(null);
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  async function loadAll() {
    const [courseData, notificationData, couponData, statsData] = await Promise.all([
      api('/api/admin/courses'), api('/api/admin/notifications'), api('/api/admin/coupons'), api('/api/admin/stats'),
    ]);
    setCourses(courseData.rows || []);
    setNotifications(notificationData.rows || []);
    setCoupons(couponData.rows || []);
    setStats(statsData || {});
  }

  useEffect(() => { loadAll().catch(err => setNotice(err.message)); }, []);

  const activeCoupons = useMemo(() => coupons.filter(c => c.is_active && (!c.expires_at || new Date(c.expires_at).getTime() > Date.now())).length, [coupons]);

  async function saveCourse(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice('');
    try {
      await api('/api/admin/courses', { method: editingCourseId ? 'PATCH' : 'POST', body: JSON.stringify({ ...(editingCourseId ? { id: editingCourseId } : {}), ...courseForm, price: Number(courseForm.price), rating: Number(courseForm.rating), review_count: Number(courseForm.review_count) }) });
      setCourseForm(blankCourse); setEditingCourseId(null); await loadAll(); setNotice('Course saved.');
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Course save failed.'); }
    setBusy(false);
  }

  async function deleteCourse(id: number) {
    if (!confirm('Delete this course permanently?')) return;
    setBusy(true); try { await api(`/api/admin/courses?id=${id}`, { method: 'DELETE' }); await loadAll(); setNotice('Course deleted.'); } catch (err) { setNotice(err instanceof Error ? err.message : 'Delete failed.'); } setBusy(false);
  }

  async function saveNotification(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice('');
    try { await api('/api/admin/notifications', { method: editingNotificationId ? 'PATCH' : 'POST', body: JSON.stringify({ ...(editingNotificationId ? { id: editingNotificationId } : {}), ...notificationForm }) }); setNotificationForm(blankNotification); setEditingNotificationId(null); await loadAll(); setNotice('Notification saved.'); } catch (err) { setNotice(err instanceof Error ? err.message : 'Notification save failed.'); } setBusy(false);
  }

  async function deleteNotification(id: number) { if (!confirm('Delete this notification?')) return; setBusy(true); try { await api(`/api/admin/notifications?id=${id}`, { method: 'DELETE' }); await loadAll(); } catch (err) { setNotice(err instanceof Error ? err.message : 'Delete failed.'); } setBusy(false); }

  async function saveCoupon(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice('');
    try { await api('/api/admin/coupons', { method: editingCouponId ? 'PATCH' : 'POST', body: JSON.stringify({ ...(editingCouponId ? { id: editingCouponId } : {}), ...couponForm, discount_percent: Number(couponForm.discount_percent), expires_at: couponForm.expires_at ? new Date(couponForm.expires_at).toISOString() : null }) }); setCouponForm(blankCoupon); setEditingCouponId(null); await loadAll(); setNotice('Coupon saved.'); } catch (err) { setNotice(err instanceof Error ? err.message : 'Coupon save failed.'); } setBusy(false);
  }

  async function deleteCoupon(id: number) { if (!confirm('Delete this coupon?')) return; setBusy(true); try { await api(`/api/admin/coupons?id=${id}`, { method: 'DELETE' }); await loadAll(); } catch (err) { setNotice(err instanceof Error ? err.message : 'Delete failed.'); } setBusy(false); }

  async function signOut() { const supabase = createClient(); await supabase.auth.signOut(); window.location.href = '/admin/login'; }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div><span className="admin-kicker">SAYEED COURSES</span><h1>Control Room</h1></div>
        <div className="admin-user"><span>{admin.email}</span><button onClick={signOut}>Sign out</button></div>
      </header>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          {(['overview','courses','notifications','coupons'] as const).map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item === 'overview' ? 'Overview' : item.charAt(0).toUpperCase() + item.slice(1)}</button>)}
          <div className="admin-security-note"><strong>🔒 Protected</strong><span>Server-verified admin access + Supabase RLS</span></div>
        </aside>
        <section className="admin-content">
          {notice && <div className="admin-notice">{notice}</div>}
          {tab === 'overview' && <>
            <div className="admin-stat-grid">{[['Courses', stats.total_courses || courses.length], ['Published', stats.published_courses || courses.filter(c => c.is_published).length], ['Notifications', stats.notifications || notifications.length], ['Active Coupons', activeCoupons], ['Likes', stats.likes || 0], ['Dislikes', stats.dislikes || 0]].map(([label,value]) => <article key={String(label)} className="admin-stat"><span>{label}</span><strong>{value}</strong></article>)}</div>
            <div className="admin-panel"><h2>What this panel controls</h2><p>Add/edit/publish/delete courses, publish announcements, create/expire coupon codes, and inspect catalogue/reaction totals. No admin link is exposed on the public UI.</p></div>
          </>}

          {tab === 'courses' && <div className="admin-grid-2"><form className="admin-panel admin-form" onSubmit={saveCourse}><h2>{editingCourseId ? 'Edit Course' : 'Add Course'}</h2><input placeholder="Course title" value={courseForm.title} onChange={e => setCourseForm({...courseForm,title:e.target.value})} required /><select value={courseForm.category} onChange={e => setCourseForm({...courseForm,category:e.target.value})}>{['Coding & Tech','AI & Automation','Finance & Taxation','Personal Growth & Mindset','Upsurge Courses','Video Editing & Media','Fitness & Health','Communication & Languages'].map(c => <option key={c}>{c}</option>)}</select><input placeholder="Educator" value={courseForm.educator} onChange={e => setCourseForm({...courseForm,educator:e.target.value})}/><input placeholder="Price" type="number" min="0" value={courseForm.price} onChange={e => setCourseForm({...courseForm,price:e.target.value})} required /><input placeholder="Thumbnail URL (optional)" value={courseForm.thumbnail_url} onChange={e => setCourseForm({...courseForm,thumbnail_url:e.target.value})}/><input placeholder="Telegram course URL (optional)" value={courseForm.telegram_url} onChange={e => setCourseForm({...courseForm,telegram_url:e.target.value})}/><div className="admin-inline"><input placeholder="Rating" type="number" min="4" max="5" step="0.1" value={courseForm.rating} onChange={e => setCourseForm({...courseForm,rating:e.target.value})}/><input placeholder="Reviews" type="number" min="0" value={courseForm.review_count} onChange={e => setCourseForm({...courseForm,review_count:e.target.value})}/></div><label className="admin-check"><input type="checkbox" checked={courseForm.is_published} onChange={e => setCourseForm({...courseForm,is_published:e.target.checked})}/> Published</label><button disabled={busy}>{editingCourseId ? 'UPDATE COURSE' : 'ADD COURSE'}</button>{editingCourseId && <button type="button" className="secondary" onClick={() => {setEditingCourseId(null);setCourseForm(blankCourse);}}>Cancel</button>}</form><div className="admin-panel"><h2>Course Catalogue</h2><div className="admin-table-wrap"><table><thead><tr><th>#</th><th>Course</th><th>Price</th><th>Status</th><th></th></tr></thead><tbody>{courses.map(c => <tr key={c.id}><td>{c.id}</td><td><strong>{c.title}</strong><small>{c.category}</small></td><td>₹{Number(c.price).toLocaleString('en-IN')}</td><td><span className={c.is_published ? 'status-on' : 'status-off'}>{c.is_published ? 'Published' : 'Hidden'}</span></td><td><button className="table-action" onClick={() => {setEditingCourseId(c.id);setCourseForm({title:c.title,category:c.category,educator:c.educator||'',price:String(c.price),thumbnail_url:c.thumbnail_url||'',telegram_url:c.telegram_url||'',rating:String(c.rating||4.5),review_count:String(c.review_count||0),is_published:c.is_published})}}>Edit</button><button className="table-action danger" onClick={() => deleteCourse(c.id)}>Delete</button></td></tr>)}</tbody></table></div></div></div>}

          {tab === 'notifications' && <div className="admin-grid-2"><form className="admin-panel admin-form" onSubmit={saveNotification}><h2>{editingNotificationId ? 'Edit Announcement' : 'Publish Announcement'}</h2><input placeholder="Title" value={notificationForm.title} onChange={e => setNotificationForm({...notificationForm,title:e.target.value})} required /><textarea placeholder="Message" value={notificationForm.body} onChange={e => setNotificationForm({...notificationForm,body:e.target.value})} rows={6} required /><select value={notificationForm.type} onChange={e => setNotificationForm({...notificationForm,type:e.target.value})}><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option></select><label className="admin-check"><input type="checkbox" checked={notificationForm.is_published} onChange={e => setNotificationForm({...notificationForm,is_published:e.target.checked})}/> Visible to users</label><button disabled={busy}>{editingNotificationId ? 'UPDATE' : 'PUBLISH'}</button></form><div className="admin-panel"><h2>Published Notifications</h2><div className="admin-list">{notifications.map(n => <article key={n.id}><div><strong>{n.title}</strong><p>{n.body}</p><small>{new Date(n.created_at).toLocaleString('en-IN')}</small></div><div><button className="table-action" onClick={() => {setEditingNotificationId(n.id);setNotificationForm({title:n.title,body:n.body,type:n.type||'info',is_published:n.is_published})}}>Edit</button><button className="table-action danger" onClick={() => deleteNotification(n.id)}>Delete</button></div></article>)}</div></div></div>}

          {tab === 'coupons' && <div className="admin-grid-2"><form className="admin-panel admin-form" onSubmit={saveCoupon}><h2>{editingCouponId ? 'Edit Coupon' : 'Create Coupon'}</h2><input placeholder="Coupon code" value={couponForm.code} onChange={e => setCouponForm({...couponForm,code:e.target.value.toUpperCase()})} required /><input placeholder="Discount %" type="number" min="1" max="100" value={couponForm.discount_percent} onChange={e => setCouponForm({...couponForm,discount_percent:e.target.value})} required /><label>Expiry (optional)<input type="datetime-local" value={couponForm.expires_at} onChange={e => setCouponForm({...couponForm,expires_at:e.target.value})}/></label><label className="admin-check"><input type="checkbox" checked={couponForm.is_active} onChange={e => setCouponForm({...couponForm,is_active:e.target.checked})}/> Active</label><button disabled={busy}>{editingCouponId ? 'UPDATE COUPON' : 'CREATE COUPON'}</button></form><div className="admin-panel"><h2>Coupon Control</h2><div className="admin-list">{coupons.map(c => <article key={c.id}><div><strong>{c.code}</strong><p>{c.discount_percent}% discount · {c.expires_at ? new Date(c.expires_at).toLocaleString('en-IN') : 'No expiry'}</p><small className={c.is_active ? 'status-on' : 'status-off'}>{c.is_active ? 'Active' : 'Disabled'}</small></div><div><button className="table-action" onClick={() => {setEditingCouponId(c.id);setCouponForm({code:c.code,discount_percent:String(c.discount_percent),expires_at:c.expires_at ? new Date(c.expires_at).toISOString().slice(0,16) : '',is_active:c.is_active})}}>Edit</button><button className="table-action danger" onClick={() => deleteCoupon(c.id)}>Delete</button></div></article>)}</div></div></div>}
        </section>
      </div>
    </main>
  );
}
