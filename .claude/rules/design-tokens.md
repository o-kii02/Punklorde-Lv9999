# デザイントークン & UI方針

## テーマ

崩壊：スターレイル風のホログラフィックSF UI。
ダークネイビー地にシアン/ティールのネオングロー、半透明パネル、発光ボーダーを基調とする。
スマホファースト（主にスマホで記録する想定）。

## カラートークン

| 用途 | 値 | 備考 |
|------|-----|------|
| Background | `#05080f` | 最も暗い背景（ほぼ黒に近いネイビー）|
| Surface | `#0d1420` | パネル・カード背景（半透明使用時は `rgba(13,20,32,0.85)`）|
| Surface Alt | `#111b2e` | サイドバー・サブパネル背景 |
| Primary Accent（シアン）| `#00d4ff` | ボーダー発光・選択状態・アイコン |
| Secondary（ティール）| `#4fc3f7` | ホバー・補助テキスト |
| Selected Highlight | `rgba(0,212,255,0.15)` | 選択中リストアイテムの背景 |
| Text Primary | `#e8edf5` | メインテキスト |
| Text Secondary | `#7a8fa6` | サブテキスト・ラベル |
| Gold（評価・星）| `#f0c060` | ★評価、レア度表示 |
| Success | `#22c55e` | 達成・完了状態 |
| Danger | `#ef4444` | 警告・危険 |
| Glow Cyan | `0 0 8px #00d4ff, 0 0 20px rgba(0,212,255,0.4)` | box-shadow / text-shadow のグロー値 |

## フォント

- 日本語: Noto Sans JP
- 数字・英字: Rajdhani または Orbitron（太め）
- UI ラベル（タブ名等）: 大文字、letter-spacing 広め

## ボーダー & パネルスタイル

```css
/* 標準パネル */
background: rgba(13, 20, 32, 0.85);
border: 1px solid rgba(0, 212, 255, 0.35);
backdrop-filter: blur(8px);

/* 選択・アクティブ状態 */
border-color: #00d4ff;
box-shadow: 0 0 8px #00d4ff, inset 0 0 12px rgba(0,212,255,0.08);

/* タブ・ボタン（非選択）*/
border: 1px solid rgba(0, 212, 255, 0.2);
color: #7a8fa6;
```

## レイアウト構成（スターレイル風）

```
┌─────────────────────────────────────────────────┐
│  [タブ1] [タブ2] [タブ3] [タブ4]  ← 上部タブナビ  │
├──────────┬──────────────────────┬───────────────┤
│          │                      │               │
│ 左       │   中央メインエリア    │  右サイドパネル│
│ サイドバー│  （キャラ or リスト） │  （ステータス）│
│          │                      │               │
└──────────┴──────────────────────┴───────────────┘
```

- **左サイドバー**: 縦ナビメニュー、`Surface Alt` 背景、シアンのアクティブ線
- **中央**: コンテンツメイン、ホログラフィックリング演出など
- **右パネル**: ステータスカード、進捗バー

## ステータスカラー（7ステータス）

| ステータス | カラー | 備考 |
|-----------|--------|------|
| STR（体力）| `#ef4444` | 赤 |
| INT（知力）| `#4fc3f7` | ライトブルー |
| CHA（魅力）| `#ec4899` | ピンク |
| WEA（財力）| `#f0c060` | ゴールド |
| DEX（器用さ）| `#22c55e` | グリーン |
| VIT（生命力）| `#14b8a6` | ティール |
| MEN（精神力）| `#a78bfa` | パープル |

## 演出

- **レベルアップ**: シアンの発光エフェクト拡散 + ホログラム風テキスト
- **EXPバー**: シアングロー付きアニメーション
- **選択アイテム**: 左端にシアンの縦ライン + 背景薄いシアン
- **ホログラフィックリング**: キャラ後ろの回転する円形UI（`Dashboard` のキャラ表示エリア）
- **パネル出現**: フェードイン + 軽いスライドイン

## 実装メモ

- グロー効果は `box-shadow` / `filter: drop-shadow()` で実装（CSSのみ）
- 半透明パネルは `backdrop-filter: blur()` + `rgba` 背景
- ボーダーグロー付きコンポーネントは共通クラス `.panel-holo` などで統一
- 七角形チャート（7ステータス）はシアンのストローク＋薄シアン塗り

## ホログラム CSS アニメーション一覧

`Dashboard.jsx` 内 `HOLO_STYLE` 定数に `<style>` タグ経由で注入する。

| クラス | keyframes | 周期 | 用途 |
|--------|-----------|------|------|
| `.ring-cw` | ring-cw | 12s linear | 外リング時計回り回転 |
| `.ring-ccw` | ring-ccw | 8s linear | 内リング反時計回り回転 |
| `.scan-y` | scan-y | 3s ease-in-out | 縦スキャンライン往復 |
| `.pulse-c` | pulse-c | 2.5s ease-in-out | 中央グロー点滅拡縮 |
| `.blink` | data-blink | 1.8s ease-in-out | テキストブリンク |
| `.holo-scan-bar` | holo-scan | 4s linear | キャラ移動スキャンライン（上→下ループ） |
| `.holo-flicker` | holo-flicker | 6s ease-in-out | キャラ全体フリッカー（opacity断続変化） |
| `.holo-glitch` | holo-glitch | 7s ease-in-out | グリッチ（translateX ± clip-path） |
| `.holo-rgb` | holo-rgb | 7s ease-in-out | RGB色収差（drop-shadow 予備） |

## PC レイアウト 寸法

| エリア | 幅 |
|--------|----|
| `PcSidebar`（左） | 220px 固定 |
| 中央 main | flex-1 |
| 右パネル — Dashboard | 300px |
| 右パネル — RecordPage | 260px |
| 右パネル — QuestPage / RecordsPage | 280px |

## HoloRing コンポーネント

`src/pages/Dashboard.jsx` 内 `HoloRing({ size, imageSrc, onImageClick })`。

- `size`: 直径 px。SP = 160、PC = 280
- 内部寸法はすべて `size` 比率で算出（ハードコード禁止）
  - outer = size、inner = size×0.74、glow = size×0.44、imgW = size×1.1、imgH = size×1.7
- **imageSrc なし**: 中央にテキスト + "TAP TO SET IMAGE"
- **imageSrc あり（透過 PNG 推奨）**:
  - `drop-shadow` がアルファチャンネルのシルエット形状に沿って発光
  - `<img>` × 3 重ね（メイン / シアン左2px / ピンク右2px）で色収差
  - `mix-blend-mode: screen` で透過を維持
  - 下部フェード（32%）でホログラム投影感
- 画像タップ → `<input type="file" accept="image/*">` を起動して差し替え
- 画像は `localStorage['punk_char_image']` に base64 で永続保存
