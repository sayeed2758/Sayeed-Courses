import { getCourses } from './db.js';

const state = { courses: [] };
const $ = s => document.querySelector(s);

function courseImage(course) {
  if (course.thumbnail) return course.thumbnail;
  return 'assets/images/logo.png';
}

function renderCourses() {
  const q = ($('#courseSearch')?.value || '').trim().toLowerCase();
  const filter = $('#courseFilter')?.value || 'all';
  const list = state.courses.filter(c => {
    const text = `${c.title} ${c.category||''} ${c.description||''}`.toLowerCase();
    return (!q || text.includes(q)) && (filter === 'all' || (c.category || 'Other') === filter);
  });
  const grid = $('#courseGrid'); const empty = $('#courseEmpty');
  grid.innerHTML = list.map(c => `<article class="course-card"><a href="course.html?id=${encodeURIComponent(c.id)}" class="course-cover"><img src="${escapeAttr(courseImage(c))}" alt=""><span class="cover-badge">${(c.lessons||[]).filter(l=>l.published!==false).length} lessons</span></a><div class="course-card-body"><span class="course-category">${escapeHTML(c.category || 'COURSE')}</span><h3>${escapeHTML(c.title)}</h3><p>${escapeHTML(c.description || 'Learn chapter by chapter with focused lessons.')}</p><a class="text-link" href="course.html?id=${encodeURIComponent(c.id)}">Open course →</a></div></article>`).join('');
  empty.classList.toggle('hidden', list.length>0);
}

function setFilters() {
  const filter = $('#courseFilter');
  const values = [...new Set(state.courses.map(c=>c.category).filter(Boolean))];
  filter.innerHTML = `<option value="all">All courses</option>` + values.map(v=>`<option value="${escapeAttr(v)}">${escapeHTML(v)}</option>`).join('');
}

function escapeHTML(v='') { return String(v).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function escapeAttr(v='') { return escapeHTML(v); }

async function init() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  $('#year').textContent = new Date().getFullYear();
  $('#menuBtn')?.addEventListener('click',()=>$('#mobileNav').classList.toggle('open'));
  state.courses = await getCourses(); setFilters(); renderCourses();
  $('#courseSearch')?.addEventListener('input',renderCourses); $('#courseFilter')?.addEventListener('change',renderCourses);
}
init().catch(err=>{ console.error(err); $('#courseGrid').innerHTML=`<div class="error-state">Could not load courses. ${escapeHTML(err.message)}</div>`; });
