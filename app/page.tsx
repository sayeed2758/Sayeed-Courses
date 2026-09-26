'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchCourseCatalogue,
  fetchCourseCount,
  fetchReactionCounts,
  fetchNotifications,
  isLiveBackendConfigured,
  setRemoteReaction,
  validateCoupon,
  getOrCreateSessionId,
  type LiveCourse,
  type LiveNotification,
  type LiveVoteState,
} from '../lib/live';

const TELEGRAM_USERNAME = 'LWS_SPECIAL_SUPPORTS';

const DEMO_COURSES: LiveCourse[] = Array.from({ length: 24 }, (_, index) => {
  const titles = [
    'Alpha Batch 3.0',
    'Complete DSA Batch',
    'AI Automation Mastery',
    'Personal Growth Blueprint',
    'Advanced Web Development',
    'Python Pro Bootcamp',
    'UI/UX Design Mastery',
    'Digital Marketing Accelerator',
  ];
  const categoryNames = ['Coding & Tech', 'AI & Automation', 'Finance & Taxation', 'Personal Growth & Mindset'];
  const palette = ['teal', 'orange', 'purple', 'blue'][index % 4];
  return {
    id: index + 1,
    number: index + 1,
    title: titles[index % titles.length],
    category: categoryNames[index % categoryNames.length],
    price: [299, 199, 399, 249][index % 4],
    rating: Number((4 + (((index * 7 + 3) % 11) / 10)).toFixed(1)),
    reviews: 120 + ((index * 41) % 260),
    initial_likes: 0,
    initial_dislikes: 0,
    thumbnail_url: null,
    telegram_url: null,
    palette,
    created_at: new Date(2026, 8, Math.min(25, index + 1), 12, 0, 0).toISOString(),
  };
});

const CATEGORIES = [
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

const SORT_OPTIONS = ['Recommended', 'Newest', 'A — Z', 'Category'] as const;

const FAQS = [
  ['Courses kahan aur kaise milenge?', 'Har course ka authorised access method uske details mein clearly diya jayega.'],
  ['Kya courses ZIP / RAR files mein honge?', 'Delivery format course ke according hoga. Available format course details mein mention hoga.'],
  ['Access kab tak rahega?', 'Access listed course availability aur access policy ke according rahega.'],
  ['Can I download the videos and watch them offline?', 'Sirf wahi content offline available hoga jahan downloading explicitly supported aur permitted ho.'],
  ['Course kaise purchase / order karein?', 'Course ko cart mein save karein aur Buy All Courses on Telegram se purchase request bhejein.'],
  ['Kya PDFs, assignments aur notes milenge?', 'Available resources har course ke hisaab se alag ho sakte hain aur details mein listed honge.'],
  ['New courses ki information kahan milegi?', 'New catalogue updates Notifications Center mein publish kiye ja sakte hain.'],
] as const;

const DEFAULT_NOTIFICATIONS: LiveNotification[] = [
  {
    id: 'welcome-1',
    title: 'Welcome to Sayeed Courses',
    body: 'New course updates and important announcements will appear here.',
    type: 'info',
    created_at: '2026-09-25T12:00:00.000Z',
  },
];

type VoteState = LiveVoteState;
type Sheet = 'category' | 'faq' | 'cart' | 'notifications' | null;

type AppliedCoupon = {
  code: string;
  percent: number;
  message: string;
};

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
  if (name === 'ticket') return <svg {...common}><path d="M4 7h16v4a2 2 0 0 0 0 4v2H4v-2a2 2 0 0 0 0-4V7Z" /><path d="M12 8v1M12 15v1" /></svg>;
  return null;
}

