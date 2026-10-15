import { test } from "node:test";
import assert from "node:assert/strict";
import { zhuyinToKeys } from "../src/keys.ts";

test("3 声", () => {
  assert.equal(zhuyinToKeys("ㄋㄧˇ"), "su3");
  assert.equal(zhuyinToKeys("ㄏㄠˇ"), "cl3");
});

test("1 声は末尾に Space", () => {
  assert.equal(zhuyinToKeys("ㄇㄚ"), "a8 ");
  assert.equal(zhuyinToKeys("ㄓ"), "5 ");
});

test("2 声・4 声", () => {
  assert.equal(zhuyinToKeys("ㄇㄚˊ"), "a86");
  assert.equal(zhuyinToKeys("ㄕˋ"), "g4");
});

test("軽声は前置・後置どちらでも末尾の 7 になる", () => {
  assert.equal(zhuyinToKeys("˙ㄇㄚ"), "a87");
  assert.equal(zhuyinToKeys("ㄇㄚ˙"), "a87");
});

test("ㄩ・ㄦ・介音を含む音節", () => {
  assert.equal(zhuyinToKeys("ㄌㄩˋ"), "xm4");
  assert.equal(zhuyinToKeys("ㄦˊ"), "-6");
  assert.equal(zhuyinToKeys("ㄐㄩㄥˇ"), "rm/3");
});

test("注音以外はそのまま通す", () => {
  assert.equal(zhuyinToKeys("，"), "，");
  assert.equal(zhuyinToKeys("A"), "A");
});
