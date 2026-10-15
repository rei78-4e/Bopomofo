import { test } from "node:test";
import assert from "node:assert/strict";
import { convert, type Translator } from "../src/convert.ts";

// 翻訳は Workers AI を使わず固定値で差し替える
const fake = (out: string): Translator => async () => out;

test("簡体字の翻訳結果を繁体字・注音・キーに変換する", async () => {
  const r = await convert("こんにちは", "ja", fake("你好吗"));
  assert.equal(r.hant, "你好嗎");
  assert.deepEqual(r.zhuyin, ["ㄋㄧˇ", "ㄏㄠˇ", "ㄇㄚ˙"]);
  assert.equal(r.keysPerChar.length, 3);
  assert.equal(r.keys, "su3cl3a87");
});

test("英数字・記号・句読点はそのまま通す", async () => {
  const r = await convert("x", "en", fake("OK，你好 123!"));
  assert.deepEqual(r.zhuyin, ["O", "K", "，", "ㄋㄧˇ", "ㄏㄠˇ", " ", "1", "2", "3", "!"]);
  assert.equal(r.keys, "OK，su3cl3 123!");
});

test("翻訳エラーは例外として伝わる", async () => {
  const failing: Translator = async () => { throw new Error("boom"); };
  await assert.rejects(convert("x", "en", failing), /boom/);
});

test("多音字は簡体字の文脈で読みを決める", async () => {
  const r = await convert("x", "ja", fake("我去银行"));
  assert.equal(r.hant, "我去銀行");
  assert.deepEqual(r.zhuyin, ["ㄨㄛˇ", "ㄑㄩˋ", "ㄧㄣˊ", "ㄏㄤˊ"]);
});

test("台湾語彙への置換で文字が変わった位置は繁体字側で読む", async () => {
  const r = await convert("x", "ja", fake("软件"));
  assert.equal(r.hant, "軟體");
  assert.deepEqual(r.zhuyin, ["ㄖㄨㄢˇ", "ㄊㄧˇ"]);
});
