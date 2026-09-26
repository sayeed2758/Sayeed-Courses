'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const code = params.get('error');
    if (code === 'forbidden') setError('This account is not authorised for the admin panel.');
  }, [params]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      router.replace('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
      setBusy(false);
    }
  }

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <div className="admin-brand-mark">SC</div>
        <span className="admin-kicker">PRIVATE CONTROL ROOM</span>
        <h1>Admin Sign In</h1>
        <p>
          Only accounts explicitly added to the Supabase <strong>admin_users</strong> allowlist can enter.
        </p>
        <form onSubmit={submit} className="admin-login-form">
          <label>
            Email
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && <div className="admin-error">{error}</div>}
          <button type="submit" disabled={busy}>
            {busy ? 'CHECKING ACCESS…' : 'ENTER ADMIN PANEL'}
          </button>
        </form>
        <a href="/" className="admin-back-link">← Back to public site</a>
      </section>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <main className="admin-login-shell">
        <section className="admin-login-card">
          <div className="admin-brand-mark">SC</div>
          <span className="admin-kicker">PRIVATE CONTROL ROOM</span>
          <h1>Admin Sign In</h1>
          <p>Loading secure sign-in…</p>
        </section>
      </main>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
