import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getRecords, saveRecord, updateRecord as storageUpdate, deleteRecord as storageDelete, getFinanceRecords, saveFinanceRecord, deleteFinanceRecord as storageDeleteFinance } from '../lib/mockStorage';
import { calcRecordExp, expToLevel, expProgress } from '../lib/expCalc';
import { STATUS_ORDER } from '../constants/statusConfig';
import { WEA_EXP_PER_1000YEN } from '../constants/financeConfig';

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  const [records, setRecords] = useState(() => getRecords());
  const [financeRecords, setFinanceRecords] = useState(() => getFinanceRecords());

  useEffect(() => {
    setRecords(getRecords());
  }, []);

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

  const addRecord = (formData) => {
    const expGained = calcRecordExp(formData);
    const record = saveRecord({ ...formData, expGained });
    setRecords((prev) => [...prev, record]);
    return expGained;
  };

  const editRecord = (id, formData) => {
    const expGained = calcRecordExp(formData);
    const updated = storageUpdate(id, { ...formData, expGained });
    if (!updated) return 0;
    setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return expGained;
  };

  const removeRecord = (id) => {
    storageDelete(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const addExp = (category, amount) => {
    const record = saveRecord({ category, difficulty: 0, expGained: amount, note: 'クエスト達成', type: 'quest' });
    setRecords((prev) => [...prev, record]);
    return record;
  };

  const addFinanceRecord = (data) => {
    const record = saveFinanceRecord(data);
    setFinanceRecords((prev) => [...prev, record]);
    return record;
  };

  const removeFinanceRecord = (id) => {
    storageDeleteFinance(id);
    setFinanceRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <GameContext.Provider value={{ records, totalExp, totalLevel, totalProgress, statusExp, skillExp, addRecord, editRecord, removeRecord, addExp, financeRecords, addFinanceRecord, removeFinanceRecord, weaFinanceExp }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
};
