import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const recordsCol = (uid) => collection(db, 'users', uid, 'records');
const skillsDoc = (uid) => doc(db, 'users', uid, 'meta', 'skills');

// Records — realtime subscription, returns unsubscribe fn
export const subscribeRecords = (uid, callback) => {
  const q = query(recordsCol(uid), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const addRecord = async (uid, record) => {
  const ref = await addDoc(recordsCol(uid), {
    ...record,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateRecord = async (uid, id, data) => {
  await updateDoc(doc(recordsCol(uid), id), data);
};

export const deleteRecord = async (uid, id) => {
  await deleteDoc(doc(recordsCol(uid), id));
};

// Custom skills stored as a single document: { [category]: string[] }
export const getCustomSkills = async (uid) => {
  const snap = await getDoc(skillsDoc(uid));
  return snap.exists() ? snap.data() : {};
};

export const addCustomSkill = async (uid, category, skillName) => {
  const snap = await getDoc(skillsDoc(uid));
  const data = snap.exists() ? snap.data() : {};
  const list = data[category] ?? [];
  if (list.includes(skillName)) return;
  await setDoc(skillsDoc(uid), { ...data, [category]: [...list, skillName] });
};