function getTelegramUrl(message?: string) {
  const base = `https://t.me/${TELEGRAM_USERNAME}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

function Loader({ count, done }: { count: number; done: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(done, 1550);
    return () => window.clearTimeout(timer);
  }, [done]);

  return (
    <div className="boot-loader">
      <div className="loader-glow loader-glow-a" />
      <div className="loader-glow loader-glow-b" />
      <div className="loader-core">
        <div className="loader-logo-wrap"><img src="/shahid-logo.png" alt="Sayeed Courses" /></div>
        <div className="loader-brand"><b>SAYEED</b> <span>COURSES</span></div>
        <div className="loader-subtitle">PREMIUM COURSE HUB</div>
        <div className="loader-progress"><span /></div>
        <div className="loader-status"><i /> Loading {count} courses...</div>
      </div>
    </div>
  );
}

function CourseArtwork({ course, mini = false }: { course: LiveCourse; mini?: boolean }) {
  const palette = course.palette || ['teal', 'orange', 'purple', 'blue'][(course.number - 1) % 4];
  return (
    <div className={`course-art ${palette} ${mini ? 'mini' : ''}`}>
      {course.thumbnail_url ? (
        <img src={course.thumbnail_url} alt="" loading="lazy" />
      ) : (
        <>
          <div className="art-code">0101100101 0010110010 1011010001</div>
          <div className="art-orb art-orb-one" />
          <div className="art-orb art-orb-two" />
        </>
      )}
      <div className="art-topline"><span>#{String(course.number).padStart(3, '0')}</span><b>₹{course.price.toLocaleString('en-IN')}</b></div>
      {!mini && <div className="art-brand">SAYEED</div>}
    </div>
  );
}

function CourseCard({
  course,
  vote,
  inCart,
  onVote,
  onCartToggle,
}: {
  course: LiveCourse;
  vote: VoteState;
  inCart: boolean;
  onVote: (id: number, reaction: 'like' | 'dislike') => void;
  onCartToggle: (id: number) => void;
}) {
  return (
    <article className="course-card">
      <CourseArtwork course={course} />
      <div className="course-body">
        <div className="course-pills">
          <span className="price-pill">₹{course.price.toLocaleString('en-IN')}</span>
          <span className="rating-pill">★ {course.rating.toFixed(1)} <small>({course.reviews})</small></span>
          <span className="category-pill">&lt;/&gt; {course.category}</span>
        </div>

        <div className="engagement-row" aria-label={`Reactions for ${course.title}`}>
          <button className={`reaction-button like ${vote.userVote === 'like' ? 'active' : ''}`} type="button" onClick={() => onVote(course.id, 'like')} aria-pressed={vote.userVote === 'like'}>
            <span>👍</span> {vote.likes}
          </button>
          <button className={`reaction-button dislike ${vote.userVote === 'dislike' ? 'active' : ''}`} type="button" onClick={() => onVote(course.id, 'dislike')} aria-pressed={vote.userVote === 'dislike'}>
            <span>👎</span> {vote.dislikes}
          </button>
        </div>

        <h3>{course.number}. {course.title}</h3>
        <div className="course-actions">
          <a className="unlock-button" href={course.telegram_url || getTelegramUrl(`Hi, I want to know more about course: ${course.title} (₹${course.price})`)} target="_blank" rel="noreferrer">
            ↪&nbsp; Unlock Course · ₹{course.price.toLocaleString('en-IN')}
          </a>
          <button className={`cart-button-small ${inCart ? 'saved' : ''}`} type="button" onClick={() => onCartToggle(course.id)} aria-pressed={inCart}>
            {inCart ? '✓ In Cart' : '🛒 Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<LiveCourse[]>(DEMO_COURSES);
  const [catalogueCount, setCatalogueCount] = useState(DEMO_COURSES.length);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All Courses');
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>('Recommended');
  const [sortOpen, setSortOpen] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [cartIds, setCartIds] = useState<number[]>([]);
  const [votes, setVotes] = useState<Record<number, VoteState>>({});
  const [notifications, setNotifications] = useState<LiveNotification[]>(DEFAULT_NOTIFICATIONS);
  const [readNotifications, setReadNotifications] = useState<string[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [installHint, setInstallHint] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const liveBackend = isLiveBackendConfigured();

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }, []);

  const loadLiveData = useCallback(async () => {
    if (!liveBackend) return;

    const [remoteCourses, remoteCount, remoteNotifications] = await Promise.all([
      fetchCourseCatalogue(),
      fetchCourseCount(),
      fetchNotifications(),
    ]);

    const sourceCourses = remoteCourses ?? DEMO_COURSES;
    if (remoteCourses) {
      setCourses(remoteCourses);
      setCatalogueCount(remoteCourses.length);
    } else if (typeof remoteCount === 'number') {
      setCatalogueCount(remoteCount);
    }

    const remoteVotes = await fetchReactionCounts(sourceCourses.map(course => course.id));
    if (remoteVotes) {
      setVotes(current => {
        const next = { ...current };
        for (const row of remoteVotes) {
          const existing = next[row.course_id];
          next[row.course_id] = {
            likes: Number(row.likes) || 0,
            dislikes: Number(row.dislikes) || 0,
            userVote: existing?.userVote ?? null,
          };
        }
        window.localStorage.setItem('sayeed_courses_votes_v4', JSON.stringify(next));
        return next;
      });
    }

    if (remoteNotifications) setNotifications(remoteNotifications);
  }, [liveBackend]);

  useEffect(() => {
    void loadLiveData();
    if (!liveBackend) return undefined;
    const timer = window.setInterval(() => { void loadLiveData(); }, 5000);
    return () => window.clearInterval(timer);
  }, [loadLiveData, liveBackend]);

  useEffect(() => {
    if (!sheet && !sortOpen) return undefined;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSortOpen(false); setSheet(null); }
    };
    window.addEventListener('keydown', keyHandler);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', keyHandler); };
  }, [sheet, sortOpen]);

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = courses.filter(course => {
      const categoryMatch = category === 'All Courses' || course.category === category || (category === 'New Added Courses' && course.number > Math.max(1, courses.length - 8));
      const haystack = `${course.title} ${course.category} ${course.number}`.toLowerCase();
      return categoryMatch && (!q || haystack.includes(q));
    });
    if (sort === 'Newest') result = [...result].sort((a, b) => b.number - a.number);
    if (sort === 'A — Z') result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'Category') result = [...result].sort((a, b) => a.category.localeCompare(b.category));
    return result;
  }, [courses, query, category, sort]);

  const cartCourses = useMemo(() => cartIds.map(id => courses.find(course => course.id === id)).filter((course): course is LiveCourse => Boolean(course)), [cartIds, courses]);
  const cartSubtotal = cartCourses.reduce((sum, course) => sum + Number(course.price), 0);
  const discountAmount = appliedCoupon ? Math.round((cartSubtotal * appliedCoupon.percent) / 100) : 0;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);
  const unreadCount = notifications.filter(item => !readNotifications.includes(String(item.id))).length;

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { 'All Courses': catalogueCount };
    for (const [name] of CATEGORIES) if (name !== 'All Courses') map[name] = courses.filter(course => course.category === name).length;
    return map;
  }, [courses, catalogueCount]);

  function getVote(id: number): VoteState {
    const course = courses.find(item => item.id === id);
    return votes[id] || { likes: Number(course?.likes) || 0, dislikes: Number(course?.dislikes) || 0, userVote: null };
  }

  async function handleVote(id: number, next: 'like' | 'dislike') {
    const previous = getVote(id);
    let likes = previous.likes;
    let dislikes = previous.dislikes;
    let userVote: VoteState['userVote'] = previous.userVote;

    if (previous.userVote === next) {
      if (next === 'like') likes = Math.max(0, likes - 1);
      else dislikes = Math.max(0, dislikes - 1);
      userVote = null;
    } else {
      if (previous.userVote === 'like') likes = Math.max(0, likes - 1);
      if (previous.userVote === 'dislike') dislikes = Math.max(0, dislikes - 1);
      if (next === 'like') likes += 1;
      else dislikes += 1;
      userVote = next;
    }

    const optimistic: VoteState = { likes, dislikes, userVote };
    setVotes(current => {
      const nextState = { ...current, [id]: optimistic };
      window.localStorage.setItem('sayeed_courses_votes_v4', JSON.stringify(nextState));
      return nextState;
    });
    showToast(next === 'like' ? 'Liked Course 👍' : 'Disliked Course 👎');

    if (liveBackend) {
      const remote = await setRemoteReaction(id, next);
      if (remote) {
        const normalized: VoteState = {
          likes: Number(remote.likes) || 0,
          dislikes: Number(remote.dislikes) || 0,
          userVote: remote.userVote === 'like' || remote.userVote === 'dislike' ? remote.userVote : null,
        };
        setVotes(current => {
          const nextState = { ...current, [id]: normalized };
          window.localStorage.setItem('sayeed_courses_votes_v4', JSON.stringify(nextState));
          return nextState;
        });
      }
    }
  }

  function toggleCart(id: number) {
    setCartIds(current => {
      const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id];
      window.localStorage.setItem('sayeed_courses_cart_v3', JSON.stringify(next));
      if (current.includes(id)) setAppliedCoupon(null);
      else if (next.length === 0) setAppliedCoupon(null);
      return next;
    });
  }

  function clearCart() {
    setCartIds([]);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponOpen(false);
    setCouponError('');
    window.localStorage.removeItem('sayeed_courses_cart_v3');
  }

  async function applyCoupon() {
    const code = couponCode.trim();
    if (!code) {
      setCouponError('Not Valid');
      return;
    }
    setCouponBusy(true);
    setCouponError('');
    const result = await validateCoupon(code, cartSubtotal);
    setCouponBusy(false);
    if (!result || result.status === 'not_valid') {
      setAppliedCoupon(null);
      setCouponError('Not Valid');
      showToast('Coupon Not Valid');
      return;
    }
    if (result.status === 'expired') {
      setAppliedCoupon(null);
      setCouponError('Coupon Expired');
      showToast('Coupon Expired');
      return;
    }
    setAppliedCoupon({ code: result.code || code.toUpperCase(), percent: Number(result.discount_percent) || 0, message: result.message || 'Coupon applied' });
    setCouponError('');
    setCouponOpen(false);
    showToast(`${result.discount_percent}% Coupon Applied 🎉`);
  }

  function refreshApp() {
    setRefreshing(true);
    window.setTimeout(() => window.location.reload(), 350);
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
    window.localStorage.setItem('sayeed_notifications_read_v2', JSON.stringify(allIds));
  }

  function buyAllOnTelegram() {
    if (!cartCourses.length) return;
    const lines = cartCourses.map((course, index) => `${index + 1}. ${course.title} (₹${course.price})`);
    const couponLine = appliedCoupon ? `\nCoupon: ${appliedCoupon.code} (${appliedCoupon.percent}% off)\nDiscount: ₹${discountAmount}` : '';
    const message = `Hey, I want to purchase these ${cartCourses.length} courses:\n\n${lines.join('\n')}\n\nSubtotal: ₹${cartSubtotal}${couponLine}\nTotal Package: ₹${cartTotal}\n\nPlease share payment details for instant access!`;
    window.open(getTelegramUrl(message), '_blank', 'noopener,noreferrer');
  }

  if (loading) return <Loader count={catalogueCount} done={() => setLoading(false)} />;

  return (
    <main className="reference-app">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <header className="top-header">
        <div className="top-header-inner">
          <a href="#top" className="brand-lockup" aria-label="Sayeed Courses home">
            <span className="brand-logo-image"><img src="/shahid-logo.png" alt="Sayeed logo" /></span>
            <span className="brand-copy">
              <strong><span>SAYEED</span><i>COURSES</i></strong>
              <small>YOUR NEXT SKILL STARTS HERE</small>
            </span>
          </a>

          <div className="top-actions">
            <button className="app-button" type="button" onClick={handleInstall} title="Install App"><Icon name="download" size={17} /><span>APP</span></button>
            <button className="header-icon-button faq-button" type="button" onClick={() => setSheet('faq')} title="FAQs"><Icon name="help" size={19} /><span>FAQs</span></button>
            <a className="header-icon-button cyan" href={getTelegramUrl()} target="_blank" rel="noreferrer" aria-label="Telegram support" title={TELEGRAM_USERNAME}><Icon name="send" size={19} /></a>
            {cartCourses.length > 0 && <button className="header-icon-button cart-head-button" type="button" onClick={() => setSheet('cart')} aria-label="Open cart" title="Cart"><Icon name="bag" size={18} /><b>{cartCourses.length}</b></button>}
            <button className={refreshing ? 'header-icon-button spinning' : 'header-icon-button'} type="button" onClick={refreshApp} aria-label="Refresh app" title="Refresh"><Icon name="refresh" size={19} /></button>
            <button className="header-icon-button menu-button" type="button" onClick={() => setSheet('category')} aria-label="Open course categories" title="Course categories"><Icon name="menu" size={21} /></button>
          </div>
        </div>
      </header>

      <section id="top" className="hero-reference">
        <div className="hero-backdrop-grid" />
        <div className="hero-shape shape-a" />
        <div className="hero-shape shape-b" />
        <div className="reference-tools">
          <div className="verified-row">
            <div className="verified-pill"><i /> {catalogueCount.toLocaleString('en-IN')} Verified Courses Available</div>
            <button className="verified-notification" type="button" onClick={openNotifications} aria-label="Open notifications" title="Notifications">
              <Icon name="bell" size={19} />
              {unreadCount > 0 && <b>{unreadCount > 99 ? '99+' : unreadCount}</b>}
            </button>
          </div>
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
            <button className="sort-reference" type="button" onClick={() => setSortOpen(v => !v)}>↕ Sort <span className={sortOpen ? 'rotated' : ''}>⌄</span></button>
            {sortOpen && <div className="sort-reference-menu">{SORT_OPTIONS.map(item => <button key={item} type="button" className={item === sort ? 'selected' : ''} onClick={() => { setSort(item); setSortOpen(false); }}>{item}<span>{item === sort ? '✓' : ''}</span></button>)}</div>}
          </div>
        </div>

        <div className="course-grid-reference">
          {filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} vote={getVote(course.id)} inCart={cartIds.includes(course.id)} onVote={handleVote} onCartToggle={toggleCart} />
          ))}
        </div>

        {filteredCourses.length === 0 && <div className="empty-reference"><strong>No courses found</strong><span>Try another keyword or reset the search.</span><button type="button" onClick={() => { setQuery(''); setCategory('All Courses'); }}>RESET SEARCH</button></div>}
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
          <aside className={`reference-sheet ${sheet === 'category' ? 'category-sheet' : ''}`}>
            {sheet === 'category' && (
              <>
                <div className="sheet-header"><div className="sheet-title-icon"><Icon name="layers" size={23} /></div><h2>Course Categories</h2><button type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={21} /></button></div>
                <p className="sheet-intro">Tap a category to filter courses:</p>
                <div className="category-drawer-list">
                  {CATEGORIES.map(([name, symbol]) => (
                    <button key={name} type="button" className={name === category ? 'drawer-category active' : 'drawer-category'} onClick={() => { setCategory(name); setSheet(null); }}>
                      <span className="drawer-icon">{symbol}</span><strong>{name}</strong><b>{categoryCounts[name] ?? 0}</b>
                    </button>
                  ))}
                </div>
              </>
            )}

            {sheet === 'faq' && (
              <>
                <div className="sheet-header faq-header"><div className="faq-mark">?</div><h2>Frequently Asked<br />Questions (Q&amp;A)</h2><button type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={21} /></button></div>
                <div className="faq-scroll"><div className="faq-answer-guide">Delivery, Quality, Payment &amp; Access Guidelines:</div><button className="collapse-all-reference" type="button" onClick={() => setFaqOpen(null)}>Collapse All&nbsp;⌃</button><div className="faq-reference-list">{FAQS.map(([title, answer], index) => { const open = faqOpen === index; return <div className={open ? 'faq-reference-row open' : 'faq-reference-row'} key={title}><button type="button" onClick={() => setFaqOpen(open ? null : index)}><span className="faq-number">{String(index + 1).padStart(2, '0')}</span><strong>{title}</strong><span className="faq-chevron">{open ? '⌃' : '⌄'}</span></button>{open && <div className="faq-answer-card"><h3>{index === 6 ? 'Notification Center' : 'Answer'}</h3><p>{answer}</p></div>}</div>; })}</div></div>
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
                <div className="sheet-header"><div className="sheet-title-icon"><Icon name="bag" size={23} /></div><h2>Selected Courses<br />Cart ({cartCourses.length})</h2><button type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={21} /></button></div>
                {cartCourses.length === 0 ? (
                  <div className="bag-reference-empty"><div className="bag-big"><Icon name="bag" size={30} /></div><h3>Your cart is empty</h3><p>Save courses from the catalogue and they will appear here with a live total.</p><button type="button" onClick={() => setSheet(null)}>BROWSE COURSES</button></div>
                ) : (
                  <div className="cart-reference">
                    <p className="cart-intro">Ek sath multiple courses select karke instant package access lijiye:</p>
                    <div className="cart-list">{cartCourses.map(course => <div className="cart-row" key={course.id}><CourseArtwork course={course} mini /><div className="cart-row-copy"><strong>{course.title}</strong><span>{course.category}</span></div><div className="cart-row-actions"><b>₹{course.price.toLocaleString('en-IN')}</b><button type="button" onClick={() => toggleCart(course.id)} aria-label={`Remove ${course.title}`}>🗑</button></div></div>)}</div>

                    <div className="cart-summary-box">
                      <div><span>Total Selected Items:</span><strong>{cartCourses.length} {cartCourses.length === 1 ? 'course' : 'courses'}</strong></div>
                      <div><span>Subtotal:</span><strong>₹{cartSubtotal.toLocaleString('en-IN')}</strong></div>
                      {appliedCoupon && <div className="discount-line"><span>Discount ({appliedCoupon.percent}%):</span><strong>−₹{discountAmount.toLocaleString('en-IN')}</strong></div>}
                    </div>

                    <button className="coupon-question" type="button" onClick={() => { setCouponOpen(v => !v); setCouponError(''); }}>
                      <span><Icon name="ticket" size={18} /> Do you have any Coupon Code?</span><span>⌄</span>
                    </button>

                    {couponOpen && <div className="coupon-box"><input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Enter coupon code..." autoCapitalize="characters" /><button type="button" onClick={applyCoupon} disabled={couponBusy}>{couponBusy ? 'Checking...' : 'Apply'}</button></div>}
                    {couponError && <div className="coupon-error">{couponError}</div>}
                    {appliedCoupon && <div className="coupon-success">✓ {appliedCoupon.code} applied · {appliedCoupon.percent}% OFF</div>}

                    <div className="cart-grand-total"><span>Combined Total</span><strong>₹{cartTotal.toLocaleString('en-IN')}</strong></div>
                    <div className="cart-actions"><button type="button" className="clear-cart" onClick={clearCart}>🗑 Clear Cart</button><button type="button" className="buy-all" onClick={buyAllOnTelegram}>✈ Buy All<br />Courses on Telegram</button></div>
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      )}

      {cartCourses.length > 0 && <div className="floating-cart-bar"><button type="button" className="floating-cart-count" onClick={() => setSheet('cart')}><Icon name="bag" size={18} /><b>{cartCourses.length}</b></button><button type="button" className="floating-view-cart" onClick={() => setSheet('cart')}>☷ View Cart</button><button type="button" className="floating-buy" onClick={buyAllOnTelegram}>✈ Buy All on Telegram</button></div>}
    </main>
  );
}
