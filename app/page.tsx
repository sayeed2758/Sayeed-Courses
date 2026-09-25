'use client';

import { useEffect, useMemo, useState } from 'react';

const CATALOGUE_TOTAL = '3,695+';
const TELEGRAM_USERNAME = 'Tuffybhai';
const CART_KEY = 'sayeed_courses_cart_v2';
const VOTE_KEY = 'sayeed_courses_votes_v3';

type VoteKind = 'like' | 'dislike';
type UserVote = VoteKind | null;

type Course = {
  id: number;
  number: number;
  category: string;
  title: string;
  educator: string;
  meta: string;
  price: number;
  palette: string;
  rating: string;
  reviews: number;
  likes: number;
  dislikes: number;
};

type VoteState = { likes: number; dislikes: number; userVote: UserVote };

type Sheet = 'category' | 'faq' | 'menu' | 'bag' | null;

const categories = [
  ['All Courses', '▦', '3,695'],
  ['New Added Courses', '◷', '0'],
  ['Coding & Tech', '</>', '153'],
  ['AI & Automation', '◈', '100'],
  ['Upsurge Courses', '↗', '245'],
  ['Finance & Taxation', '▤', '56'],
  ['Astrology & Occult', '✣', '754'],
  ['Fitness & Health', '✚', '63'],
  ['Dating & Relationships', '♥', '88'],
  ['Personal Growth & Mindset', '◉', '171'],
  ['Communication & Languages', '◌', '91'],
  ['Video Editing & Media', '▮', '125'],
] as const;

const sortOptions = ['Recommended', 'Newest', 'A — Z', 'Category'];

const courseSeed = [
  ['Coding & Tech', 'Alpha Batch 3.0', 'Sayeed Academy', '2026 Batch', 299, 'teal', 4.8, 307],
  ['AI & Automation', 'Alpha Plus 6.0 (C++)', 'Sayeed Academy', '2026 Batch', 299, 'orange', 4.9, 184],
  ['Coding & Tech', 'Alpha Plus Batch 2.0', 'Sayeed Academy', '2026 Batch', 299, 'purple', 4.7, 228],
  ['Coding & Tech', 'Alpha Plus Batch 3.0', 'Sayeed Academy', '2026 Batch', 299, 'blue', 4.6, 193],
  ['Finance & Taxation', 'Smart Tax Masterclass', 'Sayeed Academy', 'Updated 2026', 399, 'teal', 4.5, 142],
  ['Personal Growth & Mindset', 'Focus & Discipline Blueprint', 'Sayeed Academy', 'Premium', 249, 'purple', 4.4, 119],
  ['AI & Automation', 'Prompt Engineering Pro', 'Sayeed Academy', 'Updated 2026', 349, 'blue', 4.9, 266],
  ['Coding & Tech', 'Web Development Zero to Pro', 'Sayeed Academy', 'New Release', 449, 'orange', 4.8, 311],
  ['Coding & Tech', 'Python Automation Mastery', 'Sayeed Academy', '2026 Batch', 299, 'teal', 4.7, 208],
  ['AI & Automation', 'AI Tools Mega Pack', 'Sayeed Academy', 'Premium', 199, 'purple', 4.6, 171],
  ['Finance & Taxation', 'Personal Finance Simplified', 'Sayeed Academy', 'Updated 2026', 249, 'blue', 4.3, 98],
  ['Personal Growth & Mindset', 'Build Better Habits', 'Sayeed Academy', 'New Release', 149, 'orange', 4.2, 84],
];

const courses: Course[] = Array.from({ length: 36 }, (_, index) => {
  const seed = courseSeed[index % courseSeed.length];
  const variation = Math.floor(index / courseSeed.length);
  const rating = Number(seed[6]);
  return {
    id: index + 1,
    number: index + 1,
    category: String(seed[0]),
    title: variation === 0 ? String(seed[1]) : `${String(seed[1])} ${variation + 1}.${index % 3}`,
    educator: String(seed[2]),
    meta: String(seed[3]),
    price: Number(seed[4]),
    palette: String(seed[5]),
    rating: Math.min(5, rating + ((index * 3) % 5) / 10).toFixed(1),
    reviews: Number(seed[7]) + variation * 17 + index,
    likes: 38 + ((index * 29) % 120),
    dislikes: 2 + ((index * 7) % 9),
  };
});

