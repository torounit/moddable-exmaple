# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**Moddable SDK + TypeScript** で **M5Stack CoreS3** アプリを開発できるかの技術検証。
対象プラットフォーム識別子は `esp32/m5stack_cores3`（ESP32-S3 / 320x240 静電容量タッチ液晶）。
アプリ本体は最小の Piu GUI（[main.ts](main.ts)、画面タップでカウンタが増える）。

## コマンド

npm スクリプトが入口。npm は `node_modules/.bin` を `PATH` に足すため、ビルド中に Moddable が素の `tsc` を呼んでも解決できる。

- `npm run sim` — ビルドして macOS シミュレータを起動（xsbug デバッガ付き）。高速な反復用。
- `npm run deploy` — 接続した CoreS3 にビルド＆書き込み（`mcconfig -d -m -p esp32/m5stack_cores3`）。
- `npm run typecheck` — `tsc --noEmit` のみ（型チェック。ビルドはしない）。

`mcconfig` を直接叩く場合は `mcconfig` と `tsc` が PATH にある必要がある。シェル設定（`~/.zshenv`）で `~/.local/share/xs-dev-export.sh` を読み込んでいるので新しいシェルでは通る。通っていなければ `source ~/.local/share/xs-dev-export.sh` する。

## 前提ツール

- **Moddable SDK**（`$MODDABLE` 設定済み）。本リポジトリは [`xs-dev`](https://xs-dev.js.org) で構築。ビルド前に `source ~/.local/share/xs-dev-export.sh`（`MODDABLE` / `IDF_PATH` / SDK ツールの PATH を設定）。
- **TypeScript 6 以上**（devDependency）。SDK が生成するビルド設定は `lib/target: es2025` を要求し、TS 5 系は拒否するため TS 6 が必須。
- **実機ビルド**には ESP-IDF（`IDF_PATH`）が追加で必要。`xs-dev setup --device esp32` で導入。

## TypeScript + Moddable のビルドの仕組み

エントリは `package.json` ではなく [manifest.json](manifest.json)。ビルドの全体像は、manifest とそれが include する SDK マニフェストを合わせて読むと分かる。

- `modules: { "*": "./main" }` が `main.ts` を指す。`.ts` なので `mcconfig` が `tsc` で型チェックしたうえで XS コンパイラが型を除去してバイトコード化する。xsbug には元の TypeScript が表示される。
- include した SDK マニフェストが機能を注入する（"build injection"）: `manifest_piu.json`（Piu UI + ディスプレイ/タッチドライバ）、`manifest_base.json`（コアランタイム）、`manifest_typings.json`（ビルド時の型定義）。`manifest_piu` は `manifest_base` を含まないので3つとも必要。
- **型定義は npm ではなく `$MODDABLE/typings` にある。** `manifest_typings.json` が `piu/*` や `embedded:io/*` などの specifier をそこへマッピングする。[tsconfig.json](tsconfig.json) はエディタ用で、npm 公開版の同じ型（`./node_modules/@moddable/typings`）を指す。
- manifest の `typescript.tsconfig.compilerOptions` ブロックで SDK 生成の tsconfig を上書きできる（SDK が `mcmanifest.js` で `Object.assign` する）。本リポジトリはここで `lib` に `esnext.disposable` を足している。SDK の型定義が `Disposable` グローバルを参照するが、これは `es2025` lib に含まれないため。

## Piu アプリの注意点（実行時 "unhandled exception" になりやすい）

[main.ts](main.ts) はモジュール読み込み時に UI を構築し、`Application` を `export default` する。編集時の注意:

- 複数行/フロー表示には `Text` を使う。その `Style` は `horizontal`/パディングを持つが **`vertical` は不可**（それは単一行の `Label` 用）。`Text` のスタイルに `vertical` を付けるとレイアウト時に例外になり得る。
- `Behavior` からコンテンツを更新するときは、名前で実行時ルックアップせず、モジュールスコープの参照を保持して直接書き換える（`countText` 参照）。
- `Application`（や任意のコンテンツ）がタッチを受け取るには `active: true` が必要。
- フォントは manifest の `resources`（`*-alpha`）にバンドルし、`Style` からはそのリソース名（例 `"OpenSans-Semibold-28"`）で参照する。

## ディスプレイ無しでの動作確認

シミュレータは GUI アプリでヘッドレスシェルからは観測できない。例外なく構築・描画されるかは、ログモードでビルドしてトレースを読む:

```
mcconfig -dl -m -p sim      # ビルド→sim 起動→xsbug-log 経由でトレースを標準出力へ
```

`Behavior.onDisplaying`（レイアウト・表示完了時に一度発火）に `trace("…\n")` を入れ、`[Thread 1] Connected` の後に出れば描画到達。注意: モジュール評価中のトレースは、その評価が途中で例外を投げると失われる。マーカーより手前のトレースが「出ない」＝それより前の構築で例外が起きた、という切り分けに使える。
