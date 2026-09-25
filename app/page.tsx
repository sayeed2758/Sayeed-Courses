'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Menu, Search, Sparkles, X } from 'lucide-react';

const categories = ['All', 'School', 'JEE', 'NEET', 'UPSC', 'SSC', 'Banking'];
const sorts = ['Recommended', 'Newest', 'Name A–Z', 'Course #'];

const demoCourses = Array.from({ length: 18 }, (_, index) => {
  const id = index + 1;
  const category = categories[(index % (categories.length - 1)) + 1];
  const educators = ['Shahid Academy', 'Elite Faculty', 'Pro Learning'];
  return {
    id,
    category,
    title: `${category} Masterclass ${String(id).padStart(2, '0')}`,
    educator: educators[index % educators.length],
    year: 2026,
    badge: index % 5 === 0 ? 'FEATURED' : index % 3 === 0 ? 'NEW' : 'VERIFIED',
  };
});

const faqs = [
  ['How do I find a course?', 'Search by course name, instructor, category, or course number.'],
  ['Can I filter the catalogue?', 'Yes. Use the category chips and sorting control above the course grid.'],
  ['Will the mobile version work like an app?', 'Yes. The final project will be installable as a Progressive Web App.'],
  ['Where will the real course data come from?', 'Later phases will connect this interface to your authorized production course database.'],
];

function CourseCard({ course }: { course: (typeof demoCourses)[number] }) {
  return (
    <article className="course-card">
      <div className="course-art">
        <span className="course-number">#{String(course.id).padStart(4, '0')}</span>
        <div className="art-grid" />
        <div className="art-orbit orbit-a" />
        <div className="art-orbit orbit-b" />
        <span className="art-letter">{course.category.slice(0, 1)}</span>
        <span className="course-badge">{course.badge}</span>
      </div>
      <div className="card-body">
        <div className="mini-meta">
          <span>{course.category}</span>
          <span>{course.year}</span>
        </div>
        <h3>{course.title}</h3>
        <p>{course.educator}</p>
        <button type="button" className="access-btn">View course <span>↗</span></button>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('Recommended');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = demoCourses.filter((course) => {
      const categoryMatch = category === 'All' || course.category === category;
      const text = `${course.title} ${course.educator} ${course.category} ${course.id}`.toLowerCase();
      return categoryMatch && (!normalized || text.includes(normalized));
    });

    if (sort === 'Newest') return [...result].sort((a, b) => b.id - a.id);
    if (sort === 'Name A–Z') return [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'Course #') return [...result].sort((a, b) => a.id - b.id);
    return result;
  }, [query, category, sort]);

  return (
    <main className="site-shell">
      <header className="topbar">
        <div className="header-inner">
          <a href="#top" className="brand" aria-label="CourseHub home">
            <span className="brand-mark"><Sparkles size={18} /></span>
            <span className="brand-copy">
              <strong>COURSE<span>HUB</span></strong>
              <small>PREMIUM LEARNING LIBRARY</small>
            </span>
          </a>

          <nav className={menuOpen ? 'desktop-nav mobile-open' : 'desktop-nav'}>
            <a href="#courses" onClick={() => setMenuOpen(false)}>Courses</a>
            <a href="#featured" onClick={() => setMenuOpen(false)}>Featured</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <a href="#request" className="nav-cta" onClick={() => setMenuOpen(false)}>Request Course</a>
          </nav>

          <button className="menu-btn" type="button" aria-label="Toggle menu" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      <section id="top" className="hero">
        <div className="hero-noise" aria-hidden="true" />
        <div className="hero-light light-a" aria-hidden="true" />
        <div className="hero-light light-b" aria-hidden="true" />
        <div className="hero-content">
          <span className="eyebrow"><Sparkles size={14} /> CURIOUS MINDS. ENDLESS POSSIBILITIES.</span>
          <h1>Find your next <em>skill.</em></h1>
          <p>One premium catalogue for discovering courses quickly, with a clean interface that stays focused on learning.</p>

          <div className="search-wrap">
            <Search size={21} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search course by name or # number..."
              aria-label="Search course by name or number"
            />
            {query && (
              <button type="button" className="clear-search" aria-label="Clear search" onClick={() => setQuery('')}>
                <X size={17} />
              </button>
            )}
            <span className="search-count">3,390+</span>
          </div>

          <div className="hero-trust">
            <span>VERIFIED CATALOGUE</span>
            <i />
            <span>FAST SEARCH</span>
            <i />
            <span>PWA READY</span>
          </div>
        </div>
      </section>

      <section id="courses" className="section catalogue-section">
        <div className="section-topline">
          <div>
            <span className="section-kicker">THE LIBRARY</span>
            <h2>Explore all courses <small>(3,390)</small></h2>
          </div>
          <p>Step 1 demo catalogue · production data comes later</p>
        </div>

        <div className="controls">
          <div className="chips" aria-label="Course categories">
            {categories.map((item) => (
              <button key={item} type="button" className={item === category ? 'chip active' : 'chip'} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>
          <label className="sort-control">
            <span>SORT</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort courses">
              {sorts.map((item) => <option key={item}>{item}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </label>
        </div>

        <div className="results-line">
          <span>{filtered.length} demo courses shown</span>
          <span>{query ? `Searching for “${query}”` : category === 'All' ? 'All categories' : category}</span>
        </div>

        {filtered.length ? (
          <div className="course-grid">
            {filtered.map((course) => <CourseCard key={course.id} course={course} />)}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={26} />
            <h3>No courses found</h3>
            <p>Try another title, instructor, category, or course number.</p>
          </div>
        )}
      </section>

      <section id="featured" className="section showcase-section">
        <div className="showcase-card">
          <div>
            <span className="section-kicker">CURATED PICKS</span>
            <h2>A catalogue that feels like a product, not a spreadsheet.</h2>
            <p>The visual direction stays editorial, spacious and premium while the underlying system is built to scale later.</p>
          </div>
          <div className="showcase-stack" aria-hidden="true">
            <div className="stack-card"><span>01</span><b>DISCOVER</b></div>
            <div className="stack-card offset"><span>02</span><b>LEARN</b></div>
            <div className="stack-card offset-more"><span>03</span><b>GROW</b></div>
          </div>
        </div>
      </section>

      <section id="request" className="section request-section">
        <div className="request-card">
          <div>
            <span className="section-kicker">CAN&apos;T FIND IT?</span>
            <h2>Request a course.</h2>
            <p>The request workflow will be connected to the database and admin panel in a later phase.</p>
          </div>
          <button type="button" className="primary-btn">Request course <span>↗</span></button>
        </div>
      </section>

      <section id="faq" className="section faq-section">
        <div className="section-heading">
          <span className="section-kicker">SUPPORT</span>
          <h2>Frequently asked questions.</h2>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => {
            const open = openFaq === index;
            return (
              <div className={open ? 'faq-item open' : 'faq-item'} key={question}>
                <button type="button" onClick={() => setOpenFaq(open ? null : index)} className="faq-question">
                  <span>{question}</span>
                  <span className="faq-icon">{open ? '−' : '+'}</span>
                </button>
                {open && <p className="faq-answer">{answer}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div>
            <strong>COURSE<span>HUB</span></strong>
            <small>Premium Course Library</small>
          </div>
          <div className="footer-links">
            <a href="#courses">Courses</a>
            <a href="#featured">Featured</a>
            <a href="#faq">FAQ</a>
          </div>
        </div>
        <div className="footer-bottom">© 2026 CourseHub · Step 1 UI Foundation</div>
      </footer>
    </main>
  );
}
