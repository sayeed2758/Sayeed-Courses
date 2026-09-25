'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchCourseCount,
  fetchReactionCounts,
  fetchNotifications,
  isLiveBackendConfigured,
  setRemoteReaction,
  getOrCreateSessionId,
  subscribeToLiveUpdates,
  type LiveNotification,
  type LiveVoteState,
} from '../lib/live';

const TELEGRAM_USERNAME = 'LWS_SPECIAL_SUPPORTS';
const DEFAULT_NOTIFICATIONS: LiveNotification[] = [
  {
    id: 'welcome-1',
    title: 'Welcome to Sayeed Courses',
    body: 'The course library is live. New catalogue updates will appear here.',
    type: 'info',
    created_at: new Date().toISOString(),
  },
];

const categories = [
  ['All Courses', '▦'],
  ['New Added Courses', '◷'],
  ['Coding & Tech', '</>'],
  ['AI & Automation', '◈'],
  ['Upsurge Courses', '↗'],
  ['Finance & Taxation', '▤'],
  ['Astrology & Occult', '✣'],
  ['Fitness & Health', '✚'],
  ['Dating & Relationships', '♥'],
  ['Personal Growth & Mindset', '◉'],
  ['Communication & Languages', '◌'],
  ['Video Editing & Media', '▮'],
] as const;

const sortOptions = ['Recommended', 'Newest', 'A — Z', 'Category'];

const courses = Array.from({ length: 24 }, (_, index) => {
  const categoryNames = ['Coding & Tech', 'AI & Automation', 'Finance & Taxation', 'Personal Growth & Mindset'];
  const palette = ['teal', 'orange', 'purple', 'blue'][index % 4];
  const number = index + 1;
  const rating = (4 + (((index * 7 + 3) % 11) / 10)).toFixed(1);
  return {
    id: number,
    number,
    category: categoryNames[index % categoryNames.length],
    title: ['Alpha Batch 3.0', 'Complete DSA Batch', 'AI Automation Mastery', 'Personal Growth Blueprint'][index % 4],
    educator: ['Sayeed Academy', 'Elite Faculty', 'Pro Learning', 'Master Teachers'][index % 4],
    meta: ['2026 Batch', 'Premium', 'Updated 2026', 'New Release'][index % 4],
    price: [299, 199, 399, 249][index % 4],
    palette,
    rating,
    reviews: 120 + ((index * 41) % 260),
    likes: 0,
    dislikes: 0,
  };
});

const faqs = [
  ['Courses kahan aur kaise milenge?', 'Har course ke liye authorised access method course details mein clearly diya jayega.'],
  ['Kya courses ZIP / RAR files mein honge?', 'Delivery format course ke hisaab se alag ho sakta hai. Available format course details mein mention hoga.'],
  ['Access kab tak rahega?', 'Access current course availability aur listed access policy par depend karega.'],
  ['Can I download the videos and watch them offline?', 'Sirf wahi content offline available hoga jahan downloading explicitly supported aur permitted ho.'],
  ['Course kaise purchase / order karein?', 'Course select karein, details dekhein aur listed purchase/request flow follow karein.'],
  ['Kya PDFs, assignments aur notes milenge?', 'Available resources har course ke hisaab se alag ho sakte hain aur details mein listed honge.'],
  ['New courses ki information kahan milegi?', 'New catalogue updates Notifications Center mein publish kiye ja sakte hain.'],
];

type VoteState = LiveVoteState;

type Sheet = 'category' | 'faq' | 'menu' | 'cart' | 'notifications' | null;

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (name === 'search') return <svg {...common}><circle cx="11" cy="11" r="6.8" /><path d="m16.2 16.2 4.2 4.2" /></svg>;
  if (name === 'menu') return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
  if (name === 'x') return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  if (name === 'refresh') return <svg {...common}><path d="M20 11a8.5 8.5 0 0 0-14.7-5L4 8" /><path d="M4 4v4h4" /><path d="M4 13a8.5 8.5 0 0 0 14.7 5L20 16" /><path d="M20 20v-4h-4" /></svg>;
  if (name === 'help') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.7 2.7 0 1 1 4.5 2c-1.4 1-2 1.5-2 3" /><path d="M12 17.4h.01" /></svg>;
  if (name === 'send') return <svg {...common}><path d="m21 3-7.6 18-3.9-8.5L1 8.6 21 3Z" /><path d="m9.5 12.5 5-5" /></svg>;
  if (name === 'bag') return <svg {...common}><path d="M6.5 8.5h11l1 12h-13l1-12Z" /><path d="M9 8.5V6.7a3 3 0 0 1 6 0v1.8" /></svg>;
  if (name === 'bell') return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>;
  if (name === 'download') return <svg {...common}><path d="M12 3v11" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M5 20h14" /></svg>;
  if (name === 'mic') return <svg {...common}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8" /></svg>;
  if (name === 'layers') return <svg {...common}><path d="m12 3 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4" /><path d="m4 17 8 4 8-4" /></svg>;
  if (name === 'chevron') return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>;
  return null;
}

