import { useState, useCallback } from 'react';
import {
  DAILY_QUEST_POOL,
  DAILY_QUEST_COUNT,
  DIFFICULTY_EXP,
} from '../constants/questConfig';

const RANDOM_KEY = 'punk_daily_quests';
const CUSTOM_KEY = 'punk_custom_quests';

// 朝5時を境にリセット日付を算出
function resetDateStr() {
  const now = new Date();
  const base = new Date(now);
  if (now.getHours() < 5) base.setDate(base.getDate() - 1);
  return base.toDateString();
}

function pickRandom(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((q) => ({ ...q, isCompleted: false }));
}

function loadRandomQuests() {
  try {
    const raw = JSON.parse(localStorage.getItem(RANDOM_KEY) ?? 'null');
    if (!raw || raw.date !== resetDateStr()) {
      const quests = pickRandom(DAILY_QUEST_POOL, DAILY_QUEST_COUNT);
      const data = { date: resetDateStr(), quests };
      localStorage.setItem(RANDOM_KEY, JSON.stringify(data));
      return quests;
    }
    return raw.quests;
  } catch {
    return pickRandom(DAILY_QUEST_POOL, DAILY_QUEST_COUNT);
  }
}

function saveRandomQuests(quests) {
  localStorage.setItem(RANDOM_KEY, JSON.stringify({ date: resetDateStr(), quests }));
}

function loadCustomQuests() {
  try {
    const all = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? '[]');
    const now = Date.now();
    return all.filter((q) => q.expiresAt === null || q.expiresAt > now);
  } catch {
    return [];
  }
}

function saveCustomQuests(quests) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(quests));
}

export function useDailyQuests(addExp) {
  const [randomQuests, setRandomQuests] = useState(() => loadRandomQuests());
  const [customQuests, setCustomQuests] = useState(() => loadCustomQuests());

  // チェックのみ（EXPなし）
  const toggleRandomQuest = useCallback((id) => {
    setRandomQuests((prev) => {
      const next = prev.map((q) => q.id === id ? { ...q, isCompleted: !q.isCompleted } : q);
      saveRandomQuests(next);
      return next;
    });
  }, []);

  // チェック済みクエストをEXP付与して非表示化
  const clearDailyQuests = useCallback(() => {
    setRandomQuests((prev) => {
      prev.filter((q) => q.isCompleted).forEach((q) => {
        if (addExp) addExp(q.category, DIFFICULTY_EXP[q.difficulty] ?? 0);
      });
      const next = prev.map((q) => q.isCompleted ? { ...q, isCompleted: false, isCleared: true } : q);
      saveRandomQuests(next);
      return next;
    });
  }, [addExp]);

  // Dashboard互換
  const toggle = useCallback((id) => toggleRandomQuest(id), [toggleRandomQuest]);

  const addCustomQuest = useCallback(({ title, category, difficulty, expiryDays }) => {
    const expiresAt = expiryDays !== null
      ? Date.now() + expiryDays * 24 * 60 * 60 * 1000
      : null;
    const quest = {
      id: crypto.randomUUID(),
      title,
      category,
      difficulty,
      expiresAt,
      isCompleted: false,
      createdAt: Date.now(),
    };
    setCustomQuests((prev) => {
      const next = [...prev, quest];
      saveCustomQuests(next);
      return next;
    });
  }, []);

  // カスタムクエストのチェックのみ（EXPなし）
  const toggleCustomQuest = useCallback((id) => {
    setCustomQuests((prev) => {
      const next = prev.map((q) => q.id === id ? { ...q, isCompleted: !q.isCompleted } : q);
      saveCustomQuests(next);
      return next;
    });
  }, []);

  // チェック済みカスタムクエストをEXP付与して削除
  const clearCustomQuests = useCallback(() => {
    setCustomQuests((prev) => {
      prev.filter((q) => q.isCompleted).forEach((q) => {
        if (addExp) addExp(q.category, DIFFICULTY_EXP[q.difficulty] ?? 0);
      });
      const next = prev.filter((q) => !q.isCompleted);
      saveCustomQuests(next);
      return next;
    });
  }, [addExp]);

  const deleteCustomQuest = useCallback((id) => {
    setCustomQuests((prev) => {
      const next = prev.filter((q) => q.id !== id);
      saveCustomQuests(next);
      return next;
    });
  }, []);

  const visibleRandomQuests = randomQuests.filter((q) => !q.isCleared);
  const randomCompletedCount = visibleRandomQuests.filter((q) => q.isCompleted).length;
  const allRandomDone = visibleRandomQuests.length > 0 && randomCompletedCount === visibleRandomQuests.length;

  // Dashboard互換フィールド
  const quests = visibleRandomQuests.map((q) => ({ ...q, label: q.title, done: q.isCompleted }));
  const completedCount = randomCompletedCount;
  const total = visibleRandomQuests.length;

  return {
    // QuestPage用
    randomQuests: visibleRandomQuests,
    customQuests,
    toggleRandomQuest,
    clearDailyQuests,
    toggleCustomQuest,
    clearCustomQuests,
    addCustomQuest,
    deleteCustomQuest,
    randomCompletedCount,
    allRandomDone,
    // Dashboard互換
    quests,
    toggle,
    completedCount,
    total,
  };
}
