# Bopomofo

日本語・英語の文を 繁体字(台湾華語)→ 注音符号 → 酷音(Chewing)大千配列のキー列 に変換する Cloudflare Workers アプリ。

## 構成

| 段階 | 実装 |
| --- | --- |
| 翻訳 | Workers AI `@cf/meta/m2m100-1.2b` |
| 簡体 → 繁体 | `opencc-js`(cn → twp) |
| 漢字 → 拼音 | `pinyin-pro`(簡体字の文脈で読みを決め、語彙置換で字が変わった位置だけ繁体字で読む) |
| 拼音 → 注音 | `pinyin-zhuyin`(依存なしの純 JS。Workers 上で動作確認済み) |
| 注音 → キー | `src/keys.ts`(大千配列の対応表) |

## 起動

```sh
npm install
npx wrangler login          # 初回のみ。Workers AI を使うため Cloudflare アカウントが必要
npm run dev                 # = wrangler dev --remote
```

http://localhost:8787 を開く。

## API

`POST /api/convert` に `{ "text": "こんにちは", "lang": "ja" }`(`lang` は `ja` / `en`)を送ると、次を返す。

```json
{ "hant": "你好", "zhuyin": ["ㄋㄧˇ", "ㄏㄠˇ"], "keys": "su3cl3", "keysPerChar": ["su3", "cl3"] }
```

`zhuyin` と `keysPerChar` は `hant` の 1 文字ごとの配列。漢字以外の文字はその文字自体が入る。
翻訳エラー時は HTTP 502 と `{ "error": "..." }` を返す。

## テスト

```sh
npm test         # 注音 → キー変換と変換パイプライン(翻訳はスタブ)の単体テスト
npm run typecheck
```
