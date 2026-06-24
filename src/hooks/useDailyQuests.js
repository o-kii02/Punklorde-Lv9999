import { useState, useCallback, useEffect, useRef } from 'react';
import {
  DAILY_QUEST_POOL,
  DAILY_QUEST_COUNT,
  DIFFICULTY_EXP,
} from '../constants/questConfig';
import { useAuth } from '../context/AuthContext';
import { getDailyQuests, setDailyQuests } from '../lib/firestore';

const RANDOM_KEY = 'punk_daily_quests';
const CUSTOM_KEY = 'punk_custom_quests';

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

// localStorage fallback
function loadLocalRandom() {
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

function saveLocalRandom(quests) {
  localStorage.setItem(RANDOM_KEY, JSON.stringify({ date: resetDateStr(), quests }));
}

function loadLocalCustom() {
  try {
    const all = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? '[]');
    const now = Date.now();
    return all.filter((q) => q.expiresAt === null || q.expiresAt > now);
  } catch {
    return [];
  }
}

function saveLocalCustom(quests) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(quests));
}

export function useDailyQuests(addExp) {
  const { user } = useAuth();
  const [randomQuests, setRandomQuests] = useState([]);
  const [customQuests, setCustomQuests] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef(null);

  // 初回ロード
  useEffect(() => {
    if (!user) {
      setRandomQuests(loadLocalRandom());
      setCustomQuests(loadLocalCustom());
      setLoaded(true);
      return;
    }
    getDailyQuests(user.uid).then((data) => {
      const today = resetDateStr();
      if (!data || data.date !== today) {
        const quests = pickRandom(DAILY_QUEST_POOL, DAILY_QUEST_COUNT);
        const newData = { date: today, randomQuests: quests, customQuests: data?.customQuests ?? [] };
        setDailyQuests(user.uid, newData);
        setRandomQuests(quests);
        setCustomQuests(data?.customQuests ?? []);
      } else {
        setRandomQuests(data.randomQuests ?? []);
        setCustomQuests(data.customQuests ?? []);
      }
      setLoaded(true);
    });
  }, [user]);

  // Firestoreへの保存（debounce）
  const saveToFirestore = useCallback((nextRandom, nextCustom) => {
    if (!user) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setDailyQuests(user.uid, {
        date: resetDateStr(),
        randomQuests: nextRandom,
        customQuests: nextCustom,
      });
    }, 500);
  }, [user]);

  const toggleRandomQuest = useCallback((id) => {
    setRandomQuests((prev) => {
      const next = prev.map((q) => q.id === id ? { ...q, isCompleted: !q.isCompleted } : q);
      if (user) saveToFirestore(next, customQuests);
      else saveLocalRandom(next);
      return next;
    });
  }, [user, customQuests, saveToFirestore]);

  const clearDailyQuests = useCallback(() => {
    setRandomQuests((prev) => {
      prev.filter((q) => q.isCompleted).forEach((q) => {
        if (addExp) addExp(q.category, DIFFICULTY_EXP[q.difficulty] ?? 0);
      });
      const next = prev.map((q) => q.isCompleted ? { ...q, isCompleted: false, isCleared: true } : q);
      if (user) saveToFirestore(next, customQuests);
      else saveLocalRandom(next);
      return next;
    });
  }, [addExp, user, customQuests, saveToFirestore]);

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
      if (user) saveToFirestore(randomQuests, next);
      else saveLocalCustom(next);
      return next;
    });
  }, [user, randomQuests, saveToFirestore]);

  const toggleCustomQuest = useCallback((id) => {
    setCustomQuests((prev) => {
      const next = prev.map((q) => q.id === id ? { ...q, isCompleted: !q.isCompleted } : q);
      if (user) saveToFirestore(randomQuests, next);
      else saveLocalCustom(next);
      return next;
    });
  }, [user, randomQuests, saveToFirestore]);

  const clearCustomQuests = useCallback(() => {
    setCustomQuests((prev) => {
      prev.filter((q) => q.isCompleted).forEach((q) => {
        if (addExp) addExp(q.category, DIFFICULTY_EXP[q.difficulty] ?? 0);
      });
      const next = prev.filter((q) => !q.isCompleted);
      if (user) saveToFirestore(randomQuests, next);
      else saveLocalCustom(next);
      return next;
    });
  }, [addExp, user, randomQuests, saveToFirestore]);

  const deleteCustomQuest = useCallback((id) => {
    setCustomQuests((prev) => {
      const next = prev.filter((q) => q.id !== id);
      if (user) saveToFirestore(randomQuests, next);
      else saveLocalCustom(next);
      return next;
    });
  }, [user, randomQuests, saveToFirestore]);

  const now = Date.now();
  const activeCustom = customQuests.filter((q) => q.expiresAt === null || q.expiresAt > now);
  const visibleRandomQuests = randomQuests.filter((q) => !q.isCleared);
  const randomCompletedCount = visibleRandomQuests.filter((q) => q.isCompleted).length;
  const allRandomDone = visibleRandomQuests.length > 0 && randomCompletedCount === visibleRandomQuests.length;

  const quests = visibleRandomQuests.map((q) => ({ ...q, label: q.title, done: q.isCompleted }));
  const completedCount = randomCompletedCount;
  const total = visibleRandomQuests.length;

  return {
    loaded,
    randomQuests: visibleRandomQuests,
    customQuests: activeCustom,
    toggleRandomQuest,
    clearDailyQuests,
    toggleCustomQuest,
    clearCustomQuests,
    addCustomQuest,
    deleteCustomQuest,
    randomCompletedCount,
    allRandomDone,
    quests,
    toggle,
    completedCount,
    total,
  };
}
