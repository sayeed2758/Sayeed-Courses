'use client';

import { useEffect, useMemo, useState } from 'react';

const CATALOGUE_TOTAL = '3,695+';

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
];

const sortOptions = ['Recommended', 'Newest', 'A — Z', 'Category'];

const courses = Array.from({ length: 24 }, (_, index) => {
  const categoryNames = ['Coding & Tech', 'AI & Automation', 'Finance & Taxation', 'Personal Growth & Mindset'];
  const palette = ['teal', 'orange', 'purple', 'blue'][index % 4];
  const number = index + 1;
  return {
    id: number,
    number,
    category: categoryNames[index % categoryNames.length],
    title: [
      'Alpha Batch 3.0',
      'Complete DSA Batch',
      'AI Automation Mastery',
      'Personal Growth Blueprint',
    ][index % 4],
    educator: ['Sayeed Academy', 'Elite Faculty', 'Pro Learning', 'Master Teachers'][index % 4],
    meta: ['2026 Batch', 'Premium', 'Updated 2026', 'New Release'][index % 4],
    badge: index % 6 === 0 ? 'NEW' : index % 4 === 0 ? 'FEATURED' : 'VERIFIED',
    price: [299, 199, 399, 249][index % 4],
    palette,
    rating: ['4.8', '4.9', '4.7', '4.9'][index % 4],
    reviews: [307, 184, 126, 211][index % 4],
    likes: [73, 58, 91, 46][index % 4],
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
  if (name === 'layers') return <svg {...common}><path d="m12 3 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4" /><path d="m4 17 8 4 8-4" /></svg>;
  if (name === 'chevron') return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>;
  if (name === 'mic') return <svg {...common}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8" /></svg>;
  if (name === 'spark') return <svg {...common}><path d="M12 2.8l1.65 5.55L19.2 10l-5.55 1.65L12 17.2l-1.65-5.55L4.8 10l5.55-1.65L12 2.8Z" /><path d="M18.4 15.6l.7 2.2 2.2.7-2.2.7-.7 2.2-.7-2.2-2.2-.7 2.2-.7.7-2.2Z" /></svg>;
  if (name === 'download') return <svg {...common}><path d="M12 3v11" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M5 20h14" /></svg>;
  return null;
}

function Loader({ done }: { done: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(done, 1750);
    return () => window.clearTimeout(timer);
  }, [done]);

  return (
    <div className="boot-loader">
      <div className="loader-core">
        <div className="loader-logo-wrap">
          <img src="/shahid-logo.png" alt="Sayeed logo" />
        </div>
        <div className="loader-brand">SAYEED <span>COURSES</span></div>
        <div className="loader-subtitle">VIP COURSES HUB</div>
        <div className="loader-progress"><span /></div>
        <div className="loader-status"><i /> Loading {CATALOGUE_TOTAL} Courses...</div>
      </div>
    </div>
  );
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

function CourseCard({ course }: { course: (typeof courses)[number] }) {
  const [saved, setSaved] = useState(false);

  return (
    <article className="course-card">
      <CourseArtwork course={course} />
      <div className="course-body">
        <div className="course-pills">
          <span className="price-pill">₹{course.price}</span>
          <span className="rating-pill">★ {course.rating} <small>({course.reviews})</small></span>
          <span className="category-pill">&lt;/&gt; {course.category}</span>
        </div>
        <div className="engagement-row"><span>♥ {course.likes}</span><span>♧ 3</span></div>
        <h3>{course.number}. {course.title}</h3>
        <p>{course.educator} · {course.meta}</p>
        <div className="course-actions">
          <button className="unlock-button" type="button">↪&nbsp; Unlock Course · ₹{course.price}</button>
          <button className={saved ? 'cart-button-small saved' : 'cart-button-small'} type="button" onClick={() => setSaved(v => !v)}>{saved ? '✓ Saved' : '🛒 Cart'}</button>
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
  const [sheet, setSheet] = useState<'category' | 'faq' | 'menu' | 'bag' | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [installHint, setInstallHint] = useState('');

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault?.();
      setDeferredPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = courses.filter((course) => {
      const matchesCategory = category === 'All Courses' || course.category === category;
      const haystack = `${course.title} ${course.educator} ${course.category} ${course.number}`.toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
    if (sort === 'Newest') result = [...result].sort((a, b) => b.number - a.number);
    if (sort === 'A — Z') result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'Category') result = [...result].sort((a, b) => a.category.localeCompare(b.category));
    return result;
  }, [query, category, sort]);

  function refreshCatalogue() {
    setRefreshing(true);
    setQuery('');
    setCategory('All Courses');
    setSort('Recommended');
    setSortOpen(false);
    window.setTimeout(() => setRefreshing(false), 650);
  }

  async function handleInstall() {
    if (deferredPrompt) {
      const promptEvent = deferredPrompt as Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };
      await promptEvent.prompt?.();
      await promptEvent.userChoice?.catch(() => undefined);
      setDeferredPrompt(null);
      return;
    }
    setInstallHint('Open your browser menu and choose “Add to Home screen” or “Install app”.');
    window.setTimeout(() => setInstallHint(''), 4200);
  }

  useEffect(() => {
    document.body.style.overflow = sheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheet]);

  if (loading) return <Loader done={() => setLoading(false)} />;

  return (
    <main className="reference-app">
      <header className="top-header">
        <div className="top-header-inner">
          <a href="#top" className="brand-lockup" aria-label="Sayeed Courses home">
            <span className="brand-logo-image"><img src="/shahid-logo.png" alt="Sayeed logo" /></span>
            <span className="brand-copy"><strong>SAYEED <i>COURSES</i></strong><small>YOUR NEXT SKILL STARTS HERE</small></span>
          </a>

          <div className="top-actions">
            <button className="app-button" type="button" onClick={handleInstall}><Icon name="download" size={18} /><span>APP</span></button>
            <button className="header-icon-button faq-button" type="button" onClick={() => setSheet('faq')}><Icon name="help" size={20} /><span>FAQs</span></button>
            <button className="header-icon-button cyan" type="button" onClick={() => setSheet('menu')} aria-label="Telegram"><Icon name="send" size={20} /></button>
            <button className={refreshing ? 'header-icon-button spinning' : 'header-icon-button'} type="button" onClick={refreshCatalogue} aria-label="Refresh"><Icon name="refresh" size={20} /></button>
            <button className="header-icon-button menu-button" type="button" onClick={() => setSheet('menu')} aria-label="Menu"><Icon name="menu" size={22} /></button>
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
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search course by name or # number..." aria-label="Search courses" />
            {query && <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear search"><Icon name="x" size={18} /></button>}
            <button className="mic-button" type="button" aria-label="Voice search"><Icon name="mic" size={20} /></button>
          </div>
        </div>
      </section>

      <section id="courses" className="catalogue-reference">
        <div className="library-head reference-library-head">
          <div><h2>All Courses <span>({CATALOGUE_TOTAL.replace('+','')})</span></h2></div>
          <div className="sort-reference-wrap">
            <button className="sort-reference" type="button" onClick={() => setSortOpen(v => !v)}>↕ Sort <Icon name="chevron" size={15} /></button>
            {sortOpen && <div className="sort-reference-menu">{sortOptions.map(item => <button key={item} type="button" className={item === sort ? 'selected' : ''} onClick={() => { setSort(item); setSortOpen(false); }}>{item}<span>{item === sort ? '✓' : ''}</span></button>)}</div>}
          </div>
        </div>

        <div className="course-grid-reference">
          {filtered.map(course => <CourseCard key={course.id} course={course} />)}
        </div>

        {filtered.length === 0 && (
          <div className="empty-reference"><strong>No courses found</strong><span>Try another keyword or reset the search.</span><button type="button" onClick={() => { setQuery(''); setCategory('All Courses'); }}>RESET SEARCH</button></div>
        )}
      </section>

      <section className="cta-reference">
        <span className="section-kicker">CAN&apos;T FIND IT?</span>
        <h2>Request a course.</h2>
        <p>Tell us what you want to see in the next catalogue update.</p>
        <button type="button">REQUEST COURSE ↗</button>
      </section>

      <footer className="footer-reference"><strong>SAYEED <i>COURSES</i></strong><span>© 2026 · Premium course hub</span></footer>

      {installHint && <div className="install-hint" role="status">{installHint}</div>}

      {sheet && (
        <div className="sheet-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) setSheet(null); }}>
          <aside className="reference-sheet">
            {sheet === 'category' && (
              <>
                <div className="sheet-header"><div className="sheet-title-icon"><Icon name="layers" size={23} /></div><h2>Course Categories</h2><button type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={22} /></button></div>
                <p className="sheet-intro">Tap a category to filter courses:</p>
                <div className="category-drawer-list">
                  {categories.map(([name, symbol, count]) => (
                    <button key={name} type="button" className={name === category ? 'drawer-category active' : 'drawer-category'} onClick={() => { setCategory(name); setSheet(null); }}>
                      <span className="drawer-icon">{symbol}</span><strong>{name}</strong><b>{count}</b>
                    </button>
                  ))}
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
                      return (
                        <div className={open ? 'faq-reference-row open' : 'faq-reference-row'} key={faq.title}>
                          <button type="button" onClick={() => setFaqOpen(open ? null : index)}>
                            <span className="faq-number">{String(index + 1).padStart(2, '0')}</span>
                            <strong>{faq.title}</strong>
                            <span className="faq-chevron">{open ? '⌃' : '⌄'}</span>
                          </button>
                          {open && <div className="faq-answer-card"><h3>{index === 0 ? 'Important Delivery & Access Policy' : 'Answer'}</h3><p>{faq.answer}</p></div>}
                        </div>
                      );
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
                  <button type="button" onClick={() => setSheet('bag')}>🛍 My Courses <span>0</span></button>
                  <button type="button" onClick={handleInstall}>⬇ Install App <span>→</span></button>
                </div>
              </>
            )}

            {sheet === 'bag' && (
              <>
                <div className="sheet-header"><div className="sheet-title-icon"><Icon name="bag" size={23} /></div><h2>My Courses</h2><button type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={22} /></button></div>
                <div className="bag-reference-empty"><div className="bag-big"><Icon name="bag" size={30} /></div><h3>Your shelf is empty</h3><p>Save courses to start building your learning list.</p><button type="button" onClick={() => setSheet(null)}>BROWSE COURSES</button></div>
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
