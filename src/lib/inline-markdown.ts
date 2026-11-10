// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

const inlinePattern = /`([^`]+)`|\[([^\]]+)\]\(([^\s)]+)\)|\[text\s*=\s*([^\]]+?)\s*,?\s+url\s*=\s*\(([^)\s]+)\)\]|\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)|(?<![\w])_(?!\s)(.+?)(?<!\s)_(?![\w])/g;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

function safeHref(value: string): string | undefined {
  if (/^(https?:\/\/|mailto:)/i.test(value) || (value.startsWith('/') && !value.startsWith('//')) || value.startsWith('#')) return value;
  return undefined;
}

/** Renders common inline Markdown while escaping all plain text and link attributes. */
export function renderInlineMarkdown(value: string, depth = 0): string {
  if (depth > 8) return escapeHtml(value);

  let html = '';
  let cursor = 0;
  inlinePattern.lastIndex = 0;
  for (const match of value.matchAll(inlinePattern)) {
    const index = match.index ?? 0;
    html += escapeHtml(value.slice(cursor, index));
    const [source, code, markdownLinkText, markdownHref, customLinkText, customHref, strongA, strongB, deleted, italicA, italicB] = match;
    const linkText = markdownLinkText ?? customLinkText;
    const rawHref = markdownHref ?? customHref;
    if (code !== undefined) html += `<code>${escapeHtml(code)}</code>`;
    else if (linkText !== undefined && rawHref !== undefined) {
      const href = safeHref(rawHref);
      html += href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer nofollow">${renderInlineMarkdown(linkText, depth + 1)}</a>` : escapeHtml(source);
    } else if (strongA !== undefined || strongB !== undefined) html += `<strong>${renderInlineMarkdown(strongA ?? strongB!, depth + 1)}</strong>`;
    else if (deleted !== undefined) html += `<del>${renderInlineMarkdown(deleted, depth + 1)}</del>`;
    else html += `<em>${renderInlineMarkdown(italicA ?? italicB!, depth + 1)}</em>`;
    cursor = index + source.length;
  }
  return html + escapeHtml(value.slice(cursor));
}

/** Converts the custom link notation in already-rendered Markdown HTML. */
export function linkifyCustomLinksInHtml(html: string): string {
  return html.replace(/<(code|pre)\b[\s\S]*?<\/\1>|\[text\s*=\s*([\s\S]*?)\s*,?\s+url\s*=\s*\((?:<a\b[^>]*href="(https?:\/\/[^\"]+)"[^>]*>[\s\S]*?<\/a>|(https?:\/\/[^)\s]+))\)\]/gi, (match, codeTag: string | undefined, label: string | undefined, linkedHref: string | undefined, rawHref: string | undefined) => {
    if (codeTag || label === undefined) return match;
    rawHref ??= linkedHref;
    if (rawHref === undefined) return match;
    const decodedHref = rawHref.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const href = safeHref(decodedHref);
    return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer nofollow">${label}</a>` : match;
  });
}
