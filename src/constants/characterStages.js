export const CHARACTER_STAGES = [
  { minTotalLv: 0, stage: 1, label: 'パンクロード', emoji: '🧑' },
  { minTotalLv: 50, stage: 2, label: 'パンクロードの覇者', emoji: '⚔️' },
  { minTotalLv: 150, stage: 3, label: '星核ハンター', emoji: '🛡️' },
  { minTotalLv: 300, stage: 4, label: '愉悦の使令', emoji: '👑' },
  { minTotalLv: 999, stage: 5, label: 'ポルカカカム', emoji: '🌟' },
];

export const getCharacterStage = (totalLevel) =>
  [...CHARACTER_STAGES].reverse().find((s) => totalLevel >= s.minTotalLv) ?? CHARACTER_STAGES[0];
