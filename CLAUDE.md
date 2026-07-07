# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**Moddable SDK + TypeScript** で **M5Stack CoreS3** アプリを開発できるかの技術検証。
対象プラットフォーム識別子は `esp32/m5stack_cores3`（ESP32-S3 / 320x240 タッチ液晶）。
アプリ本体は最小の Piu GUI（[main.ts](main.ts)。画面左半分タップで -1、右半分で +1 のカウンタ）。

構成は [`xs-dev`](https://xs-dev.js.org) の `xs-dev init --typescript` が生成する雛形に準拠している。

## コマンド

```
npm start     # tsc(prestart) → xs-dev run（macOS シミュレータ + xsbug）
npm run build # tsc(prebuild) → xs-dev build
npm run deploy # tsc(predeploy) → CoreS3 実機へ書き込み
```

`prestart`/`prebuild`/`predeploy` の npm ライフサイクルで先に `tsc` が走る（下記の2段階ビルドのため）。

## ビルドの仕組み（2段階）

`xs-dev init --typescript` 準拠のため、mcconfig で `.ts` を直接ビルドするのではなく **tsc → mcpack の2段階**:

1. **`tsc`** が [tsconfig.json](tsconfig.json) に従い `main.ts` を `dist/main.js` にコンパイル（`outDir: dist`）。
2. **`xs-dev run`** が内部で **`mcpack`** を使い、`package.json` の `"main": "dist/main.js"` を入口にビルド・実行する。

要点:
- **`xs-dev` は `package.json` があると自動で `mcpack` を使う**（`mcconfig` ではなく）。そのため入口はコンパイル済み JS（`dist/main.js`）である必要がある。TypeScript ソースを直接 `main` にはできない。
- **manifest は `package.json` の `moddable.manifest` に埋め込む**（別ファイルの `manifest.json` は持たない）。`mcpack` がここから `package-manifest.json` を生成する（ビルド成果物・gitignore 済み）。
- **`mcpack` は `main.ts`(→dist) 内の import を走査して依存を自動注入する**。`import "piu/MC"` を検知すると `manifest_piu.json` を自動 include する（ビルドログに `# mcpack include: .../manifest_piu.json` が出る）。
- フォント等のリソースは `moddable.manifest.resources` に記述する。

## Piu と TypeScript の注意点

- **piu/MC のクラス（`Application`/`Skin`/`Style`/`Text`/`Behavior`…）はグローバル**として提供される（`@moddable/typings` の `piu/MC.d.ts` が `global { const Application: … }` を宣言）。値は import せず、グローバルとして参照する。
  - `main.ts` 冒頭は `import "piu/MC";`（副作用 import。これで実行時にグローバルが入り、`mcpack` も piu を検知する）+ 型注釈用に `import type { Application, Text } from "piu/MC";`。
  - 名前付き値 import（`import { Application } from "piu/MC"`）はコンパイル時に省略され、`dist/main.js` から消えて `mcpack` が piu を見つけられなくなるので使わない。
- テンプレートのインスタンス化は**引数2つ必須**（data と dictionary）: 例 `new CountText($, {})`, `new CounterApplication(data, {})`。
- `anchor` を付けたコンテンツは、その第1引数(data)に自分を差し込む（→ `data.countText`）。`Behavior` は `onCreate(app, data)` で受け取った `this.data` から参照する。
- `Behavior` が後から設定するフィールドは `declare data: Model` で型付けする（実行コードを出さないため）。

## 前提ツール

- `xs-dev` と Moddable SDK（`$MODDABLE`）。新しいシェルは `~/.zshenv` が `~/.local/share/xs-dev-export.sh` を読み込む。
- 実機ビルドは ESP-IDF（`xs-dev setup --device esp32`）。
- devDependencies: `@moddable/typings`, `typescript`（`tsconfig.json` は `@moddable/typings` の型を参照）。

## ディスプレイ無しでの動作確認

シミュレータは GUI で、ヘッドレスシェルからは観測しづらい。ビルド成否と例外・トレースは `mcpack mcconfig -dl -m -p sim -o <dir>` を xsbug-log 経由で流して確認できる（`[Thread 1] Connected` の後にトレースが出る）。`onDisplaying` に `trace()` を入れれば描画到達を確認できる。