const faqs = [
  {
    title: 'Courses kahan aur kaise milenge? (Telegram vs Google Drive / Mega)',
    answer: '⚡ Courses ko authorised delivery method ke through simple learning flow mein provide kiya jayega. Course detail page par jo access method listed hoga, wahi follow karein.',
  },
  {
    title: 'Kya courses ZIP / RAR files mein honge ya Direct Videos format mein?',
    answer: '🎬 Jahan direct video delivery available hogi, wahan content ko one-tap learning flow mein organise kiya jayega. Course details mein available format clearly mention hoga.',
  },
  {
    title: 'Kya channel takedown wagera ho sakta hai? Access kab tak rahega?',
    answer: '🛡️ Access authorised provider aur course availability par depend karta hai. Platform par jo current access policy listed hogi, wahi reliable reference hogi.',
  },
  {
    title: 'Can I download the videos and watch them offline?',
    answer: '📱 Offline viewing har course ke delivery method par depend karegi. Jahan download permitted aur supported hoga, wahi option clearly show kiya jayega.',
  },
  {
    title: 'Course kaise purchase / order karein? (Step-by-Step Purchase Guide)',
    answer: '🧾 Course open karein → available access details check karein → purchase/request action follow karein → confirmation ke baad authorised access instructions use karein.',
  },
  {
    title: 'Kya lectures ke sath PDFs, assignments aur notes bhi milenge?',
    answer: '📚 Har course ka resource bundle alag ho sakta hai. PDFs, assignments aur notes available honge to course details mein clearly listed honge.',
  },
  {
    title: 'Why are the courses priced so cheaply compared to other platforms?',
    answer: '💡 Pricing source, promotions, licensing and delivery model par depend kar sakti hai. Final price har course ke card/details section mein clearly shown hoga.',
  },
];

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
  };

  if (name === 'search') return <svg {...common}><circle cx="11" cy="11" r="6.8" /><path d="m16.2 16.2 4.2 4.2" /></svg>;
  if (name === 'menu') return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
  if (name === 'x') return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  if (name === 'refresh') return <svg {...common}><path d="M20 11a8.5 8.5 0 0 0-14.7-5L4 8" /><path d="M4 4v4h4" /><path d="M4 13a8.5 8.5 0 0 0 14.7 5L20 16" /><path d="M20 20v-4h-4" /></svg>;
  if (name === 'help') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.7 2.7 0 1 1 4.5 2c-1.4 1-2 1.5-2 3" /><path d="M12 17.4h.01" /></svg>;
  if (name === 'send') return <svg {...common}><path d="m21 3-7.6 18-3.9-8.5L1 8.6 21 3Z" /><path d="m9.5 12.5 5-5" /></svg>;
  if (name === 'bag') return <svg {...common}><path d="M6.5 8.5h11l1 12h-13l1-12Z" /><path d="M9 8.5V6.7a3 3 0 0 1 6 0v1.8" /></svg>;
  if (name === 'download') return <svg {...common}><path d="M12 3v11" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M5 20h14" /></svg>;
  if (name === 'chevron') return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>;
  if (name === 'layers') return <svg {...common}><path d="m12 3 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4" /><path d="m4 17 8 4 8-4" /></svg>;
  return null;
}

function BootLoader({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 1600);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="boot-loader">
      <div className="loader-core">
        <div className="loader-logo-wrap"><img src="/shahid-logo.png" alt="Sayeed Courses" /></div>
        <div className="loader-brand">SAYEED <span>COURSES</span></div>
        <div className="loader-subtitle">VIP COURSES HUB</div>
        <div className="loader-progress"><span /></div>
        <div className="loader-status"><i /> Loading {CATALOGUE_TOTAL} Courses...</div>
      </div>
    </div>
  );
}

function CourseArtwork({ course }: { course: Course }) {
  return (
    <div className={`course-art ${course.palette}`}>
      <div className="art-code">0101100101 0010110010 1011010001</div>
      <div className="art-orb art-orb-one" />
      <div className="art-orb art-orb-two" />
      <div className="art-topline"><span>#{String(course.number).padStart(3, '0')}</span><b>₹ {course.price}</b></div>
      <div className="art-brand">SAYEED</div>
    </div>
  );
}

