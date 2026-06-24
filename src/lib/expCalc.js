import { STATUS_TITLES } from '../constants/statusConfig';

export const calcRecordExp = ({ difficulty, count, isFirstTime }) => {
  let exp = difficulty * 10;
  if (count) exp += Math.min(count, 100);
  if (isFirstTime) exp += 50;
  return exp;
};

// Lv = floor(sqrt(totalExp / 1.5)) + 1  (係数1.5: 500EXP/日で約8.2年でLv999)
export const expToLevel = (exp) => Math.floor(Math.sqrt(Math.max(0, exp) / 1.5)) + 1;

export const levelToRequiredExp = (lv) => (lv - 1) ** 2 * 1.5;

export const expProgress = (exp) => {
  const lv = expToLevel(exp);
  const current = exp - levelToRequiredExp(lv);
  const needed = levelToRequiredExp(lv + 1) - levelToRequiredExp(lv);
  return needed === 0 ? 1 : current / needed;
};

export const getCurrentTitle = (category, lv) => {
  const titles = STATUS_TITLES[category] ?? [];
  return [...titles].reverse().find((t) => lv >= t.minLv)?.title ?? titles[0]?.title ?? '';
};
