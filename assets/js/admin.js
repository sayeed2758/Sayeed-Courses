import { adminEmail, isFirebaseConfigured } from './config.js';
import { getCourses, saveCourse, saveLesson, deleteCourse, deleteLesson, initFirebase, defaultDemo } from './db.js';

const $=s=>document.querySelector(s); const state={courses:[], firebase:false, user:null};
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

async function boot(){
  $('#year').textContent=new Date().getFullYear();
  const env=await initFirebase(); state.firebase=env.configured;
  if(state.firebase){
    const authMod=env.authMod; authMod.onAuthStateChanged(env.auth, user=>{state.user=user; updateAuth();});
  } else { state.user={demo:true,email:'Demo Admin'}; updateAuth(); }
  $('#loginForm').addEventListener('submit',login); $('#logoutBtn').addEventListener('click',logout); $('#courseForm').addEventListener('submit',saveCourseForm); $('#lessonForm').addEventListener('submit',saveLessonForm); $('#resetCourseBtn').onclick=resetCourse; $('#refreshAdminBtn').onclick=load; $('#seedDemoBtn').onclick=seedDemo;
}
function updateAuth(){ const logged=!!state.user; $('#loginCard').classList.toggle('hidden',logged); $('#adminDashboard').classList.toggle('hidden',!logged); $('#logoutBtn').classList.toggle('hidden',!logged); if(logged) load(); }
async function login(e){ e.preventDefault(); const msg=$('#loginMessage'); msg.textContent=''; if(!state.firebase){msg.textContent='Demo mode is active. No Firebase sign-in is required.'; state.user={demo:true}; updateAuth(); return;} try{const env=await initFirebase(); await env.authMod.signInWithEmailAndPassword(env.auth,$('#loginEmail').value.trim(),$('#loginPassword').value);}catch(err){msg.textContent=err.message;} }
async function logout(){ if(!state.firebase){state.user=null;updateAuth();return;} const env=await initFirebase(); await env.authMod.signOut(env.auth); }
async function load(){ state.courses=await getCourses({includeUnpublished:true}); fillCourseSelect(); renderLibrary(); }
function fillCourseSelect(){ $('#lessonCourse').innerHTML=state.courses.map(c=>`<option value="${esc(c.id)}">${esc(c.title)}</option>`).join(''); }
function renderLibrary(){ const box=$('#adminLibrary'); if(!state.courses.length){box.innerHTML='<div class="empty-state">No courses yet.</div>';return;} box.innerHTML=state.courses.map(c=>`<article class="admin-course"><div class="admin-course-main"><span class="course-category">${esc(c.category||'COURSE')}</span><h3>${esc(c.title)}</h3><p>${esc(c.description||'')}</p><div class="admin-mini-meta"><span>${(c.lessons||[]).length} lessons</span><span>${c.published?'Published':'Draft'}</span></div></div><div class="admin-course-actions"><button class="btn btn-ghost small" data-edit="${esc(c.id)}">Edit</button><button class="btn btn-danger small" data-delete="${esc(c.id)}">Delete</button></div><div class="admin-lessons">${groupLessons(c).map(([ch,ls])=>`<div class="admin-chapter"><strong>${esc(ch)}</strong>${ls.map(l=>`<div class="admin-lesson"><span>${esc(l.part||'')} — ${esc(l.title)}</span><button class="icon-delete" data-lesson-delete="${esc(c.id)}" data-lesson-id="${esc(l.id)}">×</button></div>`).join('')}</div>`).join('')}</div></article>`).join('');
  box.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editCourse(b.dataset.edit)); box.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>removeCourse(b.dataset.delete)); box.querySelectorAll('[data-lesson-delete]').forEach(b=>b.onclick=()=>removeLesson(b.dataset.lessonDelete,b.dataset.lessonId)); }
function groupLessons(c){const m=new Map();(c.lessons||[]).forEach(l=>{const k=l.chapter||'General';if(!m.has(k))m.set(k,[]);m.get(k).push(l)});return [...m.entries()];}
async function saveCourseForm(e){e.preventDefault();const data={id:$('#editingCourseId').value||undefined,title:$('#courseTitle').value.trim(),category:$('#courseCategory').value.trim(),description:$('#courseDescription').value.trim(),thumbnail:$('#courseThumb').value.trim(),published:$('#coursePublished').checked}; if(!data.title)return;await saveCourse(data);resetCourse();await load();}
function editCourse(id){const c=state.courses.find(c=>c.id===id);if(!c)return;$('#editingCourseId').value=c.id;$('#courseTitle').value=c.title;$('#courseCategory').value=c.category||'';$('#courseDescription').value=c.description||'';$('#courseThumb').value=c.thumbnail||'';$('#coursePublished').checked=c.published!==false;$('#courseSaveMode').textContent='Editing';scrollTo({top:0,behavior:'smooth'});}
function resetCourse(){['editingCourseId','courseTitle','courseCategory','courseDescription','courseThumb'].forEach(id=>$('#'+id).value='');$('#coursePublished').checked=true;$('#courseSaveMode').textContent='New';}
async function removeCourse(id){if(!confirm('Delete this course and all of its lessons?'))return;await deleteCourse(id);await load();}
async function saveLessonForm(e){e.preventDefault(); const id=$('#lessonCourse').value; if(!id)return; const youtubeUrl=$('#youtubeUrl').value.trim(); const youtubeId=extractYoutubeId(youtubeUrl); if(!youtubeId){alert('Please enter a valid YouTube URL.');return;} await saveLesson(id,{title:$('#lessonTitle').value.trim(),chapter:$('#lessonChapter').value.trim()||'Chapter 1',part:$('#lessonPart').value.trim()||'Part 1',youtubeId,order:Number($('#lessonOrder').value)||1,published:$('#lessonPublished').checked}); e.target.reset();$('#lessonOrder').value='1';await load();}
function extractYoutubeId(url){try{const u=new URL(url); if(u.hostname.includes('youtu.be'))return u.pathname.slice(1); return u.searchParams.get('v') || (u.pathname.match(/\/embed\/([^/]+)/)||[])[1] || '';}catch{return url.match(/[A-Za-z0-9_-]{11}/)?.[0]||'';}}
async function removeLesson(courseId,lessonId){if(!confirm('Delete this lesson?'))return;await deleteLesson(courseId,lessonId);await load();}
async function seedDemo(){ if(state.firebase){alert('Demo seed is intended for local mode only.');return;} localStorage.setItem('sayeed_courses_demo_v1',JSON.stringify(defaultDemo));await load();alert('Demo course loaded.'); }
boot().catch(console.error);
