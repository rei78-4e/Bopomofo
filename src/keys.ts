// 酷音(Chewing)大千配列:キーと注音の対応
const KEYS = "1qaz2wsx3edc4rfv5tgb6yhn7ujm8ik,9ol.0p;/-";
const ZHUYIN = "ㄅㄆㄇㄈㄉㄊㄋㄌˇㄍㄎㄏˋㄐㄑㄒㄓㄔㄕㄖˊㄗㄘㄙ˙ㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ";

const ZHUYIN_TO_KEY = new Map<string, string>(
  Array.from(ZHUYIN, (z, i) => [z, KEYS[i]]),
);
const TONE_MARKS = new Set(["ˊ", "ˇ", "ˋ", "˙"]);

/** 1 音節分の注音を大千配列のキー列に変換する。注音以外の文字はそのまま返す。 */
export function zhuyinToKeys(syllable: string): string {
  let s = syllable;
  // 前置の軽声記号は末尾へ移す
  if (s.startsWith("˙")) s = s.slice(1) + "˙";
  const chars = Array.from(s);
  if (!chars.some((c) => ZHUYIN_TO_KEY.has(c))) return syllable;

  const keys = chars.map((c) => ZHUYIN_TO_KEY.get(c) ?? c).join("");
  // 1 声(声調記号なし)は Space で確定
  return TONE_MARKS.has(chars[chars.length - 1]) ? keys : keys + " ";
}
