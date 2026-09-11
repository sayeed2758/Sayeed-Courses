(function () {
  const api = window.SayeedCourses;
  let data = api.getData().map(api.normalizeCourse);
  const $ = id => document.getElementById(id);
  const form = $('courseForm'); const moduleForm = $('moduleForm');
  const courseSelect = $('moduleCourse');
  const adminList = $('adminList');
  const toast = $('toast');

  function notify(msg, bad=false) {
    toast.textContent = msg; toast.className = `toast show${bad?' bad':''}`;
    clearTimeout(notify.t); notify.t = setTimeout(()=>toast.className='toast', 2400);
  }
  function persist(){ api.saveData(data); }
  function refreshCourseSelect(){
    courseSelect.innerHTML = data.length ? data.map(c=>`<option value="${api.escapeHtml(c.id)}">${api.escapeHtml(c.name)}</option>`).join('') : '<option value="">Create a course first</option>';
  }
  function render(){
    refreshCourseSelect(); adminList.innerHTML='';
    if(!data.length){ adminList.innerHTML='<div class="admin-empty">No courses yet. Create your first course above.</div>'; return; }
    data.forEach(c=>{
      const block=document.createElement('div'); block.className='admin-course';
      const modules=[...(c.modules||[])].sort((a,b)=>Number(a.number)-Number(b.number));
      block.innerHTML=`<div class="admin-course-head"><div><span class="eyebrow">COURSE</span><h3>${api.escapeHtml(c.name)}</h3><p>${api.escapeHtml(c.subtitle||'')}</p></div><div class="row-actions"><button class="tiny-btn" data-edit="${c.id}">Edit</button><button class="tiny-btn danger" data-delete="${c.id}">Delete</button></div></div><div class="admin-modules">${modules.length?modules.map(m=>`<div class="admin-module"><div class="admin-module-title"><span class="module-index">${String(m.number).padStart(2,'0')}</span><div><b>${api.escapeHtml(m.title)}</b><small>${api.escapeHtml(m.url)}</small></div></div><button class="tiny-btn danger" data-delmodule="${c.id}" data-mid="${m.id}">Remove</button></div>`).join(''):'<div class="module-empty">No modules added.</div>'}</div>`;
      adminList.appendChild(block);
    });
  }
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const id=$('courseId').value; const payload={name:$('courseName').value.trim(),subtitle:$('courseSubtitle').value.trim(),description:$('courseDescription').value.trim(),cover:$('courseCover').value.trim()};
    if(!payload.name) return;
    if(id){ const c=data.find(x=>x.id===id); Object.assign(c,payload); notify('Course updated.'); }
    else { data.push(api.normalizeCourse({id:crypto.randomUUID(),...payload,modules:[]})); notify('Course created.'); }
    persist(); resetCourse(); render();
  });
  moduleForm.addEventListener('submit', e=>{
    e.preventDefault();
    const course=data.find(x=>x.id===courseSelect.value); if(!course) return notify('Create a course first.', true);
    const url=$('moduleUrl').value.trim(); const vid=api.youtubeId(url); if(!vid) return notify('Enter a valid YouTube link.', true);
    const n=Number($('moduleNumber').value); if(!Number.isInteger(n)||n<1) return notify('Module number must be 1 or higher.', true);
    course.modules=course.modules||[]; const duplicate=course.modules.find(m=>Number(m.number)===n); if(duplicate) return notify('That module number already exists.', true);
    course.modules.push({id:crypto.randomUUID(),number:n,title:$('moduleTitle').value.trim(),url,description:$('moduleDescription').value.trim()});
    course.modules.sort((a,b)=>Number(a.number)-Number(b.number)); persist(); resetModule(); render(); notify('Module added.');
  });
  adminList.addEventListener('click', e=>{
    const edit=e.target.closest('[data-edit]'); const del=e.target.closest('[data-delete]'); const dm=e.target.closest('[data-delmodule]');
    if(edit){ const c=data.find(x=>x.id===edit.dataset.edit); $('courseId').value=c.id; $('courseName').value=c.name; $('courseSubtitle').value=c.subtitle||''; $('courseDescription').value=c.description||''; $('courseCover').value=c.cover||''; window.scrollTo({top:0,behavior:'smooth'}); }
    if(del){ data=data.filter(x=>x.id!==del.dataset.delete); persist(); render(); notify('Course deleted.'); }
    if(dm){ const c=data.find(x=>x.id===dm.dataset.delmodule); c.modules=(c.modules||[]).filter(m=>m.id!==dm.dataset.mid); persist(); render(); notify('Module removed.'); }
  });
  function resetCourse(){ form.reset(); $('courseId').value=''; }
  function resetModule(){ moduleForm.reset(); if(data[0]) courseSelect.value=data[0].id; }
  $('resetCourse').onclick=resetCourse; $('resetModule').onclick=resetModule; $('refreshAdmin').onclick=()=>{data=api.getData().map(api.normalizeCourse);render();notify('Refreshed.');};
  render();
})();
