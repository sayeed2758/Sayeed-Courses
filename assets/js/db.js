import { firebaseConfig, isFirebaseConfigured } from './config.js';

let firebase = null;
let db = null;
let auth = null;

export async function initFirebase() {
  if (!isFirebaseConfigured() || firebase) return { configured: isFirebaseConfigured(), db, auth };
  const [{ initializeApp }, authMod, fsMod] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js')
  ]);
  firebase = initializeApp(firebaseConfig);
  auth = authMod.getAuth(firebase);
  db = fsMod.getFirestore(firebase);
  return { configured: true, db, auth, authMod, fsMod };
}

export { isFirebaseConfigured };

const DEMO_KEY = 'sayeed_courses_demo_v1';
const defaultDemo = [
  {
    id: 'demo-social-science',
    title: 'Class 10 Social Science',
    category: 'CBSE • Social Science',
    description: 'Chapter-wise video classes with focused lessons and parts.',
    thumbnail: '',
    published: true,
    lessons: [
      { id:'l1', title:'Power Sharing — Part 1', chapter:'Chapter 1', part:'Part 1', youtubeId:'dQw4w9WgXcQ', order:1, published:true },
      { id:'l2', title:'Power Sharing — Part 2', chapter:'Chapter 1', part:'Part 2', youtubeId:'dQw4w9WgXcQ', order:2, published:true },
      { id:'l3', title:'Federalism — Part 1', chapter:'Chapter 2', part:'Part 1', youtubeId:'dQw4w9WgXcQ', order:3, published:true }
    ]
  }
];

function readLocal() {
  try { return JSON.parse(localStorage.getItem(DEMO_KEY) || 'null') || structuredClone(defaultDemo); }
  catch { return structuredClone(defaultDemo); }
}
function writeLocal(courses) { localStorage.setItem(DEMO_KEY, JSON.stringify(courses)); }

export async function getCourses({ includeUnpublished=false }={}) {
  const env = await initFirebase();
  if (!env.configured) {
    const data = readLocal();
    return includeUnpublished ? data : data.filter(c => c.published);
  }
  const { collection, getDocs, orderBy, query, where } = env.fsMod;
  const ref = collection(env.db, 'courses');
  const q = includeUnpublished ? query(ref, orderBy('title')) : query(ref, where('published','==',true), orderBy('title'));
  const snap = await getDocs(q);
  const courses = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const lessonsSnap = await getDocs(query(collection(env.db, 'courses', docSnap.id, 'lessons'), orderBy('order')));
    const lessons = lessonsSnap.docs.map(d => ({ id:d.id, ...d.data() }));
    courses.push({ id:docSnap.id, ...data, lessons });
  }
  return courses;
}

export async function saveCourse(course) {
  const env = await initFirebase();
  if (!env.configured) {
    const all = readLocal();
    const id = course.id || `course-${Date.now()}`;
    const idx = all.findIndex(c => c.id === id);
    const value = { ...course, id, lessons: idx >= 0 ? all[idx].lessons : [] };
    idx >= 0 ? all.splice(idx,1,value) : all.push(value);
    writeLocal(all); return value;
  }
  const { collection, doc, setDoc, serverTimestamp } = env.fsMod;
  const id = course.id || doc(collection(env.db,'courses')).id;
  const { lessons, id:ignored, ...payload } = course;
  await setDoc(doc(env.db,'courses',id), { ...payload, updatedAt:serverTimestamp(), createdAt:course.createdAt || serverTimestamp() }, { merge:true });
  return { ...course, id };
}

export async function deleteCourse(id) {
  const env = await initFirebase();
  if (!env.configured) { writeLocal(readLocal().filter(c => c.id !== id)); return; }
  const { collection, deleteDoc, doc, getDocs } = env.fsMod;
  const lessons = await getDocs(collection(env.db,'courses',id,'lessons'));
  await Promise.all(lessons.docs.map(d=>deleteDoc(d.ref)));
  await deleteDoc(doc(env.db,'courses',id));
}

export async function saveLesson(courseId, lesson) {
  const env = await initFirebase();
  if (!env.configured) {
    const all = readLocal();
    const c = all.find(x => x.id === courseId);
    if (!c) throw new Error('Course not found');
    c.lessons = c.lessons || [];
    c.lessons.push({ ...lesson, id:`lesson-${Date.now()}` });
    writeLocal(all); return;
  }
  const { collection, doc, setDoc, serverTimestamp } = env.fsMod;
  const ref = doc(collection(env.db,'courses',courseId,'lessons'));
  await setDoc(ref, { ...lesson, createdAt:serverTimestamp() });
}

export async function deleteLesson(courseId, lessonId) {
  const env = await initFirebase();
  if (!env.configured) {
    const all = readLocal(); const c=all.find(x=>x.id===courseId); if(c) c.lessons=(c.lessons||[]).filter(l=>l.id!==lessonId); writeLocal(all); return;
  }
  await env.fsMod.deleteDoc(env.fsMod.doc(env.db,'courses',courseId,'lessons',lessonId));
}

export { defaultDemo };
