/// <reference types="@nuxtblog/plugin-sdk" />

import { pinyin } from 'pinyin-pro'

function isCJK(code: number): boolean {
  return (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x20000 && code <= 0x2a6df)
}

function needsConversion(slug: string): boolean {
  if (!slug) return true
  for (let i = 0; i < slug.length; i++) {
    if (isCJK(slug.charCodeAt(i))) return true
  }
  return false
}

function titleToSlug(title: string, separator: string, maxLength: number): string {
  if (!title) return ""

  // Convert to pinyin, non-CJK chars pass through
  const py = pinyin(title, { toneType: 'none', type: 'array' })

  let slug = py
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
    .join(separator)
    // Keep only alphanumeric and separator
    .replace(new RegExp(`[^a-z0-9${separator === '-' ? '\\-' : separator}]`, 'g'), separator)

  // Collapse repeated separators
  const double = separator + separator
  while (slug.indexOf(double) !== -1) {
    slug = slug.split(double).join(separator)
  }

  // Trim separators from edges
  while (slug.length > 0 && slug[0] === separator) slug = slug.substring(1)
  while (slug.length > 0 && slug[slug.length - 1] === separator) slug = slug.substring(0, slug.length - 1)

  // Enforce max length
  if (maxLength > 0 && slug.length > maxLength) {
    slug = slug.substring(0, maxLength)
    while (slug.length > 0 && slug[slug.length - 1] === separator) slug = slug.substring(0, slug.length - 1)
  }

  return slug
}

// ── Filter handler ──────────────────────────────────────────────────────

function convertSlug(fc: FilterContext<FilterPostCreateData>): void {
  const mode = ctx.settings.get("mode") || "auto"
  const separator = (ctx.settings.get("separator") as string) || "-"
  const maxLength = (ctx.settings.get("max_length") as number) || 80

  const title = fc.data.title || ""
  const slug = fc.data.slug || ""

  if (!title) return
  if (mode === "auto" && !needsConversion(slug)) return

  const newSlug = titleToSlug(title, separator, maxLength)
  if (!newSlug) return

  ctx.log.info('[pinyin-slug] "' + title + '" → "' + newSlug + '"')
  fc.data.slug = newSlug
}

// ── Plugin export ───────────────────────────────────────────────────────

module.exports = {
  activate() {
    ctx.log.info("Pinyin Slug plugin activated (JS)")
  },

  filters: [
    {
      event: "filter:post.create" as const,
      handler(fc: FilterContext<FilterPostCreateData>) { convertSlug(fc) },
    },
    {
      event: "filter:post.update" as const,
      handler(fc: FilterContext<FilterPostUpdateData>) { convertSlug(fc as FilterContext<FilterPostCreateData>) },
    },
  ],
} satisfies PluginExports
