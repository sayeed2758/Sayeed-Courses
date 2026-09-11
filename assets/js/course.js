import { getCourses } from './db.js';

const $ = s => document.querySelector(s);
let player = null;
let pendingVideoId = null;
let selectedLesson = null;
let course = null;

window.onYouTubeIframeAPIReady = () => { if (pendingVideoId) loadYouTube(pendingVideoId); };

function getId() { return new URLSearchParams(location.search).get('id'); }
function esc(v='') { return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function image(c){ return c.thumbnail || 'assets/images/logo.png'; }
function extractYoutubeId(url='') {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    return u.searchParams.get('v') || (u.pathname.match(/\/embed\/([^/]+)/)||[])[1] || '';
  } catch { return url.trim().match(/[A-Za-z0-9_-]{11}/)?.[0] || ''; }
}

function renderCourseHero() {
  $('#courseHero').innerHTML = `<div class="course-hero-inner"><div class="course-hero-copy"><span class="eyebrow">${esc(course.category || 'COURSE')}</span><h1>${esc(course.title)}</h1><p>${esc(course.description || 'Chapter-wise video lessons designed for focused learning.')}</p><div class="hero-meta"><span>▶ ${(course.lessons||[]).filter(l=>l.published!==false).length} lessons</span><span>▦ ${new Set((course.lessons||[]).map(l=>l.chapter)).size} chapters</span></div></div><img class="course-hero-image" src="${esc(image(course))}" alt=""></div>`;
}

function renderChapters() {
  const lessons=(course.lessons||[]).filter(l=>l.published!==false).sort((a,b)=>(a.order??0)-(b.order??0));
  const groups = new Map();
  lessons.forEach(l=>{ const k=l.chapter||'General'; if(!groups.has(k)) groups.set(k,[]); groups.get(k).push(l); });
  $('#lessonCount').textContent = `${lessons.length} lessons`;
  $('#chapterList').innerHTML = [...groups.entries()].map(([chapter,ls],i)=>`<div class="chapter-card ${i===0?'open':''}"><button class="chapter-toggle" data-chapter="${esc(chapter)}"><div><span class="chapter-kicker">CHAPTER</span><strong>${esc(chapter)}</strong></div><span class="chapter-count">${ls.length} parts <span class="chev">⌄</span></span></button><div class="lesson-list">${ls.map((l,j)=>`<button class="lesson-row ${j===0&&i===0?'active':''}" data-lesson-id="${esc(l.id)}"><span class="lesson-index">${String(j+1).padStart(2,'0')}</span><span class="lesson-main"><strong>${esc(l.title)}</strong><small>${esc(l.part||'Lesson')}</small></span><span class="lesson-play">▶</span></button>`).join('')}</div></div>`).join('');
  document.querySelectorAll('.chapter-toggle').forEach(btn=>btn.addEventListener('click',()=>btn.parentElement.classList.toggle('open')));
  document.querySelectorAll('.lesson-row').forEach(btn=>btn.addEventListener('click',()=>selectLesson(btn.dataset.lessonId)));
  const first=lessons[0]; if(first) selectLesson(first.id);
}

function selectLesson(id){
  selectedLesson=(course.lessons||[]).find(l=>l.id===id); if(!selectedLesson) return;
  document.querySelectorAll('.lesson-row').forEach(b=>b.classList.toggle('active',b.dataset.lessonId===id));
  pendingVideoId=selectedLesson.youtubeId || extractYoutubeId(selectedLesson.youtubeUrl || selectedLesson.url || '');
  loadYouTube(pendingVideoId);
  $('#nowPlaying').classList.remove('hidden');
  $('#nowPlaying').innerHTML=`<span class="now-label">NOW PLAYING</span><strong>${esc(selectedLesson.title)}</strong><span>${esc(selectedLesson.chapter||'')} • ${esc(selectedLesson.part||'')}</span>`;
  $('#playerPanel').scrollIntoView({behavior:'smooth',block:'nearest'});
}

function loadYouTube(videoId){
  if(!videoId){ $('#playerShell').innerHTML='<div class="player-error">This lesson has no valid YouTube video ID.</div>'; return; }
  const mountId='ytPlayer';
  $('#playerShell').innerHTML=`<div class="youtube-frame-wrap"><div id="${mountId}"></div><div class="player-gradient"></div><div class="custom-controls"><button id="pp" class="player-control">▶</button><div class="progress-track"><div id="progress" class="progress-fill"></div></div><button id="mute" class="player-control">🔊</button><button id="fs" class="player-control">⛶</button></div></div>`;
  if(window.YT && window.YT.Player){ createPlayer(mountId,videoId); } else { pendingVideoId=videoId; }
}
function createPlayer(mountId,videoId){
  player?.destroy?.();
  player=new YT.Player(mountId,{videoId,playerVars:{autoplay:1,controls:0,rel:0,modestbranding:1,playsinline:1,iv_load_policy:3},events:{onReady:()=>bindControls(),onStateChange:()=>{}}});
}
function bindControls(){
  $('#pp').onclick=()=>{ if(player.getPlayerState()===1){player.pauseVideo();$('#pp').textContent='▶';}else{player.playVideo();$('#pp').textContent='❚❚';} };
  $('#mute').onclick=()=>{ if(player.isMuted()){player.unMute();$('#mute').textContent='🔊';}else{player.mute();$('#mute').textContent='🔇';} };
  $('#fs').onclick=()=>document.querySelector('.youtube-frame-wrap')?.requestFullscreen?.();
  const track=$('.progress-track');
  track.onclick=e=>{ const r=track.getBoundingClientRect(); const pct=(e.clientX-r.left)/r.width; player.seekTo(player.getDuration()*pct,true); };
  setInterval(()=>{ if(player?.getCurrentTime){const p=(player.getCurrentTime()/player.getDuration())*100; if(Number.isFinite(p)) $('#progress').style.width=`${p}%`; }},500);
}

async function init(){ $('#year').textContent=new Date().getFullYear(); const id=getId(); const courses=await getCourses(); course=courses.find(c=>c.id===id) || courses[0]; if(!course){$('#courseHero').innerHTML='<div class="error-state">Course not found.</div>';return;} renderCourseHero(); renderChapters(); }
init().catch(err=>{console.error(err); $('#chapterList').innerHTML=`<div class="error-state">${esc(err.message)}</div>`;});
