export const CHARACTER_STAGES = [
  { minTotalLv: 0,   stage: 1, label: '見習い冒険者',       emoji: '🧑' },
  { minTotalLv: 50,  stage: 2, label: '一人前の冒険者',     emoji: '⚔️' },
  { minTotalLv: 150, stage: 3, label: '熟練者',             emoji: '🛡️' },
  { minTotalLv: 300, stage: 4, label: '英雄',               emoji: '👑' },
  { minTotalLv: 999, stage: 5, label: '伝説のパンクロード', emoji: '🌟' },
];

export const getCharacterStage = (totalLevel) =>
  [...CHARACTER_STAGES].reverse().find((s) => totalLevel >= s.minTotalLv) ?? CHARACTER_STAGES[0];