function Loader({ done }: { done: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(done, 1650);
    return () => window.clearTimeout(timer);
  }, [done]);

  return (
    <div className="boot-loader">
      <div className="loader-core">
        <div className="loader-logo-wrap"><img src="/shahid-logo.png" alt="Sayeed" /></div>
        <div className="loader-brand">SAYEED <span>COURSES</span></div>
        <div className="loader-subtitle">PREMIUM COURSE HUB</div>
        <div className="loader-progress"><span /></div>
        <div className="loader-status"><i /> Loading course library...</div>
      </div>
    </div>
  );
}

function getTelegramUrl(message?: string) {
  const base = `https://t.me/${TELEGRAM_USERNAME}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

function CourseArtwork({ course }: { course: (typeof courses)[number] }) {
  return (
    <div className={`course-art ${course.palette}`}>
      <div className="art-code" aria-hidden="true">0101100101 0010110010 1011010001</div>
      <div className="art-orb art-orb-one" />
      <div className="art-orb art-orb-two" />
      <div className="art-topline"><span>#{String(course.number).padStart(3, '0')}</span><b>₹ {course.price}</b></div>
      <div className="art-brand">SAYEED</div>
    </div>
  );
}

function CourseCard({
  course,
  vote,
  onVote,
  inCart,
  onCartToggle,
}: {
  course: (typeof courses)[number];
  vote: VoteState;
  onVote: (id: number, next: 'like' | 'dislike') => void;
  inCart: boolean;
  onCartToggle: (id: number) => void;
}) {
  return (
    <article className="course-card">
      <CourseArtwork course={course} />
      <div className="course-body">
        <div className="course-pills">
          <span className="price-pill">₹{course.price}</span>
          <span className="rating-pill">★ {course.rating} <small>({course.reviews})</small></span>
          <span className="category-pill">&lt;/&gt; {course.category}</span>
        </div>

        <div className="engagement-row" aria-label={`Reactions for ${course.title}`}>
          <button className={vote.userVote === 'like' ? 'reaction-button like active' : 'reaction-button like'} type="button" onClick={() => onVote(course.id, 'like')} aria-pressed={vote.userVote === 'like'}>
            <span>{vote.userVote === 'like' ? '✓' : '👍'}</span> {vote.likes}
          </button>
          <button className={vote.userVote === 'dislike' ? 'reaction-button dislike active' : 'reaction-button dislike'} type="button" onClick={() => onVote(course.id, 'dislike')} aria-pressed={vote.userVote === 'dislike'}>
            <span>{vote.userVote === 'dislike' ? '✕' : '👎'}</span> {vote.dislikes}
          </button>
        </div>

        <h3>{course.number}. {course.title}</h3>
        <p>{course.educator} · {course.meta}</p>
        <div className="course-actions">
          <a className="unlock-button" href={getTelegramUrl(`Hi, I want to know more about course: ${course.title} (₹${course.price})`)} target="_blank" rel="noreferrer">↪&nbsp; Unlock Course · ₹{course.price}</a>
          <button className={inCart ? 'cart-button-small saved' : 'cart-button-small'} type="button" onClick={() => onCartToggle(course.id)} aria-pressed={inCart}>
            {inCart ? '✓ In Cart' : '🛒 Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All Courses');
  const [sort, setSort] = useState('Recommended');
  const [sortOpen, setSortOpen] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [installHint, setInstallHint] = useState('');
  const [cartIds, setCartIds] = useState<number[]>([]);
  const [votes, setVotes] = useState<Record<number, VoteState>>({});
  const [notifications, setNotifications] = useState<LiveNotification[]>(DEFAULT_NOTIFICATIONS);
  const [readNotifications, setReadNotifications] = useState<string[]>([]);
  const [catalogueCount, setCatalogueCount] = useState(courses.length);
  const [toast, setToast] = useState('');
  const pendingVoteIds = useRef(new Set<number>());
  const voteRequestSeq = useRef<Record<number, number>>({});

  const liveBackend = isLiveBackendConfigured();

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }, []);

  const loadLiveData = useCallback(async () => {
    if (!liveBackend) return;
    const [remoteVotes, remoteCount, remoteNotifications] = await Promise.all([
      fetchReactionCounts(courses.map(course => course.id)),
      fetchCourseCount(),
      fetchNotifications(),
    ]);
    if (remoteVotes) {
      setVotes(current => {
        const next = { ...current };
        for (const row of remoteVotes) {
          if (pendingVoteIds.current.has(row.course_id)) continue;
          next[row.course_id] = {
            likes: row.likes,
            dislikes: row.dislikes,
            userVote: row.userVote,
          };
        }
        return next;
      });
    }
    if (typeof remoteCount === 'number') setCatalogueCount(remoteCount);
    if (remoteNotifications?.length) setNotifications(remoteNotifications);
  }, [liveBackend]);

  useEffect(() => {
    try {
      const savedCart = JSON.parse(window.localStorage.getItem('sayeed_courses_cart_v2') || '[]');
      if (Array.isArray(savedCart)) setCartIds(savedCart.filter((id): id is number => Number.isInteger(id)));
      const savedVotes = JSON.parse(window.localStorage.getItem('sayeed_courses_votes_v4') || window.localStorage.getItem('sayeed_courses_votes_v3') || '{}');
      if (savedVotes && typeof savedVotes === 'object') {
        const normalized: Record<number, VoteState> = {};
        for (const [key, value] of Object.entries(savedVotes as Record<string, unknown>)) {
          const row = value as Partial<VoteState> | null;
          if (!row || typeof row !== 'object') continue;
          normalized[Number(key)] = {
            likes: Number.isFinite(Number(row.likes)) ? Number(row.likes) : 0,
            dislikes: Number.isFinite(Number(row.dislikes)) ? Number(row.dislikes) : 0,
            userVote: row.userVote === 'like' || row.userVote === 'dislike' ? row.userVote : null,
          };
        }
        setVotes(normalized);
      }
      const savedReads = JSON.parse(window.localStorage.getItem('sayeed_notifications_read_v1') || '[]');
      if (Array.isArray(savedReads)) setReadNotifications(savedReads.filter((id): id is string => typeof id === 'string'));
      getOrCreateSessionId();
    } catch {
      setCartIds([]);
      setVotes({});
      setReadNotifications([]);
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault?.();
      setDeferredPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  useEffect(() => {
    loadLiveData();
    if (!liveBackend) return undefined;
    const unsubscribe = subscribeToLiveUpdates(() => { void loadLiveData(); });
    const timer = window.setInterval(() => { void loadLiveData(); }, 10000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [loadLiveData, liveBackend]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = courses.filter(course => {
      const matchesCategory = category === 'All Courses' || course.category === category;
      const haystack = `${course.title} ${course.educator} ${course.category} ${course.number}`.toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
    if (sort === 'Newest') result = [...result].sort((a, b) => b.number - a.number);
    if (sort === 'A — Z') result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'Category') result = [...result].sort((a, b) => a.category.localeCompare(b.category));
    return result;
  }, [query, category, sort]);

  const cartCourses = cartIds.map(id => courses.find(course => course.id === id)).filter((course): course is (typeof courses)[number] => Boolean(course));
  const cartTotal = cartCourses.reduce((sum, course) => sum + course.price, 0);
  const unreadCount = notifications.filter(item => !readNotifications.includes(String(item.id))).length;

  function getVote(id: number): VoteState {
    const base = courses.find(course => course.id === id);
    return votes[id] || { likes: base?.likes || 0, dislikes: base?.dislikes || 0, userVote: null };
  }

  async function handleVote(id: number, next: 'like' | 'dislike') {
    const current = getVote(id);
    let likes = current.likes;
    let dislikes = current.dislikes;
    let userVote: VoteState['userVote'] = current.userVote;

    if (userVote === next) {
      if (next === 'like') likes = Math.max(0, likes - 1);
      else dislikes = Math.max(0, dislikes - 1);
      userVote = null;
    } else {
      if (userVote === 'like') likes = Math.max(0, likes - 1);
      if (userVote === 'dislike') dislikes = Math.max(0, dislikes - 1);
      if (next === 'like') likes += 1;
      else dislikes += 1;
      userVote = next;
    }

    const optimistic: VoteState = { likes, dislikes, userVote };
    voteRequestSeq.current[id] = (voteRequestSeq.current[id] || 0) + 1;
    const requestId = voteRequestSeq.current[id];
    pendingVoteIds.current.add(id);

    setVotes(currentVotes => {
      const nextVotes = { ...currentVotes, [id]: optimistic };
      try {
        window.localStorage.setItem('sayeed_courses_votes_v4', JSON.stringify(nextVotes));
      } catch {}
      return nextVotes;
    });
    showToast(next === 'like' ? 'Liked Course 👍' : 'Disliked Course 👎');

    if (!liveBackend) {
      pendingVoteIds.current.delete(id);
      return;
    }

    try {
      const remote = await setRemoteReaction(id, next);
      if (requestId !== voteRequestSeq.current[id]) return;
      if (remote) {
        const normalizedRemote: VoteState = {
          likes: Number.isFinite(Number(remote.likes)) ? Number(remote.likes) : likes,
          dislikes: Number.isFinite(Number(remote.dislikes)) ? Number(remote.dislikes) : dislikes,
          userVote: remote.userVote === 'like' || remote.userVote === 'dislike' ? remote.userVote : null,
        };
        setVotes(currentVotes => {
          const nextVotes = { ...currentVotes, [id]: normalizedRemote };
          try {
            window.localStorage.setItem('sayeed_courses_votes_v4', JSON.stringify(nextVotes));
          } catch {}
          return nextVotes;
        });
      }
    } finally {
      if (requestId === voteRequestSeq.current[id]) pendingVoteIds.current.delete(id);
    }
  }

  function toggleCart(id: number) {
    setCartIds(current => {
      const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id];
      window.localStorage.setItem('sayeed_courses_cart_v2', JSON.stringify(next));
      return next;
    });
  }

  function refreshCatalogue() {
    setRefreshing(true);
    window.setTimeout(() => window.location.reload(), 500);
  }

  async function handleInstall() {
    if (deferredPrompt) {
      const promptEvent = deferredPrompt as Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };
      await promptEvent.prompt?.();
      await promptEvent.userChoice?.catch(() => undefined);
      setDeferredPrompt(null);
      return;
    }
    setInstallHint('Open browser menu → Add to Home screen / Install app.');
    window.setTimeout(() => setInstallHint(''), 4200);
  }

  function openNotifications() {
    setSheet('notifications');
    const allIds = notifications.map(item => String(item.id));
    setReadNotifications(allIds);
    window.localStorage.setItem('sayeed_notifications_read_v1', JSON.stringify(allIds));
  }

  function buyAllOnTelegram() {
    const lines = cartCourses.map((course, index) => `${index + 1}. ${course.title} (₹${course.price})`);
    const message = `Hey, I want to purchase these ${cartCourses.length} courses:\n\n${lines.join('\n')}\n\nTotal Package: ₹${cartTotal}\n\nPlease share payment details for instant access!`;
    window.open(getTelegramUrl(message), '_blank', 'noopener,noreferrer');
  }

  if (loading) return <Loader done={() => setLoading(false)} />;

  return (
    <main className="reference-app">
      <header className="top-header">
        <div className="top-header-inner">
          <a href="#top" className="brand-lockup" aria-label="Sayeed Courses home">
            <span className="brand-logo-image"><img src="/shahid-logo.png" alt="Sayeed logo" /></span>
            <span className="brand-copy"><strong><span>SAYEED</span><i>COURSES</i></strong><small>YOUR NEXT SKILL STARTS HERE</small></span>
          </a>

          <div className="top-actions">
            <button className="app-button" type="button" onClick={handleInstall} title="Install App"><Icon name="download" size={17} /><span>APP</span></button>
            <button className="header-icon-button faq-button" type="button" onClick={() => setSheet('faq')} title="FAQs"><Icon name="help" size={19} /><span>FAQs</span></button>
            <a className="header-icon-button cyan" href={getTelegramUrl()} target="_blank" rel="noreferrer" aria-label="Telegram support" title={TELEGRAM_USERNAME}><Icon name="send" size={19} /></a>
            {cartCourses.length > 0 && <button className="header-icon-button cart-head-button" type="button" onClick={() => setSheet('cart')} aria-label="Open cart" title="Cart"><Icon name="bag" size={18} /><b>{cartCourses.length}</b></button>}
            <button className={refreshing ? 'header-icon-button spinning' : 'header-icon-button'} type="button" onClick={refreshCatalogue} aria-label="Refresh app" title="Refresh"><Icon name="refresh" size={19} /></button>
            <button className="header-icon-button menu-button" type="button" onClick={() => setSheet('menu')} aria-label="Menu"><Icon name="menu" size={21} /></button>
          </div>
        </div>
      </header>

      <button className="floating-notification" type="button" onClick={openNotifications} aria-label="Open notifications" title="Notifications">
        <Icon name="bell" size={19} />
        {unreadCount > 0 && <b>{unreadCount > 9 ? '9+' : unreadCount}</b>}
      </button>

      <section id="top" className="hero-reference">
        <div className="hero-backdrop-grid" />
        <div className="hero-shape shape-a" />
        <div className="hero-shape shape-b" />
        <div className="reference-tools">
          <div className="verified-pill"><i /> {catalogueCount.toLocaleString('en-IN')} Verified Courses Available</div>
          <div className="search-reference">
            <Icon name="search" size={26} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search course by name or # number..." aria-label="Search courses" />
            {query && <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear search"><Icon name="x" size={17} /></button>}
            <button className="mic-button" type="button" aria-label="Voice search" title="Voice search"><Icon name="mic" size={19} /></button>
          </div>
        </div>
      </section>

      <section id="courses" className="catalogue-reference">
        <div className="library-head reference-library-head">
          <div><span className="section-kicker">THE LIBRARY</span><h2>All Courses <span>({catalogueCount.toLocaleString('en-IN')})</span></h2></div>
          <div className="sort-reference-wrap">
            <button className="sort-reference" type="button" onClick={() => setSortOpen(v => !v)}>↕ Sort <Icon name="chevron" size={15} /></button>
            {sortOpen && <div className="sort-reference-menu">{sortOptions.map(item => <button key={item} type="button" className={item === sort ? 'selected' : ''} onClick={() => { setSort(item); setSortOpen(false); }}>{item}<span>{item === sort ? '✓' : ''}</span></button>)}</div>}
          </div>
        </div>

        <div className="course-grid-reference">
          {filtered.map(course => <CourseCard key={course.id} course={course} vote={getVote(course.id)} onVote={handleVote} inCart={cartIds.includes(course.id)} onCartToggle={toggleCart} />)}
        </div>

        {filtered.length === 0 && <div className="empty-reference"><strong>No courses found</strong><span>Try another keyword or reset the search.</span><button type="button" onClick={() => { setQuery(''); setCategory('All Courses'); }}>RESET SEARCH</button></div>}
      </section>

      <section className="cta-reference">
        <span className="section-kicker">NEED SOMETHING?</span>
        <h2>Request a course.</h2>
        <p>Tell us what should be added to the next catalogue update.</p>
        <a href={getTelegramUrl('Hi, I want to request a course.')} target="_blank" rel="noreferrer">REQUEST COURSE ↗</a>
      </section>

      <footer className="footer-reference"><strong>SAYEED <i>COURSES</i></strong><span>© 2026 · Premium Course Hub · {TELEGRAM_USERNAME}</span></footer>

      {toast && <div className="toast-message" role="status">{toast}</div>}
      {installHint && <div className="install-hint" role="status">{installHint}</div>}

      {sheet && (
        <div className="sheet-overlay" role="dialog" aria-modal="true" onMouseDown={e => { if (e.target === e.currentTarget) setSheet(null); }}>
          <aside className="reference-sheet">
            {sheet === 'category' && (
              <>
                <div className="sheet-header"><div className="sheet-title-icon"><Icon name="layers" size={23} /></div><h2>Course Categories</h2><button type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={21} /></button></div>
                <p className="sheet-intro">Tap a category to filter courses:</p>
                <div className="category-drawer-list">{categories.map(([name, symbol]) => <button key={name} type="button" className={name === category ? 'drawer-category active' : 'drawer-category'} onClick={() => { setCategory(name); setSheet(null); }}><span className="drawer-icon">{symbol}</span><strong>{name}</strong><b>{name === 'All Courses' ? catalogueCount : courses.filter(course => course.category === name).length}</b></button>)}</div>
              </>
            )}

            {sheet === 'faq' && (
              <>
                <div className="sheet-header faq-header"><div className="faq-mark">?</div><h2>Frequently Asked<br />Questions (Q&amp;A)</h2><button type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={21} /></button></div>
                <div className="faq-scroll"><div className="faq-answer-guide">Delivery, Quality, Payment &amp; Access Guidelines:</div><button className="collapse-all-reference" type="button" onClick={() => setFaqOpen(null)}>Collapse All&nbsp;⌃</button><div className="faq-reference-list">{faqs.map(([title, answer], index) => { const open = faqOpen === index; return <div className={open ? 'faq-reference-row open' : 'faq-reference-row'} key={title}><button type="button" onClick={() => setFaqOpen(open ? null : index)}><span className="faq-number">{String(index + 1).padStart(2, '0')}</span><strong>{title}</strong><span className="faq-chevron">{open ? '⌃' : '⌄'}</span></button>{open && <div className="faq-answer-card"><h3>{index === 6 ? 'Notification Center' : 'Answer'}</h3><p>{answer}</p></div>}</div>; })}</div></div>
              </>
            )}

            {sheet === 'menu' && (
              <>
                <div className="sheet-header"><div className="sheet-title-icon"><Icon name="menu" size={23} /></div><h2>Your Course Hub</h2><button type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={21} /></button></div>
                <div className="menu-reference-list">
                  <button type="button" onClick={() => setSheet('faq')}>❓ FAQs <span>→</span></button>
                  <button type="button" onClick={() => setSheet('category')}>▦ Categories <span>→</span></button>
                  <button type="button" onClick={() => setSheet('cart')}>🛒 My Cart <span>{cartCourses.length}</span></button>
                  <button type="button" onClick={openNotifications}>🔔 Notifications <span>{unreadCount}</span></button>
                  <button type="button" onClick={handleInstall}>⬇ Install App <span>→</span></button>
                  <a href={getTelegramUrl()} target="_blank" rel="noreferrer">✈ Telegram Support <span>↗</span></a>
                </div>
              </>
            )}

            {sheet === 'notifications' && (
              <>
                <div className="sheet-header"><div className="sheet-title-icon notification-icon"><Icon name="bell" size={23} /></div><h2>Notifications</h2><button type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={21} /></button></div>
                <p className="sheet-intro">New course updates and important announcements will appear here.</p>
                <div className="notification-list">{notifications.map(item => <article className={`notification-card ${item.type || 'info'}`} key={item.id}><span className="notification-dot" /><div><strong>{item.title}</strong><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString('en-IN')}</small></div></article>)}</div>
              </>
            )}

            {sheet === 'cart' && (
              <>
                <div className="sheet-header"><div className="sheet-title-icon"><Icon name="bag" size={23} /></div><h2>Selected Courses Cart ({cartCourses.length})</h2><button type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={21} /></button></div>
                {cartCourses.length === 0 ? <div className="bag-reference-empty"><div className="bag-big"><Icon name="bag" size={30} /></div><h3>Your cart is empty</h3><p>Save courses from the catalogue and they will appear here with a live total.</p><button type="button" onClick={() => setSheet(null)}>BROWSE COURSES</button></div> : <div className="cart-reference"><div className="cart-summary"><div><small>{cartCourses.length} {cartCourses.length === 1 ? 'course' : 'courses'} selected</small><strong>₹{cartTotal.toLocaleString('en-IN')}</strong></div><span>LIVE TOTAL</span></div><div className="cart-list">{cartCourses.map(course => <div className="cart-row" key={course.id}><div><small>#{String(course.number).padStart(3, '0')} · {course.category}</small><strong>{course.title}</strong></div><div className="cart-row-actions"><b>₹{course.price}</b><button type="button" onClick={() => toggleCart(course.id)} aria-label={`Remove ${course.title}`}>✕</button></div></div>)}</div><div className="cart-grand-total"><span>Combined Total</span><strong>₹{cartTotal.toLocaleString('en-IN')}</strong></div><div className="cart-actions"><button type="button" className="clear-cart" onClick={() => { setCartIds([]); window.localStorage.removeItem('sayeed_courses_cart_v2'); }}>🗑 Clear Cart</button><button type="button" className="buy-all" onClick={buyAllOnTelegram}>✈ Buy All Courses on Telegram</button></div></div>}
              </>
            )}
          </aside>
        </div>
      )}

      {cartCourses.length > 0 && <div className="floating-cart-bar"><button type="button" className="floating-cart-count" onClick={() => setSheet('cart')}><Icon name="bag" size={18} /><b>{cartCourses.length}</b></button><button type="button" className="floating-view-cart" onClick={() => setSheet('cart')}>☷ View Cart</button><button type="button" className="floating-buy" onClick={buyAllOnTelegram}>✈ Buy All on Telegram</button></div>}
    </main>
  );
}
