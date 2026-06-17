# CLAUDE.md — パンクロードLv999

## プロジェクト概要

**サイト名:** パンクロードLv999  
**目的:** 日々の努力を数値化・ゲーム化し、RPGステータス形式で可視化する個人用Webアプリ  
**性質:** React.js の学習を兼ねた自分専用の実用アプリ（個人使用のみ）

## 技術スタック

- **フロントエンド:** React.js（Vite）+ React Router
- **バックエンド / DB:** Firebase（Firestore / Authentication）
- **ホスティング:** Firebase Hosting（予定）

## ディレクトリ構成

```
punk-road-lv999/
├── src/
│   ├── assets/           # キャラ画像、アイコン等
│   ├── components/
│   │   ├── common/       # Button, Modal, Badge等の汎用UI
│   │   ├── layout/       # Header, Sidebar, BottomNav
│   │   ├── chart/        # レーダーチャート, 折れ線グラフ
│   │   ├── status/       # ステータスカード, LvBadge
│   │   ├── quest/        # クエストカード, クエストモーダル
│   │   ├── mission/      # ハードミッションUI
│   │   ├── record/       # 記録登録フォーム
│   │   └── skill/        # 技能別ページUI
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── RecordPage.jsx
│   │   ├── QuestPage.jsx
│   │   ├── MissionPage.jsx
│   │   ├── ChartPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── skills/
│   │       ├── ZairyokuPage.jsx    # 財力（家計簿）
│   │       ├── MiryokuPage.jsx     # 魅力（体重管理）
│   │       └── TairyokuPage.jsx    # 体力（筋トレスケジュール）
│   ├── hooks/            # useAuth, useStatus, useLevel, useQuest, useMission
│   ├── lib/              # firebase.js, firestore.js, expCalc.js
│   ├── constants/        # expConfig.js, statusConfig.js, characterStages.js
│   ├── context/          # AuthContext, GameContext
│   └── App.jsx
├── .env.local            # Firebase環境変数（gitignore必須）
├── CLAUDE.md
└── .claude/
    ├── rules/
    │   ├── coding-rules.md   # セキュリティ・定数管理・Reactパターン
    │   └── design-tokens.md  # カラートークン・フォント・演出
    └── skills/
        ├── exp-system/       # EXP・Lv・称号の計算ルール
        ├── data-model/       # Firestoreデータ構造
        ├── screen-specs/     # 各画面の詳細仕様
        └── character-system/ # キャラ変化・ステータス定義
```

## 7ステータス

| ID  | 名称 | 通称 | 対応スキル例 |
|-----|------|------|-------------|
| STR | 体力 | Strength | 筋トレ、スポーツ |
| INT | 知力 | Intelligence | 読書、勉強、資格 |
| CHA | 魅力 | Charisma | ファッション、コミュ |
| WEA | 財力 | Wealth | 節約、副業、投資 |
| DEX | 器用さ | Dexterity | 料理、DIY、楽器 |
| VIT | 生命力 | Vitality | 睡眠、食事、メンタル |
| MEN | 精神力 | Mental | 瞑想、メンタルケア、自己管理 |

- **全体Lv** = 全ステータスのEXP合計から算出
- **個別Lv** = カテゴリーごとのEXP合計から算出
- **技能Lv** = 各ステータス配下の個別スキルごとのLv

## 実装フェーズ

| Phase | 内容 |
|-------|------|
| 1 基盤 | Firebase認証 → 記録登録 → EXP計算 → Firestore保存 → Dashboard基本表示 |
| 2 ゲーム性 | レーダーチャート → 称号システム → クエスト → レベルアップ演出 |
| 3 比較・拡張 | 過去比較チャート → ハードミッション → キャラ変化 → 技能別ページ |
| 4 仕上げ | PWA化 → 通知 → デザイン磨き |

## デザイン方針（概要）

崩壊：スターレイル風のホログラフィックSF UI。
ダークネイビー地（`#05080f`）にシアン（`#00d4ff`）のネオングロー、半透明パネル、発光ボーダーを基調とする。
詳細カラートークン・ボーダースタイル・演出は `.claude/rules/design-tokens.md` 参照。

## スキル索引（作業時に参照）

| スキル | 参照するタイミング |
|--------|------------------|
| `exp-system` | EXP計算・Lv変換・称号ロジックを実装/調整するとき |
| `data-model` | Firestoreの読み書き・コレクション設計を扱うとき |
| `screen-specs` | 各画面（Dashboard, RecordPage等）を実装するとき |
| `character-system` | キャラ変化・ステータス称号の定数を扱うとき |