function CourseCard({ course, vote, onVote, inCart, onCartToggle, onToast }: {
  course: Course;
  vote: VoteState;
  onVote: (id: number, next: VoteKind) => void;
  inCart: boolean;
  onCartToggle: (id: number) => void;
  onToast: (message: string) => void;
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
          <button type="button" className={`reaction-button like ${vote.userVote === 'like' ? 'active' : ''}`} onClick={() => onVote(course.id, 'like')} aria-pressed={vote.userVote === 'like'}>
            <span>👍</span> {vote.likes}
          </button>
          <button type="button" className={`reaction-button dislike ${vote.userVote === 'dislike' ? 'active' : ''}`} onClick={() => onVote(course.id, 'dislike')} aria-pressed={vote.userVote === 'dislike'}>
            <span>👎</span> {vote.dislikes}
          </button>
        </div>

        <h3>{course.number}. {course.title}</h3>
        <p>{course.educator} · {course.meta}</p>

        <div className="course-actions">
          <button className="unlock-button" type="button" onClick={() => onToast('Course access flow coming next.')}>↪&nbsp; Unlock Course · ₹{course.price}</button>
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
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('Recommended');
  const [category, setCategory] = useState('All Courses');
  const [sortOpen, setSortOpen] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [installHint, setInstallHint] = useState('');
  const [cartIds, setCartIds] = useState<number[]>([]);
  const [votes, setVotes] = useState<Record<number, VoteState>>({});
  const [toast, setToast] = useState('');

  useEffect(() => {
    try {
      const rawCart = window.localStorage.getItem(CART_KEY);
      const savedCart = rawCart ? JSON.parse(rawCart) : [];
      if (Array.isArray(savedCart)) setCartIds(savedCart.filter((id): id is number => Number.isInteger(id)));

      const rawVotes = window.localStorage.getItem(VOTE_KEY);
      const savedVotes = rawVotes ? JSON.parse(rawVotes) : {};
      if (savedVotes && typeof savedVotes === 'object') setVotes(savedVotes);
    } catch {
      setCartIds([]);
      setVotes({});
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault?.();
      setDeferredPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.body.style.overflow = sheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheet]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = courses.filter(course => {
      const matchesCategory = category === 'All Courses' || course.category === category;
      const haystack = `${course.title} ${course.educator} ${course.category} ${course.number}`.toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
    if (sort === 'Newest') return [...result].sort((a, b) => b.number - a.number);
    if (sort === 'A — Z') return [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'Category') return [...result].sort((a, b) => a.category.localeCompare(b.category));
    return result;
  }, [query, sort, category]);

  const cartCourses = cartIds.map(id => courses.find(course => course.id === id)).filter((course): course is Course => Boolean(course));
  const cartTotal = cartCourses.reduce((sum, course) => sum + course.price, 0);

  function getVote(id: number): VoteState {
    const base = courses.find(course => course.id === id);
    return votes[id] || { likes: base?.likes || 0, dislikes: base?.dislikes || 0, userVote: null };
  }

  function handleVote(id: number, next: VoteKind) {
    const current = getVote(id);
    let likes = current.likes;
    let dislikes = current.dislikes;
    let userVote: UserVote = current.userVote;

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

    const nextState = { ...votes, [id]: { likes, dislikes, userVote } };
    setVotes(nextState);
    window.localStorage.setItem(VOTE_KEY, JSON.stringify(nextState));
    setToast(next === 'like' ? 'Liked Course 👍' : 'Disliked Course 👎');
  }

  function toggleCart(id: number) {
    const wasInCart = cartIds.includes(id);
    const next = wasInCart ? cartIds.filter(item => item !== id) : [...cartIds, id];
    setCartIds(next);
    window.localStorage.setItem(CART_KEY, JSON.stringify(next));
    setToast(wasInCart ? 'Course removed from cart' : 'Course added to cart 🛒');
  }

  function refreshCatalogue() {
    setRefreshing(true);
    setQuery('');
    setSort('Recommended');
    setCategory('All Courses');
    setSortOpen(false);
    window.setTimeout(() => setRefreshing(false), 650);
  }

  async function handleInstall() {
    if (deferredPrompt) {
      const event = deferredPrompt as Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };
      await event.prompt?.();
      await event.userChoice?.catch(() => undefined);
      setDeferredPrompt(null);
      return;
    }
    setInstallHint('Open your browser menu and choose “Add to Home screen” or “Install app”.');
    window.setTimeout(() => setInstallHint(''), 4200);
  }

  function buyAllOnTelegram() {
    if (!cartCourses.length) return;
    const lines = [
      `Hey ${TELEGRAM_USERNAME}, I want to purchase these ${cartCourses.length} course${cartCourses.length === 1 ? '' : 's'}:`,
      '',
      ...cartCourses.map((course, index) => `${index + 1}. ${course.title} (₹${course.price})`),
      '',
      `Total Package: ₹${cartTotal.toLocaleString('en-IN')}`,
      '',
      'Please share payment details for instant access!'
    ];
    const url = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.location.href = url;
  }

  function openSheet(target: Exclude<Sheet, null>) {
    setSheet(target);
  }

  if (loading) return <BootLoader onDone={() => setLoading(false)} />;

  return (
    <main className="reference-app">
      <header className="top-header">
        <div className="top-header-inner">
          <a href="#top" className="brand-lockup" aria-label="Sayeed Courses home">
            <span className="brand-logo-image"><img src="/shahid-logo.png" alt="Sayeed Courses" /></span>
            <span className="brand-copy"><strong>SAYEED <i>COURSES</i></strong><small>YOUR NEXT SKILL STARTS HERE</small></span>
          </a>

          <div className="top-actions">
            <button className="app-button" type="button" onClick={handleInstall}><Icon name="download" size={18} /><span>APP</span></button>
            <button className="header-icon-button faq-button" type="button" onClick={() => openSheet('faq')} aria-label="FAQs"><Icon name="help" size={20} /><span>FAQs</span></button>
            <button className="header-icon-button cyan" type="button" onClick={buyAllOnTelegram} aria-label="Telegram"><Icon name="send" size={20} /></button>
            {cartCourses.length > 0 && (
              <button className="header-icon-button cart-header-button" type="button" onClick={() => openSheet('bag')} aria-label={`Cart with ${cartCourses.length} courses`}>
                <Icon name="bag" size={20} /><b>{cartCourses.length}</b>
              </button>
            )}
            <button className={refreshing ? 'header-icon-button spinning' : 'header-icon-button'} type="button" onClick={refreshCatalogue} aria-label="Refresh"><Icon name="refresh" size={20} /></button>
            <button className="header-icon-button menu-button" type="button" onClick={() => openSheet('menu')} aria-label="Menu"><Icon name="menu" size={22} /></button>
          </div>
        </div>
      </header>

      <section id="top" className="hero-reference">
        <div className="hero-backdrop-grid" />
        <div className="hero-shape shape-a" />
        <div className="hero-shape shape-b" />
        <div className="reference-tools">
          <div className="verified-pill"><i /> {CATALOGUE_TOTAL} Verified Courses Available</div>
          <div className="search-reference">
            <Icon name="search" size={28} />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search course by name or # number..." aria-label="Search courses" />
            {query && <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear search"><Icon name="x" size={18} /></button>}
            <button className="mic-button" type="button" onClick={() => setToast('Voice search is ready for a later backend pass.')} aria-label="Voice search"><span>🎙</span></button>
          </div>
        </div>
      </section>

      <section id="courses" className="catalogue-reference">
        <div className="library-head reference-library-head">
          <div><h2>All Courses <span>(3,695)</span></h2></div>
          <div className="sort-reference-wrap">
            <button className="sort-reference" type="button" onClick={() => setSortOpen(open => !open)}>↕ Sort <Icon name="chevron" size={15} /></button>
            {sortOpen && <div className="sort-reference-menu">{sortOptions.map(item => <button key={item} type="button" className={item === sort ? 'selected' : ''} onClick={() => { setSort(item); setSortOpen(false); }}>{item}<span>{item === sort ? '✓' : ''}</span></button>)}</div>}
          </div>
        </div>

        <div className="course-grid-reference">
          {filtered.map(course => (
            <CourseCard key={course.id} course={course} vote={getVote(course.id)} onVote={handleVote} inCart={cartIds.includes(course.id)} onCartToggle={toggleCart} onToast={setToast} />
          ))}
        </div>

        {filtered.length === 0 && <div className="empty-reference"><strong>No courses found</strong><span>Try another keyword or reset the search.</span><button type="button" onClick={() => setQuery('')}>RESET SEARCH</button></div>}
      </section>

      <section className="cta-reference">
        <span className="section-kicker">CAN&apos;T FIND IT?</span>
        <h2>Request a course.</h2>
        <p>Tell us what you want to see in the next catalogue update.</p>
        <button type="button" onClick={() => setToast('Course request flow will be connected next.')}>REQUEST COURSE ↗</button>
      </section>

      <footer className="footer-reference"><strong>SAYEED <i>COURSES</i></strong><span>© 2026 · Premium course hub</span></footer>

      {cartCourses.length > 0 && (
        <div className="cart-bottom-bar">
          <button className="cart-float-icon" type="button" onClick={() => openSheet('bag')} aria-label="Open cart"><Icon name="bag" size={22} /><b>{cartCourses.length}</b></button>
          <button className="cart-view-button" type="button" onClick={() => openSheet('bag')}>☷ View Cart</button>
          <button className="cart-buy-button" type="button" onClick={buyAllOnTelegram}><Icon name="send" size={17} /> Buy All on Telegram</button>
        </div>
      )}

      {installHint && <div className="install-hint" role="status">{installHint}</div>}
      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}

      {sheet && (
        <div className="sheet-overlay" role="dialog" aria-modal="true" onMouseDown={event => { if (event.target === event.currentTarget) setSheet(null); }}>
          <aside className="reference-sheet">
            {sheet === 'category' && (
              <>
                <div className="sheet-header"><div className="sheet-title-icon"><Icon name="layers" size={23} /></div><h2>Course Categories</h2><button type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={22} /></button></div>
                <p className="sheet-intro">Tap a category to filter courses:</p>
                <div className="category-drawer-list">
                  {categories.map(([name, symbol, count]) => <button key={name} type="button" className={`drawer-category ${name === category ? 'active' : ''}`} onClick={() => { setCategory(name); setSheet(null); setToast(`${name} selected`); }}><span className="drawer-icon">{symbol}</span><strong>{name}</strong><b>{count}</b></button>)}
                </div>
              </>
            )}

            {sheet === 'faq' && (
              <>
                <div className="sheet-header faq-header"><div className="faq-mark">?</div><h2>Frequently Asked<br />Questions (Q&amp;A)</h2><button type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={22} /></button></div>
                <div className="faq-scroll">
                  <div className="faq-answer-guide">Delivery, Video Quality, Payment &amp; Access Guidelines:</div>
                  <button className="collapse-all-reference" type="button" onClick={() => setFaqOpen(null)}>Collapse All&nbsp;⌃</button>
                  <div className="faq-reference-list">
                    {faqs.map((faq, index) => {
                      const open = faqOpen === index;
                      return <div className={`faq-reference-row ${open ? 'open' : ''}`} key={faq.title}>
                        <button type="button" onClick={() => setFaqOpen(open ? null : index)}><span className="faq-number">{String(index + 1).padStart(2, '0')}</span><strong>{faq.title}</strong><span className="faq-chevron">{open ? '⌃' : '⌄'}</span></button>
                        {open && <div className="faq-answer-card"><h3>{index === 0 ? 'Important Delivery & Access Policy' : 'Answer'}</h3><p>{faq.answer}</p></div>}
                      </div>;
                    })}
                  </div>
                </div>
              </>
            )}

            {sheet === 'menu' && (
              <>
                <div className="sheet-header"><div className="sheet-title-icon"><Icon name="menu" size={23} /></div><h2>Your Course Hub</h2><button type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={22} /></button></div>
                <div className="menu-reference-list">
                  <button type="button" onClick={() => setSheet('faq')}>❓ FAQs <span>→</span></button>
                  <button type="button" onClick={() => setSheet('category')}>▦ Categories <span>→</span></button>
                  <button type="button" onClick={() => setSheet('bag')}>🛒 My Cart <span>{cartCourses.length}</span></button>
                  <button type="button" onClick={handleInstall}>⬇ Install App <span>→</span></button>
                </div>
              </>
            )}

            {sheet === 'bag' && (
              <>
                <div className="sheet-header"><div className="sheet-title-icon"><Icon name="bag" size={23} /></div><h2>Selected Courses<br />Cart ({cartCourses.length})</h2><button type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={22} /></button></div>
                <p className="sheet-intro">Ek sath multiple courses select karke instant package access lijiye:</p>
                {cartCourses.length === 0 ? (
                  <div className="bag-reference-empty"><div className="bag-big"><Icon name="bag" size={30} /></div><h3>Your cart is empty</h3><p>Save courses from the catalogue and they will appear here with a live total.</p><button type="button" onClick={() => setSheet(null)}>BROWSE COURSES</button></div>
                ) : (
                  <div className="cart-reference">
                    <div className="cart-list">
                      {cartCourses.map(course => (
                        <div className="cart-row" key={course.id}>
                          <div className={`cart-thumb ${course.palette}`}><span>#{String(course.number).padStart(3, '0')}</span></div>
                          <div className="cart-course-copy"><strong>{course.title}</strong><small>{course.category}</small></div>
                          <div className="cart-row-actions"><b>₹{course.price}</b><button type="button" onClick={() => toggleCart(course.id)} aria-label={`Remove ${course.title}`}>✕</button></div>
                        </div>
                      ))}
                    </div>
                    <div className="cart-total-box"><div><span>Total Selected Items:</span><strong>{cartCourses.length} courses</strong></div><div><span>Combined Total:</span><b>₹{cartTotal.toLocaleString('en-IN')}</b></div></div>
                    <div className="cart-modal-actions"><button className="clear-cart" type="button" onClick={() => { setCartIds([]); window.localStorage.setItem(CART_KEY, '[]'); setToast('Cart cleared'); }}>🗑 Clear Cart</button><button className="buy-modal" type="button" onClick={buyAllOnTelegram}><Icon name="send" size={18} /> Buy All Courses on Telegram</button></div>
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
