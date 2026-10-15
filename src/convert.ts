import * as OpenCC from "opencc-js/cn2t";
import { pinyin } from "pinyin-pro";
import { pinyinToZhuyin } from "pinyin-zhuyin";
import { zhuyinToKeys } from "./keys.ts";

export type Lang = "ja" | "en";

export interface ConvertResult {
  hant: string;
  /** hant の 1 文字ごとの注音(漢字以外はその文字自体) */
  zhuyin: string[];
  /** 大千配列のキー列 */
  keys: string;
  /** hant の 1 文字ごとのキー列(ルビ表示用) */
  keysPerChar: string[];
}

/** 翻訳関数。テストで差し替えられるように注入する。 */
export type Translator = (text: string, lang: Lang) => Promise<string>;

const SOURCE_LANG: Record<Lang, string> = { ja: "japanese", en: "english" };

export function workersAiTranslator(ai: Ai): Translator {
  return async (text, lang) => {
    const res = await ai.run("@cf/meta/m2m100-1.2b", {
      text,
      source_lang: SOURCE_LANG[lang],
      target_lang: "chinese",
    });
    const translated = (res as { translated_text?: string }).translated_text;
    if (!translated) throw new Error("翻訳結果が空でした");
    return translated;
  };
}

const toTraditional = OpenCC.Converter({ from: "cn", to: "twp" });
const toTraditionalChar = OpenCC.Converter({ from: "cn", to: "tw" });
const HAN = /^\p{Script=Han}$/u;
const PINYIN_NUM = /^[a-zü]+[0-5]$/;

function readings(text: string): string[] {
  const chars = Array.from(text);
  // 多音字の判定に文脈を使うため文全体を渡す。要素数がずれたら 1 文字ずつ求める
  const whole = pinyin(text, { toneType: "num", type: "array" });
  if (whole.length === chars.length) return whole;
  return chars.map((c) => pinyin(c, { toneType: "num", type: "array" })[0] ?? c);
}

/**
 * 繁体字の各文字を注音・キーに変換する。
 * pinyin-pro は簡体字の方が多音字の判定が正確(例:嗎 → ma2、银行 → yin2 hang2)なため、
 * 元の簡体字 hans が与えられ、その文字を 1 字単位で繁体化した結果が hant と一致する位置では簡体字側の読みを使う。
 */
export function hantToZhuyin(hant: string, hans?: string): Pick<ConvertResult, "zhuyin" | "keys" | "keysPerChar"> {
  const chars = Array.from(hant);
  const hantPy = readings(hant);
  const hansChars = hans ? Array.from(hans) : [];
  const hansPy = hansChars.length === chars.length ? readings(hans!) : [];
  const zhuyin = chars.map((c, i) => {
    if (!HAN.test(c)) return c;
    const py = hansPy[i] !== undefined && toTraditionalChar(hansChars[i]) === c ? hansPy[i] : hantPy[i];
    return PINYIN_NUM.test(py) ? pinyinToZhuyin(py) : c;
  });
  const keysPerChar = zhuyin.map((z, i) => (z === chars[i] ? z : zhuyinToKeys(z)));
  return { zhuyin, keys: keysPerChar.join(""), keysPerChar };
}

export async function convert(text: string, lang: Lang, translate: Translator): Promise<ConvertResult> {
  const translated = await translate(text, lang);
  const hant = toTraditional(translated);
  return { hant, ...hantToZhuyin(hant, translated) };
}
