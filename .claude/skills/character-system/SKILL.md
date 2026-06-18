---
name: character-system
description: パンクロードLv999のキャラクター・ステータス・技能の定数を扱うときに参照する。全体Lvに応じたキャラクターステージ（characterStages.js）、7ステータスのLv別称号テーブルとSKILL_PRESETS（statusConfig.js）、HoloRingキャラ画像のホログラム演出仕様を含む。
---

# キャラクター・ステータス・技能システム

## 7 ステータス一覧（実装済み定数）
`src/constants/statusConfig.js`

| ID | 名称 | カラー | アイコン |
|----|------|--------|---------|
| STR | 体力 | `#ef4444` | 💪 |
| INT | 知力 | `#4fc3f7` | 📘 |
| CHA | 魅力 | `#ec4899` | ✨ |
| WEA | 財力 | `#f0c060` | 💰 |
| DEX | 器用さ | `#22c55e` | 🔧 |
| VIT | 生命力 | `#14b8a6` | ❤️ |
| MEN | 精神力 | `#a78bfa` | 🧠 |

> **注意**: 旧仕様の FUN（楽しさ）は MEN（精神力）に変更済み。コードでは `MEN` を使うこと。

`STATUS_ORDER = ['STR','INT','CHA','WEA','DEX','VIT','MEN']`

## 技能プリセット（SKILL_PRESETS）
`src/constants/statusConfig.js`

```js
STR: ['足トレ', '胸トレ', '腕トレ', '腹トレ', 'スポーツ']
INT: ['読書', '勉強', '資格学習', 'プログラミング']
CHA: ['ファッション', 'スキンケア', 'コミュニケーション']
WEA: ['節約', '副業', '投資', '家計管理']
DEX: ['料理', 'DIY', '楽器', 'ストレッチ']
VIT: ['睡眠管理', '食事管理', 'メンタルケア']
MEN: ['瞑想', '日記', '自己分析']
```

カスタム追加: `mockStorage.addCustomSkill(category, name)` → `punk_custom_skills` に保存。
RecordPage では `[...SKILL_PRESETS[cat], ...customSkills[cat]]` をマージして chip 表示。
技能 EXP のキー形式: `"CATEGORY::skillName"`（例: `"STR::足トレ"`）。

## キャラクターステージ
`src/constants/characterStages.js` — `getCharacterStage(totalLevel)`

| minTotalLv | stage | label |
|-----------|-------|-------|
| 0 | 1 | 見習い冒険者 |
| 50 | 2 | 一人前の冒険者 |
| 150 | 3 | 熟練者 |
| 300 | 4 | 英雄 |
| 999 | 5 | 伝説のパンクロード |

## ステータス称号テーブル
`src/constants/statusConfig.js` — `STATUS_TITLES[category]`

各ステータス Lv に応じて称号がアンロック。`getCurrentTitle(category, lv)` で取得。
（称号一覧は statusConfig.js の STATUS_TITLES を直接参照）

## キャラクター画像（HoloRing）

- **保存先**: `localStorage['punk_char_image']`（base64 DataURL）
- **透過 PNG 推奨**（背景除去済みのキャラ切り抜き）
- **表示**: `object-contain + object-top` で縦長（imgW=size×1.1、imgH=size×1.7）
- **発光**: `filter: drop-shadow()` がアルファチャンネルのシルエット形状に沿って発光
- **色収差**: `<img>` × 3 重ね（メイン / シアン左2px / ピンク右2px）、`mix-blend-mode: screen`
- **下部フェード**: 高さ32%をグラデーションで背景色へ溶かしてホログラム投影感
- **差し替え**: 画像タップ → `<input type="file" accept="image/*">` を起動

# キャラクター & 称号システム

ゲーム的な「成長の見える化」を担う定数群。すべて `src/constants/` に集約する。
数値・称号名は調整前提のサンプル。好みに合わせて自由に変更してよい。

## キャラクター変化ステージ

全体Lvが一定値に達するとキャラの見た目が変化する。

