export const STATUS_ORDER = ['STR', 'INT', 'CHA', 'WEA', 'DEX', 'MEN'];

export const STATUS_META = {
  STR: { name: '体力',   color: '#ef4444', icon: '💪', tailwind: 'text-red-400',   bg: 'bg-red-900/30',   border: 'border-red-500/40' },
  INT: { name: '知力',   color: '#4fc3f7', icon: '📘', tailwind: 'text-blue-400',  bg: 'bg-blue-900/30',  border: 'border-blue-500/40' },
  CHA: { name: '魅力',   color: '#ec4899', icon: '✨', tailwind: 'text-pink-400',  bg: 'bg-pink-900/30',  border: 'border-pink-500/40' },
  WEA: { name: '財力',   color: '#f0c060', icon: '💰', tailwind: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-500/40' },
  DEX: { name: '器用さ', color: '#22c55e', icon: '🔧', tailwind: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-500/40' },
  MEN: { name: '精神力', color: '#a78bfa', icon: '🧠', tailwind: 'text-purple-400',bg: 'bg-purple-900/30',border: 'border-purple-500/40' },
};

export const STATUS_TITLES = {
  STR: [
    { minLv: 1,   title: '軟弱者' },
    { minLv: 10,  title: '運動を始めた者' },
    { minLv: 30,  title: '鍛錬者' },
    { minLv: 50,  title: '鋼の肉体' },
    { minLv: 100, title: '超人' },
  ],
  INT: [
    { minLv: 1,   title: '無知なる者' },
    { minLv: 10,  title: '学び始めた者' },
    { minLv: 30,  title: '知恵者' },
    { minLv: 50,  title: '賢者' },
    { minLv: 100, title: '大賢者' },
  ],
  CHA: [
    { minLv: 1,   title: '素朴な者' },
    { minLv: 10,  title: '身だしなみを整えた者' },
    { minLv: 30,  title: '人気者' },
    { minLv: 50,  title: 'カリスマ' },
    { minLv: 100, title: '万人を魅了する者' },
  ],
  WEA: [
    { minLv: 1,   title: '無一文' },
    { minLv: 10,  title: '節約家' },
    { minLv: 30,  title: '資産形成者' },
    { minLv: 50,  title: '富豪' },
    { minLv: 100, title: '大富豪' },
  ],
  DEX: [
    { minLv: 1,   title: '不器用' },
    { minLv: 10,  title: '手先を動かす者' },
    { minLv: 30,  title: '職人見習い' },
    { minLv: 50,  title: '熟練職人' },
    { minLv: 100, title: '匠' },
  ],
  MEN: [
    { minLv: 1,   title: '心が弱い者' },
    { minLv: 10,  title: '自分と向き合う者' },
    { minLv: 30,  title: '精神修行者' },
    { minLv: 50,  title: '鋼の精神' },
    { minLv: 100, title: '無敵の精神力' },
  ],
};

export const SKILL_PRESETS = {
  STR: ['足トレ', '胸トレ', '腕トレ', '腹トレ', 'スポーツ'],
  INT: ['読書', '勉強', '資格学習', 'プログラミング'],
  CHA: ['ファッション', 'スキンケア', 'コミュニケーション'],
  WEA: ['節約', '副業', '投資', '家計管理'],
  DEX: ['料理', 'DIY', '楽器', 'ストレッチ'],
  MEN: ['瞑想', '日記', '自己分析'],
};
