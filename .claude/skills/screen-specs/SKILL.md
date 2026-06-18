---
name: screen-specs
description: パンクロードLv999の各画面を実装するときに参照する。実装済みページ（Dashboard・RecordPage・QuestPage・RecordsPage）のSP/PCレイアウト構成、右パネル仕様、ナビゲーション項目を含む。将来実装予定ページ（MissionPage・ChartPage・技能別ページ）の仕様も記載。
---

# 画面仕様

## レイアウト方針

- **SP（< 1024px）**: 縦スクロール + BottomNav（`lg:hidden` 固定下部）
- **PC（≥ 1024px）**: `hidden lg:flex h-screen overflow-hidden` の3カラム固定
  - 左: `PcSidebar`（220px）
  - 中央: `flex-1 overflow-y-auto`
  - 右: 各ページ固有パネル

同一ページファイルに SP / PC ブロックを共存させる。state・handler は共通。

## ナビゲーション項目（全画面共通）

| ラベル | アイコン | パス |
|---|---|---|
| STATUS | ◈ | `/` |
| RECORD | ✦ | `/record` |
| QUEST | ⬡ | `/quest` |
| LOG | ≡ | `/records` |

SP: BottomNav（下部固定）／PC: PcSidebar（左サイドバー内）

---

## 実装済みページ

### Dashboard（/）

**SP 構成:**
1. ヘッダー（プレイヤー名・TOTAL LEVEL・EXPバー）
2. HoloRing（size=160 / キャラ画像ホログラム）
3. NAVIGATION グリッド（3列 × 2行、NAV_ITEMS 4項目）
4. CHARACTER STATS アコーディオン（VIT 除く6ステータス＝ DISPLAY_STATUS）
5. DAILY QUEST
6. フッター統計（TOTAL EXP / RECORDS / STREAK）

**PC 構成:**
- 左: PcSidebar
- 中央: タブバー + HoloRing（size=280） + DAILY QUEST（下部）
- 右（300px）: CHARACTER STATS アコーディオン（DISPLAY_STATUS）

`DISPLAY_STATUS = STATUS_ORDER.filter(s => s !== 'VIT')` — VIT は右パネルから除外。

### RecordPage（/record）

- SP・PC ともに同一フォーム構造・同一 state・同一 `handleSubmit`
- フォーム項目: ステータス選択 → 技能選択（chip）→ 難易度 → カウント → 何をしたか → 初挑戦トグル → 送信
- 技能 chip = `SKILL_PRESETS[category]` + `customSkills[category]` のマージ
- PC 右パネル（260px）: EXP CALCULATOR（難易度ハイライト） + TOTAL PREVIEW（リアルタイム）

### QuestPage（/quest）

- タブ: デイリー（3件 / 日次リセット） / マイクエスト
- PC 右パネル（280px）: DAILY PROGRESS bar + TODAY'S REWARD EXP + MY QUESTS 件数

### RecordsPage（/records）

- カテゴリフィルタ（ALL + 7ステータス）
- 各カードに編集（/record?edit=ID）・削除ボタン
- PC 右パネル（280px）: STATS SUMMARY + STATUS EXP bars（全7ステータス・Lv表示）

---

## 将来実装予定ページ（Phase 3+）

### MissionPage（/mission）
ハードミッション。特大EXP（5000）。タイトル・対象ステータス・期限（通常1年後）。

### ChartPage（/chart）
過去比較。スナップショットとの差分レーダーチャート。期間: 1ヶ月前 / 3ヶ月前 / 半年前 / 1年前。

### 技能別ページ（/skills/*）
- WEA → 家計簿
- CHA → 体重管理
- STR → 筋トレスケジュール

# 画面仕様

各ページの構成・入力項目・挙動を定義。デザイントークンは CLAUDE.md を参照。

## Dashboard（全体画面 / メイン）

アプリの顔。起動時に最初に表示する。

構成（上から）：
1. **キャラクター表示** — 全体Lvに応じて見た目変化（`character-system` スキル参照）
2. **全体Lv & 総EXP** — 大きく表示。EXPバーで次のLvまでの進捗
3. **六角形レーダーチャート** — 7ステータスを表示（`chart/HexChart.jsx`）
   - Lv1〜100：軸最大100の10段階（0/10/.../100）
   - 100Lv到達ステータス：1000スケールへ移行（`getChartScale` 参照）
