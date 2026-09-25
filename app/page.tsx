'use client';

import { useMemo, useState } from 'react';

const categories = ['All Courses', 'Design', 'Development', 'Business', 'Exams', 'School', 'Languages'];
const sortOptions = ['Recommended', 'Newest', 'A — Z', 'Category'];

const courses = Array.from({ length: 24 }, (_, index) => {
  const category = categories[(index % (categories.length - 1)) + 1];
  const number = index + 1;
  const palettes = ['blue', 'violet', 'teal', 'amber'];
  return {
    id: number,
    number,
    category,
    title: `${category} ${['Masterclass', 'Complete Guide', 'Pro Bootcamp', 'Essential Course'][index % 4]}`,
    educator: ['Sayeed Academy', 'Elite Faculty', 'Pro Learning', 'Master Teachers'][index % 4],
    meta: ['2026 Batch', 'Premium', 'Updated 2026', 'New Release'][index % 4],
    badge: index % 7 === 0 ? 'FEATURED' : index % 4 === 0 ? 'NEW' : 'VERIFIED',
    palette: palettes[index % palettes.length],
    description: 'A focused learning path with organised modules, practical resources and easy access.',
  };
});

const faqs = [
  ['How do I find a course?', 'Use the search field to search by title, educator, category or course number.'],
  ['Can I filter the catalogue?', 'Yes. Pick a category or use Sort to narrow the library quickly.'],
  ['Will this become an app?', 'Yes. This project is being prepared as a responsive Progressive Web App as well as a website.'],
  ['How large can the catalogue become?', 'The final catalogue is designed around a 3,390+ course library and can scale beyond that.'],
  ['Where will the real course data come from?', 'Later phases will connect this interface to your authorised production course database and admin system.'],
];

function Icon({ name, size = 19 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'search') return <svg {...common}><circle cx="11" cy="11" r="6.8"/><path d="m16.2 16.2 4.2 4.2"/></svg>;
  if (name === 'menu') return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
  if (name === 'x') return <svg {...common}><path d="m6 6 12 12M18 6 6 18"/></svg>;
  if (name === 'refresh') return <svg {...common}><path d="M20 11a8.5 8.5 0 0 0-14.7-5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8.5 8.5 0 0 0 14.7 5L20 16"/><path d="M20 20v-4h-4"/></svg>;
  if (name === 'help') return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4.5 2c-1.4 1-2 1.5-2 3"/><path d="M12 17.4h.01"/></svg>;
  if (name === 'send') return <svg {...common}><path d="m21 3-7.6 18-3.9-8.5L1 8.6 21 3Z"/><path d="m9.5 12.5 5-5"/></svg>;
  if (name === 'bag') return <svg {...common}><path d="M6.5 8.5h11l1 12h-13l1-12Z"/><path d="M9 8.5V6.7a3 3 0 0 1 6 0v1.8"/></svg>;
  if (name === 'chevron') return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
  if (name === 'arrow') return <svg {...common}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>;
  if (name === 'spark') return <svg {...common}><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></svg>;
  return null;
}

function CourseArtwork({ course }: { course: (typeof courses)[number] }) {
  return (
    <div className={`course-art ${course.palette}`}>
      <div className="art-grid" />
      <div className="art-ring ring-one" />
      <div className="art-ring ring-two" />
      <span className="art-number">#{String(course.number).padStart(4, '0')}</span>
      <span className="art-badge">{course.badge}</span>
      <div className="art-copy"><small>{course.meta}</small><strong>{course.category}</strong></div>
      <span className="art-watermark">SAYEED</span>
    </div>
  );
}

