---
name: data-model
description: パンクロードLv999のデータ構造を扱うときに参照する。現行のlocalStorageスキーマ（Phase 1）と将来のFirestoreコレクション設計（Phase 2+）を含む。記録・クエスト・技能・キャラ画像の各フィールド定義、読み書き関数（mockStorage.js）の実装時に使用する。
---

# データモデル

## Phase 1（現行）: localStorage スキーマ

読み書きは `src/lib/mockStorage.js` に集約。キー名はファイル先頭の定数で管理。

### キー一覧

| キー | 型 | 管理ファイル |
|------|-----|------------|
| `punkroad_records` | `Record[]` | `mockStorage.js` |
| `punk_daily_quests` | `{date: string, quests: RandomQuest[]}` | `useDailyQuests.js` |
| `punk_custom_quests` | `CustomQuest[]` | `useDailyQuests.js` |
| `punk_custom_skills` | `{[category: string]: string[]}` | `mockStorage.js` |
| `punk_char_image` | `string` (base64 DataURL) | `Dashboard.jsx` useState 初期値 |

### Record フィールド

```ts
{
  id: string           // crypto.randomUUID()
  createdAt: number    // Date.now()
  category: string     // STATUS_ORDER のいずれか（STR/INT/CHA/WEA/DEX/VIT/MEN）
  skillName: string    // 技能名（例: "足トレ"）
  action: string       // 何をしたか（自由記述）
  difficulty: number   // 0〜5（0 はクエスト由来）
  count: number|null   // カウント入力値
  countUnit: string    // 単位（例: "回", "分", "円"）
  isFirstTime: boolean // 初挑戦ボーナス対象か
  expGained: number    // 付与 EXP（calcRecordExp の結果）
  type?: 'quest'       // クエスト由来の場合のみ付与
}
```

### RandomQuest フィールド（当日分 / punk_daily_quests.quests）

```ts
{
  id: string          // questConfig.DAILY_QUEST_POOL の id
  title: string
  category: string
  difficulty: number  // 1〜5
  isCompleted: boolean
}
```

翌日 0 時（`todayStr()` が変わった時点）に自動リセット・再抽選される。

### CustomQuest フィールド（punk_custom_quests）

```ts
{
  id: string
  title: string
  category: string
  difficulty: number
  expiresAt: number|null  // null = 期限なし。Date.now() + days*86400000
  isCompleted: boolean
  createdAt: number
}
```

完了時・期限切れ時はリストから除去される。

### CustomSkills フィールド（punk_custom_skills）

```ts
{
  [category: string]: string[]  // 例: { "STR": ["ヨガ", "水泳"] }
}
```

RECORD 登録時に `SKILL_PRESETS[category]` とマージして表示。

# Firestore データモデル

全データは `users/{userId}/` 配下に格納し、ユーザー自身のみアクセス可能にする。
読み書き関数は `src/lib/firestore.js` に集約する。

## コレクション構成

```
users/{userId}/
├── profile（ドキュメント）
├── records/{recordId}
├── quests/{questId}
├── missions/{missionId}
├── snapshots/{snapshotId}
├── household/{entryId}      # 財力スキル：家計簿
├── bodyWeight/{entryId}     # 魅力スキル：体重管理
└── workoutSchedule/{entryId} # 体力スキル：筋トレ
```

## 各ドキュメント定義

### profile（ユーザー情報）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| displayName | string | 表示名 |
| createdAt | timestamp | 開始日（過去比較の「始めた時」の基準）|
| totalExp | number | 全体EXP合計（キャッシュ用）|
| characterStage | number | 現在のキャラ段階（1〜5）|

### records（活動記録）— アプリの中心データ

| フィールド | 型 | 説明 |
|-----------|-----|------|
| category | string | "STR" \| "INT" \| "CHA" \| "WEA" \| "DEX" \| "VIT" \| "FUN" |
| skillName | string | 技能名（例："筋トレ"、"読書"）|
| action | string | 何をしたか（自由記述）|
| difficulty | number | 挑戦ハードル自己評価（1〜5）|
| count | number \| null | 回数（任意）|
| isFirstTime | boolean | 初挑戦かどうか |
| expGained | number | 付与されたEXP（expCalcの結果を保存）|
| source | string | "manual" \| "quest" \| "mission" |
| createdAt | timestamp | 記録日時 |

> ステータスLv・技能Lvは records を集計して算出する。
> パフォーマンスのため profile.totalExp にも合計をキャッシュする。

### quests（クエスト）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| type | string | "daily" \| "weekly" |
| title | string | クエスト名 |
| description | string | 内容 |
| targetCategory | string | 対象ステータス（任意）|
| expReward | number | 達成報酬EXP |
| isCompleted | boolean | 達成済みか |
| completedAt | timestamp \| null | 達成日時 |
| periodStart | timestamp | 有効期間開始 |
| periodEnd | timestamp | 有効期間終了 |

### missions（ハードミッション）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| title | string | ミッション名 |
| description | string | 内容 |
| expReward | number | 特大EXP（デフォルト5000）|
| targetCategory | string | 対象ステータス |
| deadline | timestamp | 期限（通常1年後）|
| isCompleted | boolean | 達成済みか |
| createdAt | timestamp | 設定日 |

### snapshots（過去比較用）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| takenAt | timestamp | 取得日時 |
| totalExp | number | その時点の全体EXP |
| statusExp | map | { STR, INT, CHA, WEA, DEX, VIT, FUN } 各EXP |

> 月次（毎月1日）取得を基本とし、手動取得も可能にする。
> 比較は「1ヶ月前/3ヶ月前/半年前/1年前/始めた時」の最も近いスナップショットを使う。

### household（家計簿・財力スキル）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| type | string | "income" \| "expense" |
| amount | number | 金額 |
| category | string | 費目（食費、交通費等）|
| memo | string | メモ |
| date | timestamp | 日付 |

### bodyWeight（体重管理・魅力スキル）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| weight | number | 体重（kg）|
| recordedAt | timestamp | 記録日 |

### workoutSchedule（筋トレ・体力スキル）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| date | timestamp | 予定日 |
| menuItems | string[] | メニュー（例：["ベンチプレス", "スクワット"]）|
| isDone | boolean | 完了したか |
| memo | string | メモ |

## 読み書き関数の方針（firestore.js）

```js
// src/lib/firestore.js
import { db } from "./firebase";
import {
  collection, addDoc, getDocs, query, where, orderBy, serverTimestamp
} from "firebase/firestore";

// 記録を追加
export const addRecord = async (uid, record) => {
  return addDoc(collection(db, "users", uid, "records"), {
    ...record,
    createdAt: serverTimestamp(),
  });
};

// カテゴリー別の記録を取得
export const getRecordsByCategory = async (uid, category) => {
  const q = query(
    collection(db, "users", uid, "records"),
    where("category", "==", category),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
```

> リアルタイム表示が必要な箇所（Dashboard等）は `onSnapshot` を使い、
> `useEffect` 内で購読・クリーンアップする。

## セキュリティルール（必須）

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

自分のデータ以外には一切アクセスできないようにすること。
