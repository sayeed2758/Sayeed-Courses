'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { createClient } from '../../lib/supabase/client';

type AdminIdentity = { userId: string; email: string; role: string };
type Course = {
  id: number;
  title: string;
  category: string;
  educator: string;
  price: number;
  thumbnail_url: string | null;
  telegram_url: string | null;
  rating: number;
  review_count: number;
  is_published: boolean;
  created_at: string;
};
type Notification = { id: number; title: string; body: string; type: string; is_published: boolean; created_at: string };
type Coupon = { id: number; code: string; discount_percent: number; expires_at: string | null; is_active: boolean; created_at: string };
type DeleteTarget = { kind: 'course' | 'notification' | 'coupon'; id: number; label: string } | null;

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status}).`);
  return data;
}

const blankCourse = {
  title: '',
  category: 'Coding & Tech',
  educator: '',
  price: '299',
  thumbnail_url: '',
  telegram_url: '',
  rating: '4.5',
  review_count: '0',
  is_published: true,
};
const blankNotification = { title: '', body: '', type: 'info', is_published: true };
const blankCoupon = { code: '', discount_percent: '30', expires_at: '', is_active: true };
const categories = ['Coding & Tech', 'AI & Automation', 'Finance & Taxation', 'Personal Growth & Mindset', 'Upsurge Courses', 'Video Editing & Media', 'Fitness & Health', 'Communication & Languages'];

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
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  async function loadAll() {
    const results = await Promise.allSettled([
      api('/api/admin/courses'),
      api('/api/admin/notifications'),
      api('/api/admin/coupons'),
      api('/api/admin/stats'),
    ]);
    const [courseResult, notificationResult, couponResult, statsResult] = results;
    const errors: string[] = [];
    if (courseResult.status === 'fulfilled') setCourses(courseResult.value.rows || []); else errors.push(courseResult.reason instanceof Error ? courseResult.reason.message : 'Courses unavailable');
    if (notificationResult.status === 'fulfilled') setNotifications(notificationResult.value.rows || []); else errors.push(notificationResult.reason instanceof Error ? notificationResult.reason.message : 'Notifications unavailable');
    if (couponResult.status === 'fulfilled') setCoupons(couponResult.value.rows || []); else errors.push(couponResult.reason instanceof Error ? couponResult.reason.message : 'Coupons unavailable');
    if (statsResult.status === 'fulfilled') setStats(statsResult.value || {}); else errors.push(statsResult.reason instanceof Error ? statsResult.reason.message : 'Stats unavailable');
    if (errors.length) throw new Error(errors[0]);
  }

  useEffect(() => { loadAll().catch(err => setNotice(err.message)); }, []);

  const activeCoupons = useMemo(
    () => coupons.filter(c => c.is_active && (!c.expires_at || new Date(c.expires_at).getTime() > Date.now())).length,
    [coupons],
  );

  function resetCourseForm() {
    setEditingCourseId(null);
    setCourseForm(blankCourse);
    setSelectedThumbnail(null);
    setThumbnailPreview('');
  }

  function chooseThumbnail(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice('Please choose a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice('Thumbnail must be 5 MB or smaller.');
      return;
    }
    setSelectedThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setNotice('Thumbnail selected. It will be uploaded when the course is saved.');
  }

  async function uploadThumbnail(file: File) {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch('/api/admin/upload', { method: 'POST', body: form, cache: 'no-store' });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || 'Thumbnail upload failed.');
    return String(data.url);
  }

  async function saveCourse(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      let thumbnailUrl = courseForm.thumbnail_url.trim();
      if (selectedThumbnail) thumbnailUrl = await uploadThumbnail(selectedThumbnail);
      await api('/api/admin/courses', {
        method: editingCourseId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          ...(editingCourseId ? { id: editingCourseId } : {}),
          ...courseForm,
          thumbnail_url: thumbnailUrl,
          price: Number(courseForm.price),
          rating: Number(courseForm.rating),
          review_count: Number(courseForm.review_count),
        }),
      });
      resetCourseForm();
      await loadAll();
      setNotice('Course saved successfully.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Course save failed.');
    }
    setBusy(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    setNotice('');
    try {
      if (deleteTarget.kind === 'course') await api(`/api/admin/courses?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (deleteTarget.kind === 'notification') await api(`/api/admin/notifications?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (deleteTarget.kind === 'coupon') await api(`/api/admin/coupons?id=${deleteTarget.id}`, { method: 'DELETE' });
      await loadAll();
      setNotice(`${deleteTarget.kind === 'course' ? 'Course' : deleteTarget.kind === 'notification' ? 'Notification' : 'Coupon'} deleted.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  }

  async function saveNotification(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      await api('/api/admin/notifications', {
        method: editingNotificationId ? 'PATCH' : 'POST',
        body: JSON.stringify({ ...(editingNotificationId ? { id: editingNotificationId } : {}), ...notificationForm }),
      });
      setNotificationForm(blankNotification);
      setEditingNotificationId(null);
      await loadAll();
      setNotice('Notification saved successfully.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Notification save failed.');
    }
    setBusy(false);
  }

  async function saveCoupon(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      await api('/api/admin/coupons', {
        method: editingCouponId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          ...(editingCouponId ? { id: editingCouponId } : {}),
          ...couponForm,
          discount_percent: Number(couponForm.discount_percent),
          expires_at: couponForm.expires_at ? new Date(couponForm.expires_at).toISOString() : null,
        }),
      });
      setCouponForm(blankCoupon);
      setEditingCouponId(null);
      await loadAll();
      setNotice('Coupon saved successfully.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Coupon save failed.');
    }
    setBusy(false);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-heading"><span className="admin-kicker">SAYEED COURSES</span><h1>Control Room</h1><p>Manage catalogue, announcements and discounts.</p></div>
        <div className="admin-user"><span title={admin.email}>{admin.email}</span><button type="button" onClick={signOut}>Sign out</button></div>
      </header>

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {(['overview', 'courses', 'notifications', 'coupons'] as const).map(item => (
          <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>
            {item === 'overview' ? 'Overview' : item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      <section className="admin-content">
        {notice && <div className="admin-notice" role="status">{notice}</div>}

        {tab === 'overview' && <>
          <div className="admin-stat-grid">
            {[
              ['Courses', stats.total_courses ?? courses.length],
              ['Published', stats.published_courses ?? courses.filter(c => c.is_published).length],
              ['Notifications', stats.notifications ?? notifications.length],
              ['Active Coupons', activeCoupons],
              ['Likes', stats.likes ?? 0],
              ['Dislikes', stats.dislikes ?? 0],
            ].map(([label, value]) => <article key={String(label)} className="admin-stat"><span>{label}</span><strong>{value}</strong></article>)}
          </div>
          <div className="admin-panel admin-info-card">
            <div><span className="panel-kicker">SECURITY</span><h2>Admin-only Control Room</h2><p>All mutations go through server-verified admin APIs. Public users cannot access course, notification or coupon write operations.</p></div>
            <div className="security-badge">🔒 Protected</div>
          </div>
        </>}

        {tab === 'courses' && <div className="admin-grid-2">
          <form className="admin-panel admin-form" onSubmit={saveCourse}>
            <div className="panel-head"><div><span className="panel-kicker">CATALOGUE</span><h2>{editingCourseId ? 'Edit Course' : 'Add Course'}</h2></div>{editingCourseId && <button type="button" className="secondary compact" onClick={resetCourseForm}>Reset</button>}</div>
            <label>Course title<input placeholder="Course title" value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} required /></label>
            <label>Category<select value={courseForm.category} onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
            <label>Educator (optional)<input placeholder="Educator" value={courseForm.educator} onChange={e => setCourseForm({ ...courseForm, educator: e.target.value })} /></label>
            <label>Price<input placeholder="Price" type="number" min="0" value={courseForm.price} onChange={e => setCourseForm({ ...courseForm, price: e.target.value })} required /></label>
            <div className="thumbnail-upload-box">
              <div><strong>Course Thumbnail</strong><span>Upload one landscape image. Recommended ratio: 1.9:1 (1200×630 works well).</span></div>
              <label className="upload-button"><span>Choose Image</span><input type="file" accept="image/*" onChange={chooseThumbnail} /></label>
              {(thumbnailPreview || courseForm.thumbnail_url) && <img className="thumbnail-preview" src={thumbnailPreview || courseForm.thumbnail_url} alt="Thumbnail preview" />}
              {selectedThumbnail && <small>{selectedThumbnail.name}</small>}
            </div>
            <label>Telegram course link (optional)<input placeholder="Course-specific Telegram link" value={courseForm.telegram_url} onChange={e => setCourseForm({ ...courseForm, telegram_url: e.target.value })} /></label>
            <div className="admin-inline"><label>Rating<input placeholder="Rating" type="number" min="4" max="5" step="0.1" value={courseForm.rating} onChange={e => setCourseForm({ ...courseForm, rating: e.target.value })} /></label><label>Reviews<input placeholder="Reviews" type="number" min="0" value={courseForm.review_count} onChange={e => setCourseForm({ ...courseForm, review_count: e.target.value })} /></label></div>
            <label className="admin-check"><input type="checkbox" checked={courseForm.is_published} onChange={e => setCourseForm({ ...courseForm, is_published: e.target.checked })} /> Published for users</label>
            <button type="submit" disabled={busy}>{busy ? 'SAVING…' : editingCourseId ? 'UPDATE COURSE' : 'ADD COURSE'}</button>
          </form>

          <div className="admin-panel">
            <div className="panel-head"><div><span className="panel-kicker">LIVE DATA</span><h2>Course Catalogue</h2></div><span className="panel-count">{courses.length} items</span></div>
            <div className="admin-course-list">{courses.map(c => <article className="admin-course-row" key={c.id}>
              <div className="admin-course-thumb">{c.thumbnail_url ? <img src={c.thumbnail_url} alt="" /> : <span>{String(c.id).padStart(3, '0')}</span>}</div>
              <div className="admin-course-copy"><strong>{c.title}</strong><span>{c.category}</span><small>₹{Number(c.price).toLocaleString('en-IN')} · {c.is_published ? 'Published' : 'Hidden'}</small></div>
              <div className="admin-row-actions"><button type="button" className="table-action" onClick={() => { setTab('courses'); setEditingCourseId(c.id); setSelectedThumbnail(null); setCourseForm({ title: c.title, category: c.category, educator: c.educator || '', price: String(c.price), thumbnail_url: c.thumbnail_url || '', telegram_url: c.telegram_url || '', rating: String(c.rating || 4.5), review_count: String(c.review_count || 0), is_published: c.is_published }); setThumbnailPreview(c.thumbnail_url || ''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button><button type="button" className="table-action danger" onClick={() => setDeleteTarget({ kind: 'course', id: c.id, label: c.title })}>Delete</button></div>
            </article>)}</div>
          </div>
        </div>}

        {tab === 'notifications' && <div className="admin-grid-2">
          <form className="admin-panel admin-form" onSubmit={saveNotification}>
            <div className="panel-head"><div><span className="panel-kicker">USER FEED</span><h2>{editingNotificationId ? 'Edit Announcement' : 'Publish Announcement'}</h2></div>{editingNotificationId && <button type="button" className="secondary compact" onClick={() => { setEditingNotificationId(null); setNotificationForm(blankNotification); }}>Reset</button>}</div>
            <label>Title<input placeholder="Announcement title" value={notificationForm.title} onChange={e => setNotificationForm({ ...notificationForm, title: e.target.value })} required /></label>
            <label>Message<textarea placeholder="Message for users" value={notificationForm.body} onChange={e => setNotificationForm({ ...notificationForm, body: e.target.value })} rows={7} required /></label>
            <label>Type<select value={notificationForm.type} onChange={e => setNotificationForm({ ...notificationForm, type: e.target.value })}><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option></select></label>
            <label className="admin-check"><input type="checkbox" checked={notificationForm.is_published} onChange={e => setNotificationForm({ ...notificationForm, is_published: e.target.checked })} /> Visible to users</label>
            <button type="submit" disabled={busy}>{busy ? 'SAVING…' : editingNotificationId ? 'UPDATE' : 'PUBLISH'}</button>
          </form>
          <div className="admin-panel"><div className="panel-head"><div><span className="panel-kicker">PUBLISHED</span><h2>Notifications</h2></div><span className="panel-count">{notifications.length} items</span></div><div className="admin-list">{notifications.map(n => <article key={n.id}><div className="admin-list-copy"><strong>{n.title}</strong><p>{n.body}</p><small>{new Date(n.created_at).toLocaleString('en-IN')} · {n.is_published ? 'Visible' : 'Hidden'}</small></div><div className="admin-row-actions"><button type="button" className="table-action" onClick={() => { setEditingNotificationId(n.id); setNotificationForm({ title: n.title, body: n.body, type: n.type || 'info', is_published: n.is_published }); }}>Edit</button><button type="button" className="table-action danger" onClick={() => setDeleteTarget({ kind: 'notification', id: n.id, label: n.title })}>Delete</button></div></article>)}</div></div>
        </div>}

        {tab === 'coupons' && <div className="admin-grid-2">
          <form className="admin-panel admin-form" onSubmit={saveCoupon}>
            <div className="panel-head"><div><span className="panel-kicker">DISCOUNTS</span><h2>{editingCouponId ? 'Edit Coupon' : 'Create Coupon'}</h2></div>{editingCouponId && <button type="button" className="secondary compact" onClick={() => { setEditingCouponId(null); setCouponForm(blankCoupon); }}>Reset</button>}</div>
            <label>Coupon code<input placeholder="SAVE30" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required /></label>
            <label>Discount percentage<input placeholder="30" type="number" min="1" max="100" value={couponForm.discount_percent} onChange={e => setCouponForm({ ...couponForm, discount_percent: e.target.value })} required /></label>
            <label>Expiry (optional)<input type="datetime-local" value={couponForm.expires_at} onChange={e => setCouponForm({ ...couponForm, expires_at: e.target.value })} /></label>
            <label className="admin-check"><input type="checkbox" checked={couponForm.is_active} onChange={e => setCouponForm({ ...couponForm, is_active: e.target.checked })} /> Active</label>
            <button type="submit" disabled={busy}>{busy ? 'SAVING…' : editingCouponId ? 'UPDATE COUPON' : 'CREATE COUPON'}</button>
          </form>
          <div className="admin-panel"><div className="panel-head"><div><span className="panel-kicker">CONTROL</span><h2>Coupon Control</h2></div><span className="panel-count">{coupons.length} codes</span></div><div className="admin-list">{coupons.map(c => <article key={c.id}><div className="admin-list-copy"><strong>{c.code}</strong><p>{c.discount_percent}% discount · {c.expires_at ? new Date(c.expires_at).toLocaleString('en-IN') : 'No expiry'}</p><small className={c.is_active && (!c.expires_at || new Date(c.expires_at).getTime() > Date.now()) ? 'status-on' : 'status-off'}>{c.is_active && (!c.expires_at || new Date(c.expires_at).getTime() > Date.now()) ? 'Active' : 'Expired / Disabled'}</small></div><div className="admin-row-actions"><button type="button" className="table-action" onClick={() => { setEditingCouponId(c.id); setCouponForm({ code: c.code, discount_percent: String(c.discount_percent), expires_at: c.expires_at ? new Date(c.expires_at).toISOString().slice(0, 16) : '', is_active: c.is_active }); }}>Edit</button><button type="button" className="table-action danger" onClick={() => setDeleteTarget({ kind: 'coupon', id: c.id, label: c.code })}>Delete</button></div></article>)}</div></div>
        </div>}
      </section>

      {deleteTarget && <div className="admin-confirm-backdrop" role="dialog" aria-modal="true" onMouseDown={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
        <section className="admin-confirm-card">
          <div className="confirm-icon">!</div>
          <span className="panel-kicker">CONFIRM ACTION</span>
          <h2>Delete {deleteTarget.kind}?</h2>
          <p><strong>{deleteTarget.label}</strong> will be permanently removed. This action cannot be undone.</p>
          <div className="confirm-actions"><button type="button" className="secondary" onClick={() => setDeleteTarget(null)}>Cancel</button><button type="button" className="danger-fill" onClick={confirmDelete} disabled={busy}>{busy ? 'Deleting…' : 'Delete'}</button></div>
        </section>
      </div>}
    </main>
  );
}