function CourseCard({ course }: { course: (typeof courses)[number] }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="course-card">
      <CourseArtwork course={course} />
      <div className="course-body">
        <div className="course-meta"><span>{course.category}</span><span>#{String(course.number).padStart(4, '0')}</span></div>
        <h3>{course.title}</h3>
        <p className="course-educator">{course.educator}</p>
        <p className="course-description">{course.description}</p>
        <div className="card-actions">
          <button className={saved ? 'save-button saved' : 'save-button'} type="button" onClick={() => setSaved((value) => !value)}>
            <span className="save-icon">{saved ? '✓' : '+'}</span>{saved ? 'SAVED' : 'SAVE COURSE'}
          </button>
          <button className="study-button" type="button">LET&apos;S STUDY <Icon name="arrow" size={17} /></button>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All Courses');
  const [sort, setSort] = useState('Recommended');
  const [sortOpen, setSortOpen] = useState(false);
  const [sheet, setSheet] = useState<'category' | 'faq' | 'menu' | 'bag' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = courses.filter((course) => {
      const matchesCategory = category === 'All Courses' || course.category === category;
      const haystack = `${course.title} ${course.educator} ${course.category} ${course.number}`.toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
    if (sort === 'Newest') return [...result].sort((a, b) => b.number - a.number);
    if (sort === 'A — Z') return [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'Category') return [...result].sort((a, b) => a.category.localeCompare(b.category));
    return result;
  }, [query, category, sort]);

  async function refreshCatalogue() {
    setRefreshing(true);
    setQuery('');
    setCategory('All Courses');
    setSort('Recommended');
    setSortOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 550));
    setRefreshing(false);
  }

  return (
    <main className="shell">
      <header className="header">
        <div className="header-inner">
          <a href="#top" className="brand" aria-label="Sayeed Courses home">
            <span className="brand-mark"><Icon name="spark" size={19} /></span>
            <span className="brand-copy"><strong>SAYEED <i>COURSES</i></strong><small>YOUR NEXT SKILL STARTS HERE</small></span>
          </a>
          <div className="header-actions">
            <button className="header-control faq-control" type="button" onClick={() => setSheet('faq')}><Icon name="help" size={18} /><span>FAQs</span></button>
            <button className="header-control" type="button" onClick={refreshCatalogue} aria-label="Refresh catalogue"><Icon name="refresh" size={19} /></button>
            <button className="header-control telegram-control" type="button" onClick={() => setSheet('menu')} aria-label="Open quick links"><Icon name="send" size={19} /></button>
            <button className="header-control bag-control" type="button" onClick={() => setSheet('bag')} aria-label="My courses"><Icon name="bag" size={19} /><b>0</b></button>
            <button className="header-control" type="button" onClick={() => setSheet('menu')} aria-label="Open menu"><Icon name="menu" size={20} /></button>
          </div>
        </div>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orb orb-left" aria-hidden="true" />
        <div className="hero-orb orb-right" aria-hidden="true" />
        <div className="content hero-content">
          <span className="hero-kicker">CURIOUS MINDS. ENDLESS POSSIBILITIES.</span>
          <h1>Find your next <em>skill.</em></h1>
          <p>Discover, save and study from one beautifully organised course library.</p>
          <div className="search-box">
            <Icon name="search" size={22} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course by name or # number..." aria-label="Search course" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><Icon name="x" size={18} /></button>}
            <span className="course-count">3,390+</span>
          </div>
          <div className="hero-rail"><span>CURATED CATALOGUE</span><i /><span>INSTANT SEARCH</span><i /><span>PWA READY</span></div>
        </div>
      </section>

      <section id="courses" className="content catalogue">
        <div className="catalogue-heading">
          <div><span className="section-kicker">THE LIBRARY</span><h2>3,390+ courses <small>to explore</small></h2></div>
          <button className="category-button" type="button" onClick={() => setSheet('category')}><span>{category}</span><Icon name="chevron" size={17} /></button>
        </div>

        <div className="toolbar">
          <div className="category-chips">
            {categories.map((item) => <button key={item} type="button" className={item === category ? 'chip active' : 'chip'} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <div className="sort-wrap">
            <button className="sort-button" type="button" onClick={() => setSortOpen((value) => !value)}><span>↕ SORT</span><Icon name="chevron" size={16} /></button>
            {sortOpen && <div className="sort-menu">{sortOptions.map((item) => <button key={item} type="button" className={item === sort ? 'selected' : ''} onClick={() => { setSort(item); setSortOpen(false); }}>{item}<span>{item === sort ? '✓' : ''}</span></button>)}</div>}
          </div>
        </div>

        <div className="results-line"><span>{filtered.length} demo courses shown</span><span>{query ? `Searching “${query}”` : category}</span></div>
        {refreshing && <div className="refresh-banner"><Icon name="refresh" size={16} /> Refreshing catalogue…</div>}
        <div className="course-grid">{filtered.map((course) => <CourseCard course={course} key={course.id} />)}</div>
        {!filtered.length && <div className="empty-state"><Icon name="search" size={28} /><h3>No courses found</h3><p>Try another search or reset the filters.</p><button type="button" onClick={() => { setQuery(''); setCategory('All Courses'); }}>RESET FILTERS</button></div>}
      </section>

      <section id="featured" className="content feature-section">
        <div className="feature-panel">
          <div className="feature-copy"><span className="section-kicker">CURATED FOR YOU</span><h2>Premium learning, without the clutter.</h2><p>A spacious catalogue shell that will become the front door to the complete course platform.</p><button type="button" className="feature-link" onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}>EXPLORE THE LIBRARY <Icon name="arrow" size={16} /></button></div>
          <div className="feature-visual" aria-hidden="true"><div className="feature-card f1"><small>01</small><strong>DISCOVER</strong></div><div className="feature-card f2"><small>02</small><strong>LEARN</strong></div><div className="feature-card f3"><small>03</small><strong>GROW</strong></div></div>
        </div>
      </section>

      <section id="request" className="content request-section"><div className="request-panel"><div><span className="section-kicker">CAN&apos;T FIND IT?</span><h2>Request a course.</h2><p>The request workflow will be connected to the production database later.</p></div><button type="button">REQUEST COURSE <span>↗</span></button></div></section>

      <section id="faq" className="content faq-section"><div className="section-heading"><span className="section-kicker">A LITTLE CLARITY</span><h2>Frequently asked questions.</h2></div><div className="faq-list">{faqs.map(([question, answer], index) => { const open = faqOpen === index; return <div className={open ? 'faq-row open' : 'faq-row'} key={question}><button type="button" onClick={() => setFaqOpen(open ? null : index)}><span>{question}</span><b>{open ? '−' : '+'}</b></button>{open && <p>{answer}</p>}</div>; })}</div></section>

      <footer className="footer"><div className="footer-inner"><div><strong>SAYEED <i>COURSES</i></strong><small>YOUR NEXT SKILL STARTS HERE</small></div><div className="footer-links"><a href="#courses">Courses</a><a href="#featured">Featured</a><a href="#request">Request</a><a href="#faq">FAQ</a></div></div><div className="footer-bottom">© 2026 Sayeed Courses · Premium course hub UI foundation</div></footer>

      {sheet && <div className="overlay" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) setSheet(null); }}><aside className="sheet"><button className="sheet-close" type="button" onClick={() => setSheet(null)} aria-label="Close"><Icon name="x" size={19} /></button>
        {sheet === 'category' && <><span className="section-kicker">EXPLORE YOUR INTERESTS</span><h2>Course categories.</h2><div className="category-list">{categories.map((item) => <button type="button" className={item === category ? 'category-row active' : 'category-row'} key={item} onClick={() => { setCategory(item); setSheet(null); }}><span>{item}</span><b>{item === 'All Courses' ? '3,390+' : '—'}</b></button>)}</div></>}
        {sheet === 'faq' && <><span className="section-kicker">A LITTLE CLARITY</span><h2>Questions & answers.</h2><div className="faq-list sheet-faq">{faqs.map(([question, answer], index) => { const open = faqOpen === index; return <div className={open ? 'faq-row open' : 'faq-row'} key={question}><button type="button" onClick={() => setFaqOpen(open ? null : index)}><span>{question}</span><b>{open ? '−' : '+'}</b></button>{open && <p>{answer}</p>}</div>; })}</div></>}
        {sheet === 'menu' && <><span className="section-kicker">KEEP IT SIMPLE</span><h2>Your course hub.</h2><div className="menu-block"><div className="menu-account"><span>ACCOUNT</span><strong>Guest learner</strong><small>Authentication will be connected in the backend phase.</small></div><button type="button" onClick={() => setSheet('category')}><span>Categories</span><b>→</b></button><button type="button" onClick={() => setSheet('faq')}><span>FAQs</span><b>→</b></button><button type="button" onClick={() => setSheet('bag')}><span>My Courses</span><b>0</b></button></div></>}
        {sheet === 'bag' && <><span className="section-kicker">YOUR NEXT CHAPTER</span><h2>My course shelf.</h2><div className="bag-empty"><Icon name="bag" size={29} /><h3>Your shelf is empty.</h3><p>Save a course to start building your personal learning list.</p><button type="button" onClick={() => setSheet(null)}>BROWSE COURSES</button></div></>}
      </aside></div>}
    </main>
  );
}
