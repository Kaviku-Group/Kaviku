// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import type { Env } from './env';

/**
 * Анонимный посетитель: случайный id в cookie, подписанной секретом сервера.
 * Подделать чужой id или придумать свой без секрета нельзя.
 * Новый id можно получить, только очистив cookie, — это сдерживают лимиты по хэшу IP (см. rate-limit.ts).
 * Позже, с аккаунтами, visitors.user_id свяжет анонимные лайки с пользователем.
 */

const COOKIE = 'kv_vid';
const MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 года

const encoder = new TextEncoder();
const keyCache = new Map<string, Promise<CryptoKey>>();

function hmacKey(secret: string): Promise<CryptoKey> {
  let key = keyCache.get(secret);
  if (!key) {
    key = crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    keyCache.set(secret, key);
  }
  return key;
}

const toBase64Url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export async function sign(secret: string, message: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(message));
  return toBase64Url(sig).slice(0, 32);
}

/** Сравнение без утечки по времени. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request: Request, name: string): string | undefined {
  for (const part of (request.headers.get('Cookie') ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return undefined;
}

export interface Visitor {
  id: string;
  /** Заголовок Set-Cookie, если посетитель новый — его нужно добавить к ответу. */
  setCookie?: string;
}

export function requireSecret(env: Env): string {
  const secret = env.VISITOR_SECRET;
  if (!secret || secret.length < 16) throw new Error('VISITOR_SECRET не задан (нужно не короче 16 символов)');
  return secret;
}

/** Посетитель из cookie (проверяется подпись). undefined — cookie нет или она поддельная. */
export async function readVisitor(request: Request, env: Env): Promise<Visitor | undefined> {
  const raw = readCookie(request, COOKIE);
  if (!raw) return undefined;
  const [id, sig] = raw.split('.');
  if (!id || !sig || !/^[0-9a-f-]{36}$/.test(id)) return undefined;
  const expected = await sign(requireSecret(env), `vid:${id}`);
  return safeEqual(sig, expected) ? { id } : undefined;
}

/** Посетитель из cookie или новый (записывается в базу, к ответу нужно добавить setCookie). */
export async function getOrCreateVisitor(request: Request, env: Env): Promise<Visitor> {
  const existing = await readVisitor(request, env);
  if (existing) {
    // На случай, если запись в базе потерялась (например, после пересоздания базы)
    await env.DB.prepare('INSERT OR IGNORE INTO visitors (id, created_at) VALUES (?, ?)').bind(existing.id, Date.now()).run();
    return existing;
  }
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO visitors (id, created_at) VALUES (?, ?)').bind(id, Date.now()).run();
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  const value = `${id}.${await sign(requireSecret(env), `vid:${id}`)}`;
  return { id, setCookie: `${COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Lax${secure}` };
}

/** Хэш IP с секретом: сам IP нигде не хранится. */
export async function ipHash(request: Request, env: Env): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'local';
  return sign(requireSecret(env), `ip:${ip}`);
}