```js
// src/constants/characterStages.js
export const CHARACTER_STAGES = [
  { minTotalLv: 0,   stage: 1, label: "見習い冒険者",       image: "char_stage1.png" },
  { minTotalLv: 50,  stage: 2, label: "一人前の冒険者",     image: "char_stage2.png" },
  { minTotalLv: 150, stage: 3, label: "熟練者",             image: "char_stage3.png" },
  { minTotalLv: 300, stage: 4, label: "英雄",               image: "char_stage4.png" },
  { minTotalLv: 999, stage: 5, label: "伝説のパンクロード", image: "char_stage5.png" },
];

// 全体Lvから現在のステージを返す
export const getCharacterStage = (totalLevel) => {
  return [...CHARACTER_STAGES]
    .reverse()
    .find((s) => totalLevel >= s.minTotalLv) ?? CHARACTER_STAGES[0];
};
```

> 画像は `src/assets/` に配置。最初はプレースホルダー画像でも可。
> ステージ到達時は祝福演出を出すと達成感が高まる。

## ステータス称号テーブル

各ステータスのLvに応じて称号をアンロック。`exp-system` スキルの
`getCurrentTitle` で現在称号を判定する。

```js
// src/constants/statusConfig.js
export const STATUS_TITLES = {
  STR: [ // 体力
    { minLv: 1,   title: "軟弱者" },
    { minLv: 10,  title: "運動を始めた者" },
    { minLv: 30,  title: "鍛錬者" },
    { minLv: 50,  title: "鋼の肉体" },
    { minLv: 100, title: "超人" },
  ],
  INT: [ // 知力
    { minLv: 1,   title: "無知なる者" },
    { minLv: 10,  title: "学び始めた者" },
    { minLv: 30,  title: "知恵者" },
    { minLv: 50,  title: "賢者" },
    { minLv: 100, title: "大賢者" },
  ],
  CHA: [ // 魅力
    { minLv: 1,   title: "素朴な者" },
    { minLv: 10,  title: "身だしなみを整えた者" },
    { minLv: 30,  title: "人気者" },
    { minLv: 50,  title: "カリスマ" },
    { minLv: 100, title: "万人を魅了する者" },
  ],
  WEA: [ // 財力
    { minLv: 1,   title: "無一文" },
    { minLv: 10,  title: "節約家" },
    { minLv: 30,  title: "資産形成者" },
    { minLv: 50,  title: "富豪" },
    { minLv: 100, title: "大富豪" },
  ],
  DEX: [ // 器用さ
    { minLv: 1,   title: "不器用" },
    { minLv: 10,  title: "手先を動かす者" },
    { minLv: 30,  title: "職人見習い" },
    { minLv: 50,  title: "熟練職人" },
    { minLv: 100, title: "匠" },
  ],
  VIT: [ // 生命力
    { minLv: 1,   title: "病弱" },
    { minLv: 10,  title: "健康を意識する者" },
    { minLv: 30,  title: "壮健" },
    { minLv: 50,  title: "生命力に満ちた者" },
    { minLv: 100, title: "不屈の者" },
  ],
  FUN: [ // 楽しさ
    { minLv: 1,   title: "退屈な日々" },
    { minLv: 10,  title: "趣味を見つけた者" },
    { minLv: 30,  title: "人生を楽しむ者" },
    { minLv: 50,  title: "遊びの達人" },
    { minLv: 100, title: "人生の達人" },
  ],
};
```

## ステータスのメタ情報

アイコンや色など、UI表示に使う定義もここにまとめると便利。

```js
// src/constants/statusConfig.js
export const STATUS_META = {
  STR: { name: "体力",   color: "#ef4444", icon: "💪" },
  INT: { name: "知力",   color: "#3b82f6", icon: "📘" },
  CHA: { name: "魅力",   color: "#ec4899", icon: "✨" },
  WEA: { name: "財力",   color: "#f5a623", icon: "💰" },
  DEX: { name: "器用さ", color: "#22c55e", icon: "🔧" },
  VIT: { name: "生命力", color: "#14b8a6", icon: "❤️" },
  FUN: { name: "楽しさ", color: "#8b5cf6", icon: "🎮" },
};

export const STATUS_ORDER = ["STR", "INT", "CHA", "WEA", "DEX", "VIT", "FUN"];
```

> 六角形チャートは本来6軸だが、本アプリは7ステータス。
> 七角形（ヘプタゴン）で描画するか、用途で6軸に絞るかは設計時に決める。
> （CLAUDE.md・screen-specs では便宜上「六角形」と呼んでいるが実態は7軸）
