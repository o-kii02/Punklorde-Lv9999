const KEY = 'punkroad_records';
const SKILLS_KEY = 'punk_custom_skills';

export const getCustomSkills = () => {
  try {
    return JSON.parse(localStorage.getItem(SKILLS_KEY) ?? '{}');
  } catch {
    return {};
  }
};

export const addCustomSkill = (category, skillName) => {
  const all = getCustomSkills();
  const list = all[category] ?? [];
  if (list.includes(skillName)) return;
  all[category] = [...list, skillName];
  localStorage.setItem(SKILLS_KEY, JSON.stringify(all));
};

export const getRecords = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
};

export const saveRecord = (record) => {
  const records = getRecords();
  const newRecord = { ...record, id: crypto.randomUUID(), createdAt: Date.now() };
  records.push(newRecord);
  localStorage.setItem(KEY, JSON.stringify(records));
  return newRecord;
};

export const updateRecord = (id, data) => {
  const records = getRecords();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const updated = { ...records[idx], ...data };
  records[idx] = updated;
  localStorage.setItem(KEY, JSON.stringify(records));
  return updated;
};

export const deleteRecord = (id) => {
  const records = getRecords().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(records));
};

const FINANCE_KEY = 'punkroad_finance';

export const getFinanceRecords = () => {
  try {
    return JSON.parse(localStorage.getItem(FINANCE_KEY) ?? '[]');
  } catch {
    return [];
  }
};

export const saveFinanceRecord = (record) => {
  const records = getFinanceRecords();
  const newRecord = { ...record, id: crypto.randomUUID(), createdAt: Date.now() };
  records.push(newRecord);
  localStorage.setItem(FINANCE_KEY, JSON.stringify(records));
  return newRecord;
};

export const deleteFinanceRecord = (id) => {
  const records = getFinanceRecords().filter((r) => r.id !== id);
  localStorage.setItem(FINANCE_KEY, JSON.stringify(records));
};
