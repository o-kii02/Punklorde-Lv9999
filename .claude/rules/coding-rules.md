# コーディングルール（常に守る）

## セキュリティ・データ保護

- Firestoreセキュリティルールは `request.auth.uid == userId` で自分のデータのみ読み書き可能にする
- `.env.local` の Firebase 設定は**絶対にGitにコミットしない**
- EXP付与は難易度（1〜5）のバリデーション必須。できればCloud Functions側で計算し不正防止

## 定数管理

- ゲームバランス用の数値は必ず `src/constants/` の定数ファイルに集約する
- ロジック（expCalc.js 等）にハードコードしない

## React パターン

| 機能 | 使う場面 |
|------|---------|
| `useState` | フォーム入力、UI切り替え |
| `useEffect` | Firestoreリアルタイム購読（将来）/ 初期化処理 |
| `useContext` | 認証状態、グローバルEXP/Lv（`useGame()`） |
| `useMemo` | statusExp・skillExp・チャート計算など派生state全般 |
| `useCallback` | クエスト操作など再生成コストを避けるhandler |
| `useRef` | file input など DOM 参照 |
| custom hooks | `useDailyQuests` |
| React Router | ページ遷移（`useNavigate`, `useLocation`） |

## データアクセス（現行: localStorage）

Phase 1 は Firebase 未接続。読み書きは `src/lib/mockStorage.js` に集約する。

```
src/lib/mockStorage.js  ← 全localStorage操作をここに集約
src/context/GameContext.jsx  ← アプリ全体のstate管理（records, totalExp, statusExp, skillExp）
```

将来 Firebase 移行時は mockStorage.js → firestore.js に置き換える。

## localStorage キー管理

キー名はすべて `mockStorage.js` または各hookの先頭に定数として定義する（JSX内ハードコード禁止）。

| キー | 型 | 用途 |
|------|-----|------|
| `punkroad_records` | `Record[]` | 記録データ |
| `punk_daily_quests` | `{date: string, quests: RandomQuest[]}` | 当日のデイリークエスト（翌日自動リセット） |
| `punk_custom_quests` | `CustomQuest[]` | マイクエスト |
| `punk_custom_skills` | `{[category: string]: string[]}` | カスタム技能 |
| `punk_char_image` | `string` (base64 DataURL) | キャラクター画像 |

## PC / SP レイアウト分岐パターン

同一ページファイルに SP / PC ブロックを共存させる。**stateとhandlerは共通**。

```jsx
<>
  {/* SP: lg未満のみ表示 */}
  <div className="lg:hidden ..."> ... </div>

  {/* PC: lg以上のみ表示 */}
  <div className="hidden lg:flex h-screen overflow-hidden" style={{ background: '#05080f' }}>
    <PcSidebar />
    <main className="flex-1 overflow-y-auto" style={{ borderRight: '1px solid rgba(0,212,255,0.1)' }}>
      {/* ページ固有フォーム（SPと同一の handleSubmit を共有） */}
    </main>
    <aside style={{ width: 260, /* ページにより260~300 */ ... }}>
      {/* 右パネル（表示専用・stateを参照するだけ） */}
    </aside>
  </div>
</>
```

- `BottomNav` は `lg:hidden` で PC 非表示
- `PcSidebar` は自己完結型（`useGame()`, `useLocation()`, `useNavigate()` を内部で使用）
- PC フォームも必ず `<form onSubmit={handleSubmit}>` で囲む

## 技能 EXP キー形式

`GameContext.skillExp` のキーは **`"CATEGORY::skillName"`** 形式。

```js
skillExp["STR::足トレ"]  // STRカテゴリの「足トレ」技能EXP
skillExp["INT::読書"]    // INTカテゴリの「読書」技能EXP
```

## Firestore アクセス（将来 Phase 2+）

- リアルタイム表示が必要な箇所は `onSnapshot` を使い、`useEffect` 内で購読・クリーンアップする
- 全読み書き関数は `src/lib/firestore.js` に集約する
