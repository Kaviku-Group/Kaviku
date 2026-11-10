// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/** Общие помощники для ответов API. */

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function error(status: number, code: string, message: string): Response {
  return json({ error: code, message }, { status });
}

/**
 * Защита от подделки запросов с чужих сайтов: изменяющие запросы (POST)
 * принимаются только со страниц самого Kaviku.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (origin) return origin === new URL(request.url).origin;
  const site = request.headers.get('Sec-Fetch-Site');
  return !site || site === 'same-origin';
}

/** Простые признаки ботов и предзагрузки ссылок — такие переходы не считаются скачиваниями. */
export function looksLikeBot(request: Request): boolean {
  const ua = request.headers.get('User-Agent') ?? '';
  if (!ua) return true;
  // Роботы и превью ссылок (Googlebot, TelegramBot, Discordbot, WhatsApp/…), но НЕ встроенные
  // браузеры мессенджеров (в Telegram-Android, Instagram и т. п. — живые люди)
  // «bot»/«Bot» с учётом регистра: Googlebot, YandexBot, TelegramBot — да, телефон CUBOT — нет
  if (/(?:bot|Bot)(?:[\/;\s)]|$)/.test(ua)) return true;
  if (/crawler|spider|crawl|slurp|facebookexternalhit|whatsapp\/|curl\/|wget\/|python-requests|headlesschrome|google web preview/i.test(ua)) {
    return true;
  }
  const purpose = request.headers.get('Sec-Purpose') ?? request.headers.get('Purpose') ?? '';
  return /prefetch|prerender/i.test(purpose);
}
