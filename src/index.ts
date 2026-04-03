// ---------------------------------------------------------------------------
// pinyin-slug
//
// filter:post.create / filter:post.update 拦截，将中文标题转换为拼音 slug。
// 依赖：pinyin-pro（https://www.npmjs.com/package/pinyin-pro）
// ---------------------------------------------------------------------------

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
 */
function titleToSlug(title: string, sep: string, maxLen: number): string {
  const pinyinStr: string = pinyin(title, {
    toneType: "none",
    nonZh: "consecutive",
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

  const sepEsc = sep === "-" ? "\\-" : "_";
  slug = slug
    .replace(new RegExp(`${sepEsc}+`, "g"), sep)
    .replace(new RegExp(`^${sepEsc}|${sepEsc}$`, "g"), "");

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

// ── Lifecycle ─────────────────────────────────────────────────────────────

export function activate(ctx: PluginContext): void {
  ctx.subscriptions.push(
    nuxtblog.filter("post.create", (fCtx) => {
      const mode = getMode();
      const sep = getSeparator();
      const maxLen = getMaxLength();

      if (mode === "auto" && !needsConversion(fCtx.data.slug)) return;

      const newSlug = titleToSlug(fCtx.data.title, sep, maxLen);
      if (!newSlug) return;

      nuxtblog.log.info(`[pinyin-slug] create: "${fCtx.data.title}" → "${newSlug}"`);
      fCtx.data.slug = newSlug;
    }),

    nuxtblog.filter("post.update", (fCtx) => {
      if (!fCtx.data.title) return;

      const mode = getMode();
      const sep = getSeparator();
      const maxLen = getMaxLength();

      if (mode === "auto" && !needsConversion(fCtx.data.slug ?? "")) return;

      const newSlug = titleToSlug(fCtx.data.title, sep, maxLen);
      if (!newSlug) return;

      nuxtblog.log.info(`[pinyin-slug] update: "${fCtx.data.title}" → "${newSlug}"`);
      fCtx.data.slug = newSlug;
    }),
  );
}

export function deactivate(): void {}