4. **各ステータスカード（7枚）** — Lv・現在称号・EXP進捗バー
   - タップでそのステータスの技能Lv一覧へ遷移
5. **デイリークエスト ショートカット** — 当日の達成状況サマリ

実装メモ：
- ステータスEXPの集計は `useMemo` でキャッシュ
- Firestoreは `onSnapshot` でリアルタイム購読

## RecordPage（記録登録）

努力を記録するメイン入力画面。スマホで素早く入力できることを最優先。

入力項目（上から）：
1. **ステータス選択** — STR/INT/CHA/WEA/DEX/VIT/FUN をアイコンボタンで選択
2. **技能名** — テキスト入力 or 過去に使った技能のプリセット選択
3. **難易度** — 1〜5をボタン or スライダー（自己評価の挑戦ハードル）
4. **回数** — 数値入力（任意）
5. **何をしたか** — テキスト入力
6. **初挑戦トグル** — ON で +50EXP

挙動：
- 登録ボタン → `calcRecordExp` でEXP算出 → Firestoreへ保存
- 保存後、Lvが上がっていれば**レベルアップ演出**（発光＋効果音任意）
- 保存後はDashboardへ戻る or 連続入力できるよう選べると良い

## QuestPage（クエスト）

| 要素 | 内容 |
|------|------|
| タブ | デイリー / ウィークリー切り替え |
| クエストカード | タイトル・内容・報酬EXP・進捗バー |
| 達成ボタン | 押すとEXP付与＆ `isCompleted=true` に更新 |

- デイリーは毎日0時にリセット（periodEnd を翌日0時に設定）
- ウィークリーは週次リセット
- ウィークリーの方が報酬EXPが高い（150 vs 500）

## MissionPage（ハードミッション）

1年がかりの大目標。特大EXP（5000）が報酬。

| 要素 | 内容 |
|------|------|
| 登録フォーム | タイトル・内容・対象ステータス・期限（通常1年後）|
| 進捗表示 | 残り日数・達成率 |
| 達成時 | 特大EXP付与＆特別エフェクト |

## ChartPage（過去比較）

過去の自分と現在を比較してモチベーションにする画面。

| 要素 | 内容 |
|------|------|
| 期間セレクタ | 1ヶ月前 / 3ヶ月前 / 半年前 / 1年前 / 始めた時 |
| レーダーチャート | 過去（半透明）と現在を重ねて表示 |
| 数値サマリ | 各ステータスの増加量・全体Lvの伸び |

実装メモ：
- 選択期間に最も近い `snapshots` を取得して比較
- 「始めた時」は profile.createdAt 直後のスナップショット
- スナップショットが無い期間は「データなし」と明示

## 技能別ページ

各ステータスは技能Lv一覧を持つが、一部のステータスには専用の管理機能を付ける。

### 財力（WEA）→ 家計簿（ZairyokuPage.jsx）

- 収入・支出の入力フォーム（type / amount / category / memo / date）
- 月別の収支グラフ（棒グラフ）
- 費目別集計
- データは `household` コレクション

### 魅力（CHA）→ 体重管理（MiryokuPage.jsx）

- 体重入力（日次）
- 折れ線グラフで推移表示
- 期間フィルタ（1週間 / 1ヶ月 / 3ヶ月）
- データは `bodyWeight` コレクション

### 体力（STR）→ 筋トレスケジュール（TairyokuPage.jsx）

- 週表示カレンダーUI
- メニュー登録・完了チェック（menuItems / isDone）
- 週間達成率の表示
- データは `workoutSchedule` コレクション

> これら専用機能での活動も、記録としてEXPに反映するかは要検討。
> 例：筋トレ完了チェック → 自動で STR の記録を1件作成、なども可能。

## 共通レイアウト

- **BottomNav（スマホ）:** ホーム / 記録 / クエスト / チャート / プロフィール
- レベルアップ演出は共通コンポーネント（`common/LevelUpModal.jsx`）として作り、
  どの画面からでも呼べるようにする
