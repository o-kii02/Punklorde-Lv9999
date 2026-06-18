import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import * as mock from '../lib/mockStorage';
import * as fs from '../lib/firestore';
import { calcRecordExp, expToLevel, expProgress } from '../lib/expCalc';
import { STATUS_ORDER } from '../constants/statusConfig';
import { WEA_EXP_PER_1000YEN } from '../constants/financeConfig';

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [financeRecords, setFinanceRecords] = useState(() => mock.getFinanceRecords());
  const [customSkills, setCustomSkills] = useState({});

  useEffect(() => {
    if (!user) {
      setRecords(mock.getRecords());
      setCustomSkills(mock.getCustomSkills());
      return;
    }
    // ログイン時: Firestoreをリアルタイム購読
    const unsub = fs.subscribeRecords(user.uid, setRecords);
    fs.getCustomSkills(user.uid).then(setCustomSkills);
    return unsub;
  }, [user]);

  const totalExp = useMemo(
    () => records.reduce((sum, r) => sum + (r.expGained ?? 0), 0),
    [records]
  );

  const weaFinanceExp = useMemo(() => {
    const monthMap = {};
    for (const r of financeRecords) {
      const month = r.date?.slice(0, 7);
      if (!month) continue;
      if (!monthMap[month]) monthMap[month] = { income: 0, expense: 0 };
      if (r.type === 'income') monthMap[month].income += r.amount ?? 0;
      else monthMap[month].expense += r.amount ?? 0;
    }
    let exp = 0;
    for (const { income, expense } of Object.values(monthMap)) {
      const surplus = income - expense;
      if (surplus > 0) exp += Math.floor(surplus / 1000) * WEA_EXP_PER_1000YEN;
    }
    return exp;
  }, [financeRecords]);

  const statusExp = useMemo(() => {
    const map = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
    for (const r of records) {
      if (map[r.category] !== undefined) map[r.category] += r.expGained ?? 0;
    }
    map.WEA += weaFinanceExp;
    return map;
  }, [records, weaFinanceExp]);

  const skillExp = useMemo(() => {
    const map = {};
    for (const r of records) {
      if (!r.skillName) continue;
      const key = `${r.category}::${r.skillName}`;
      map[key] = (map[key] ?? 0) + (r.expGained ?? 0);
    }
    return map;
  }, [records]);

  const totalLevel = useMemo(() => expToLevel(totalExp), [totalExp]);
  const totalProgress = useMemo(() => expProgress(totalExp), [totalExp]);

  const addRecord = async (formData) => {
    const expGained = calcRecordExp(formData);
    const data = { ...formData, expGained };
    if (user) {
      await fs.addRecord(user.uid, data);
      // subscribeRecords が自動で setRecords を更新するため手動更新不要
    } else {
      const record = mock.saveRecord(data);
      setRecords((prev) => [...prev, record]);
    }
    return expGained;
  };

  const editRecord = async (id, formData) => {
    const expGained = calcRecordExp(formData);
    const data = { ...formData, expGained };
    if (user) {
      await fs.updateRecord(user.uid, id, data);
    } else {
      const updated = mock.updateRecord(id, data);
      if (!updated) return 0;
      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
    return expGained;
  };

  const removeRecord = async (id) => {
    if (user) {
      await fs.deleteRecord(user.uid, id);
    } else {
      mock.deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const addExp = async (category, amount) => {
    const data = { category, difficulty: 0, expGained: amount, note: 'クエスト達成', type: 'quest' };
    if (user) {
      const recordId = await fs.addRecord(user.uid, data);
      return { ...data, id: recordId };
    } else {
      const record = mock.saveRecord(data);
      setRecords((prev) => [...prev, record]);
      return record;
    }
  };

  const addFinanceRecord = (data) => {
    const record = mock.saveFinanceRecord(data);
    setFinanceRecords((prev) => [...prev, record]);
    return record;
  };

  const removeFinanceRecord = (id) => {
    mock.deleteFinanceRecord(id);
    setFinanceRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const addCustomSkillEntry = async (category, skillName) => {
    if (user) {
      await fs.addCustomSkill(user.uid, category, skillName);
      const updated = await fs.getCustomSkills(user.uid);
      setCustomSkills(updated);
    } else {
      mock.addCustomSkill(category, skillName);
      setCustomSkills(mock.getCustomSkills());
    }
  };

  return (
    <GameContext.Provider value={{
      records, totalExp, totalLevel, totalProgress, statusExp, skillExp,
      addRecord, editRecord, removeRecord, addExp,
      financeRecords, addFinanceRecord, removeFinanceRecord, weaFinanceExp,
      customSkills, addCustomSkillEntry,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
};
