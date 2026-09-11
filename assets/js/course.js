(function () {
  const params = new URLSearchParams(location.search);
  const courseId = params.get('id');
  const api = window.SayeedCourses;
  const courses = api.getData().map(api.normalizeCourse);
  const course = courses.find(c => c.id === courseId);

  const hero = document.getElementById('courseHero');
  const moduleList = document.getElementById('moduleList');
  const moduleCount = document.getElementById('moduleCount');
  const playerWrap = document.getElementById('playerWrap');
  const lessonInfo = document.getElementById('lessonInfo');

  if (!course) {
    hero.innerHTML = '<div><span class="eyebrow">COURSE NOT FOUND</span><h1>This course is unavailable.</h1><p>Return to Courses and choose another course.</p></div><a class="primary-btn" href="index.html">Back to Courses</a>';
    return;
  }

  document.title = `${course.name} — Sayeed Courses`;
  hero.innerHTML = `<div><span class="eyebrow">COURSE</span><h1>${api.escapeHtml(course.name)}</h1><p>${api.escapeHtml(course.description || course.subtitle || 'Choose a module to start learning.')}</p></div><div class="hero-stat"><strong>${course.modules.length}</strong><span>Modules</span></div>`;
  moduleCount.textContent = course.modules.length;

  const modules = [...course.modules].sort((a,b) => Number(a.number)-Number(b.number));
  moduleList.innerHTML = modules.length ? '' : '<div class="module-empty">No modules have been added yet.</div>';

  modules.forEach((m, i) => {
    const btn = document.createElement('button');
    btn.className = 'module-item';
    btn.type = 'button';
    btn.innerHTML = `<span class="module-index">${String(m.number || i+1).padStart(2,'0')}</span><span class="module-copy"><b>${api.escapeHtml(m.title)}</b><small>${api.escapeHtml(m.description || 'Video lesson')}</small></span><span class="module-arrow">▶</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.module-item').forEach(el=>el.classList.remove('active'));
      btn.classList.add('active');
      playModule(m);
    });
    moduleList.appendChild(btn);
  });

  function playModule(m) {
    const id = api.youtubeId(m.url);
    if (!id) {
      playerWrap.innerHTML = `<div class="player-error"><h3>Invalid YouTube link</h3><p>Please ask the admin to check this module.</p></div>`;
      return;
    }
    playerWrap.innerHTML = `
      <div class="video-frame">
        <iframe
          src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1&playsinline=1"
          title="${api.escapeHtml(m.title)}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"></iframe>
      </div>`;
    lessonInfo.innerHTML = `<span class="eyebrow">NOW PLAYING</span><h2>Module ${String(m.number).padStart(2,'0')} — ${api.escapeHtml(m.title)}</h2><p>${api.escapeHtml(m.description || 'Continue your course at your own pace.')}</p>`;
    window.scrollTo({ top: playerWrap.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
  }
})();
