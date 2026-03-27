// ─────────────────────────────────────────────────────────────────────────────
// pinyin-slug
//
// filter:post.create / filter:post.update 拦截，将中文标题转换为拼音 slug。
// 依赖：pinyin（https://www.npmjs.com/package/pinyin）
// ─────────────────────────────────────────────────────────────────────────────

import { pinyin } from "pinyin-pro";

// ── 读取设置 ──────────────────────────────────────────────────────────────

function getMode(): string {
  const v = nuxtblog.settings.get("mode");
  return v === "always" ? "always" : "auto";
}

function getSeparator(): string {
  const v = nuxtblog.settings.get("separator");
  return v === "_" ? "_" : "-";
}

function getMaxLength(): number {
  const v = nuxtblog.settings.get("max_length");
  const n = Number(v ?? 80);
  return isNaN(n) || n < 0 ? 80 : n;
}

// ── 核心转换 ──────────────────────────────────────────────────────────────

/**
 * 将标题转换为拼音 slug。
 *   - 中文 → 拼音（无声调，pinyin.STYLE_NORMAL）
 *   - 英文 / 数字 → 保留并转小写
 *   - 其他字符（空格、标点）→ 替换为分隔符
 */
function titleToSlug(title: string, sep: string, maxLen: number): string {
  // pinyin-pro: 返回空格分隔的拼音字符串，toneType:'none' 表示无声调
  const pinyinStr: string = pinyin(title, {
    toneType: "none", // 无声调：zhong 而非 zhōng
    nonZh: "consecutive", // 非中文字符原样保留（连续）
    separator: " ",
  });

  const parts: string[] = [];
  for (const word of pinyinStr.split(" ")) {
    const w = word.toLowerCase();
    const cleaned = w.replace(/[^a-z0-9]+/g, " ").trim();
    if (cleaned) {
      parts.push(...cleaned.split(/\s+/));
    }
  }

  let slug = parts.join(sep);

  // 合并连续分隔符，去除首尾
  const sepEsc = sep === "-" ? "\\-" : "_";
  slug = slug
    .replace(new RegExp(`${sepEsc}+`, "g"), sep)
    .replace(new RegExp(`^${sepEsc}|${sepEsc}$`, "g"), "");

  // 截断
  if (maxLen > 0 && slug.length > maxLen) {
    slug = slug.slice(0, maxLen).replace(new RegExp(`${sepEsc}$`), "");
  }

  return slug;
}

/** slug 为空，或仍含中文，则认为需要（重新）生成 */
function needsConversion(slug: string): boolean {
  if (!slug?.trim()) return true;
  return /[\u4e00-\u9fff]/.test(slug);
}

// ── filter:post.create ────────────────────────────────────────────────────

nuxtblog.filter("post.create", (data) => {
  const mode = getMode();
  const sep = getSeparator();
  const maxLen = getMaxLength();

  if (mode === "auto" && !needsConversion(data.slug)) return data;

  const newSlug = titleToSlug(data.title, sep, maxLen);
  if (!newSlug) return data;

  nuxtblog.log.info(`[pinyin-slug] create: "${data.title}" → "${newSlug}"`);
  return { ...data, slug: newSlug };
});

// ── filter:post.update ────────────────────────────────────────────────────

nuxtblog.filter("post.update", (data) => {
  if (!data.title) return data; // 本次未更新标题

  const mode = getMode();
  const sep = getSeparator();
  const maxLen = getMaxLength();

  if (mode === "auto" && !needsConversion(data.slug ?? "")) return data;

  const newSlug = titleToSlug(data.title, sep, maxLen);
  if (!newSlug) return data;

  nuxtblog.log.info(`[pinyin-slug] update: "${data.title}" → "${newSlug}"`);
  return { ...data, slug: newSlug };
});
