(function () {
  const cfg = window.SayeedConfig;
  const storageKey = cfg.storageKey;

  function seed() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    const demo = [];
    localStorage.setItem(storageKey, JSON.stringify(demo));
    return demo;
  }

  function getData() { return seed(); }
  function saveData(data) { localStorage.setItem(storageKey, JSON.stringify(data)); }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function youtubeId(input) {
    try {
      const u = new URL(input);
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
      if (u.hostname.includes('youtube.com')) {
        return u.searchParams.get('v') || (u.pathname.startsWith('/embed/') ? u.pathname.split('/embed/')[1] : '');
      }
    } catch (_) {}
    return '';
  }

  function normalizeCourse(c) {
    return {
      id: c.id || crypto.randomUUID(),
      name: c.name || 'Untitled Course',
      subtitle: c.subtitle || '',
      description: c.description || '',
      cover: c.cover || '',
      modules: Array.isArray(c.modules) ? c.modules : []
    };
  }

  function renderHome() {
    const grid = document.getElementById('courseGrid');
    if (!grid) return;
    const data = getData().map(normalizeCourse);
    const count = document.getElementById('courseCount');
    const empty = document.getElementById('emptyState');
    if (count) count.textContent = `${data.length} Course${data.length === 1 ? '' : 's'}`;
    grid.innerHTML = '';
    if (!data.length) { empty?.classList.remove('hidden'); return; }
    empty?.classList.add('hidden');
    data.forEach((course, index) => {
      const card = document.createElement('a');
      card.className = 'course-card glass-card';
      card.href = `course.html?id=${encodeURIComponent(course.id)}`;
      const initials = course.name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase() || 'SC';
      card.innerHTML = `
        <div class="course-art" style="${course.cover ? `background-image:url('${escapeHtml(course.cover)}')` : ''}">
          ${course.cover ? '' : `<span>${escapeHtml(initials)}</span>`}
          <div class="course-art-overlay"><span>OPEN COURSE</span><b>→</b></div>
        </div>
        <div class="course-card-body">
          <div class="course-number">COURSE ${String(index+1).padStart(2,'0')}</div>
          <h3>${escapeHtml(course.name)}</h3>
          <p>${escapeHtml(course.subtitle || course.description || 'Video learning course')}</p>
          <div class="course-meta"><span>${course.modules.length} module${course.modules.length===1?'':'s'}</span><span>▶ Watch</span></div>
        </div>`;
      grid.appendChild(card);
    });
  }

  window.SayeedCourses = {
    getData, saveData, youtubeId, escapeHtml, normalizeCourse, renderHome
  };
})();
