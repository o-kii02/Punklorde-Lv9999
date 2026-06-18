---
name: exp-system
description: パンクロードLv999のEXP計算・Lv変換・称号システムを実装または調整するときに参照する。記録登録時のEXP付与ロジック、経験値からレベルへの変換、クエスト報酬計算、GameContextのstate構造を含む。expCalc.js・questConfig.js・GameContext.jsx を扱う際に使用する。
---

# EXP・レベル計算システム

## EXP 計算式（記録登録用）
`src/lib/expCalc.js` — `calcRecordExp({ difficulty, count, isFirstTime })`

```js
exp = difficulty * 10
    + (count ? Math.min(count, 100) : 0)  // カウントがある場合のみ加算
    + (isFirstTime ? 50 : 0)              // 初挑戦ボーナス
```

例: difficulty=3, count=30, isFirstTime=false → 30 + 30 = 60 EXP

> ※ DIFFICULTY_EXP（下記）はクエスト専用。RECORD登録とは別ロジック。

## DIFFICULTY_EXP（クエスト用）
`src/constants/questConfig.js`

```js
export const DIFFICULTY_EXP = [0, 10, 25, 50, 100, 200]; // index = difficulty (1~5)
```

クエスト完了時は `DIFFICULTY_EXP[quest.difficulty]` で EXP を決定する。

## ボーナス一覧

| ボーナス | 値 | 条件 |
|---|---|---|
| 初挑戦ボーナス | +50 EXP | `isFirstTime === true` |
| デイリー全完了ボーナス | +50 EXP (`DAILY_QUEST_BONUS_EXP`) | 3クエスト全て完了時 |

## レベル変換式
`src/lib/expCalc.js`

```js
// 累積EXP → Lv（平方根ベース、Lv1スタート）
expToLevel(exp) = Math.floor(Math.sqrt(Math.max(0, exp) / 50)) + 1

// Lv到達に必要な累積EXP
levelToRequiredExp(lv) = (lv - 1)² × 50

// 次Lvまでの進捗（0.0〜1.0）— EXPバー描画用
expProgress(exp) = (exp - required[lv]) / (required[lv+1] - required[lv])
```

目安:
| Lv | 必要累積EXP |
|----|------------|
| 10 | 4,050 |
| 30 | 43,250 |
| 50 | 122,050 |
| 100 | 490,050 |

## Lv 種別

| 種別 | 算出元 | 取得元 |
|---|---|---|
| 全体 Lv | 全 record.expGained 合計 | `GameContext.totalLevel` |
| ステータス Lv | category ごとの expGained 合計 | `expToLevel(statusExp[cat])` |
| 技能 Lv | "CATEGORY::skillName" ごとの合計 | `expToLevel(skillExp["STR::足トレ"])` |

## EXP 付与フロー（現行 localStorage 実装）

```
1. RECORD 登録
   RecordPage.handleSubmit()
     → calcRecordExp(formData)
     → GameContext.addRecord(formData)
       → saveRecord() [mockStorage.js] → localStorage['punkroad_records']
       → setRecords(prev => [...prev, record])

2. クエスト完了
   useDailyQuests.completeRandomQuest(id) / completeCustomQuest(id)
     → GameContext.addExp(category, DIFFICULTY_EXP[difficulty])
       → saveRecord({type:'quest', ...}) → localStorage
       → setRecords(prev => [...prev, record])
```

## GameContext が提供する派生 state

すべて `useMemo` でキャッシュ。records が変わるたびに自動再計算。

```js
totalExp      // 全 record.expGained の合計
totalLevel    // expToLevel(totalExp)
totalProgress // expProgress(totalExp)  0.0~1.0
statusExp     // { STR: 0, INT: 0, CHA: 0, WEA: 0, DEX: 0, VIT: 0, MEN: 0 }
skillExp      // { "STR::足トレ": 120, "INT::読書": 80, ... }
```

## 称号の取得

```js
// src/lib/expCalc.js
getCurrentTitle(category, lv)
// STATUS_TITLES[category] を逆引きして lv >= minLv の最大称号を返す
```

称号テーブルの定義は `character-system` スキル参照。
