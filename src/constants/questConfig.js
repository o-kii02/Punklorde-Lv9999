export const DAILY_QUEST_POOL = [
  { id: 'dq_str_1', title: '筋トレを行う', category: 'STR', difficulty: 3 },
  { id: 'dq_str_2', title: 'スクワッド 50回', category: 'STR', difficulty: 2 },
  { id: 'dq_str_3', title: 'インナーマッスル 3セット', category: 'STR', difficulty: 2 },
  { id: 'dq_int_1', title: '読書 1時間', category: 'INT', difficulty: 2 },
  { id: 'dq_int_2', title: '勉強 1時間', category: 'INT', difficulty: 4 },
  { id: 'dq_wea_1', title: '支出を確認する', category: 'WEA', difficulty: 1 },
  { id: 'dq_dex_1', title: '部屋の片づけをする', category: 'DEX', difficulty: 3 },
  { id: 'dq_dex_2', title: '料理をする', category: 'DEX', difficulty: 4 },
  { id: 'dq_cha_1', title: 'スキンケアに気を配る', category: 'CHA', difficulty: 1 },
  { id: 'dq_cha_2', title: '人と円滑にコミュニケーションを取る', category: 'CHA', difficulty: 2 },
  { id: 'dq_men_1', title: 'リラックスする時間を確保する', category: 'MEN', difficulty: 2 },
  { id: 'dq_men_2', title: '満足できる睡眠時間を確保する', category: 'MEN', difficulty: 2 },
];

export const DAILY_QUEST_COUNT = 3;

export const DAILY_QUEST_BONUS_EXP = 50;

export const QUEST_EXPIRY_OPTIONS = [
  { label: '1日', days: 1 },
  { label: '3日', days: 3 },
  { label: '1週間', days: 7 },
  { label: '期限なし', days: null },
];

export const DIFFICULTY_EXP = [0, 10, 25, 50, 100, 200];
