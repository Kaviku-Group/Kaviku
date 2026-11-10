// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * АРХИВ — ОТКЛЮЧЕНО (сайт открыт для всех с 10.11.2026).
 * Чтобы снова закрыть сайт паролем: переместить этот файл в functions/_middleware.ts,
 * а в public/_routes.json вернуть "include": ["/*"]. Пароль — секрет SITE_PASSWORD в Cloudflare.
 *
 * Закрытый доступ к сайту на время разработки (Cloudflare Pages Functions).
 *
 * Проверка идёт НА СЕРВЕРЕ Cloudflare: без пароля страницы сайта не отдаются вообще,
 * а сам пароль не попадает в код сайта — он хранится в секрете Cloudflare SITE_PASSWORD.
 *
 *   Задать / сменить пароль:  npx wrangler pages secret put SITE_PASSWORD --project-name kaviku
 *   Открыть сайт для всех:    переменная SITE_GATE = off (Cloudflare → проект → Settings → Variables)
 *                             или удалить этот файл и опубликовать сайт заново.
 *
 * После ввода пароля в браузере сохраняется cookie на 30 дней.
 * При смене пароля все старые входы перестают действовать.
 */

interface Env {
  SITE_PASSWORD?: string;
  SITE_GATE?: string;
}

interface Context {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}

const COOKIE = 'kaviku_access';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 дней
const LOGIN_PATH = '/__access';

/** Что доступно без пароля: оформление страницы входа (логотип, бейдж, иконки, шрифты). */
function isPublicAsset(path: string): boolean {
  return (
    path.startsWith('/assets/') ||
    /^\/(favicon\.ico|favicon-32\.png|apple-touch-icon\.png|icon-512\.png|robots\.txt)$/.test(path) ||
    /^\/_astro\/[^/]+\.woff2$/.test(path)
  );
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Сравнение без утечки по времени. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('Cookie') ?? '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return undefined;
}

/** Возврат только на страницы этого же сайта. */
function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith(LOGIN_PATH) ? value : '/';
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function gatePage(next: string, state: 'ask' | 'wrong' | 'closed'): Response {
  const message =
    state === 'wrong'
      ? '<p class="error" role="alert">Неверный пароль. Попробуйте ещё раз.</p>'
      : state === 'closed'
        ? '<p class="error" role="alert">Вход временно недоступен.</p>'
        : '';
  const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#000000">
<title>Сайт в разработке - Kaviku</title>
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32">
<style>
  :root { --brand-light:#ff9418; --brand:#ff7a14; --brand-deep:#ff5414; --bg:#000; --surface:#0e0e0e; --surface-2:#161616;
          --border:#262626; --text:#f5f5f5; --muted:#a3a3a3; --faint:#737373; }
  * { box-sizing: border-box; }
  html { color-scheme: dark; }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; padding:24px 16px;
         background: radial-gradient(60% 50% at 50% 0%, rgb(255 122 20 / .10), transparent 70%), var(--bg);
         color:var(--text); font-family:'Manrope Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
  .card { width:100%; max-width:440px; display:flex; flex-direction:column; align-items:center; gap:18px; text-align:center;
          padding:32px 24px; border-radius:18px; background:var(--bg); position:relative; isolation:isolate; }
  /* фон карточки строго #000 — как у логотипа, иначе вокруг него виден квадрат */
  .card::before { content:''; position:absolute; inset:0; padding:1px; border-radius:inherit; z-index:-1;
          background:linear-gradient(135deg,var(--brand-light),var(--brand) 50%,var(--brand-deep));
          -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude; }
  .logo { height:56px; width:auto; }
  h1 { margin:0; font-size:clamp(1.5rem, 1.2rem + 1.4vw, 1.9rem); font-weight:800; line-height:1.2; color:var(--brand); }
  .badge { width:min(300px, 80%); height:auto; border-radius:5.6% / 12%; display:block; }
  .note { margin:0; color:var(--muted); font-size:.9rem; line-height:1.5; max-width:32ch; }
  form { width:100%; display:flex; flex-direction:column; gap:10px; margin-top:4px; }
  label { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
  input { width:100%; height:48px; padding:0 16px; border-radius:12px; border:1px solid var(--border); background:var(--surface-2);
          color:var(--text); font:inherit; font-size:1rem; text-align:center; }
  input::placeholder { color:var(--faint); }
  input:focus { outline:none; border-color:var(--brand); }
  button { height:48px; border:0; border-radius:8px; cursor:pointer; font:inherit; font-weight:700;
           background:linear-gradient(135deg,var(--brand-light),var(--brand) 50%,var(--brand-deep)); color:#000; }
  button:hover { box-shadow:0 6px 24px -8px rgb(255 122 20 / .55); }
  button:focus-visible { outline:2px solid var(--brand); outline-offset:2px; }
  .error { margin:0; color:var(--brand-deep); font-size:.9rem; font-weight:700; }
</style>
</head>
<body>
  <main class="card">
    <img class="logo" src="/assets/logo/kaviku-logo-full-h200.png" alt="Kaviku" width="230" height="200">
    <h1>Сайт в разработке</h1>
    <img class="badge" src="/assets/gate/kaviku-staff-badge.webp" alt="" width="900" height="426">
    <p class="note">Временно на сайт могут заходить только сотрудники</p>
    ${message}
    <form method="post" action="${LOGIN_PATH}">
      <input type="hidden" name="next" value="${escapeHtml(next)}">
      <label for="password">Пароль</label>
      <input id="password" name="password" type="password" placeholder="Пароль" autocomplete="current-password" required autofocus>
      <button type="submit">Войти</button>
    </form>
  </main>
</body>
</html>`;
  return new Response(html, {
    status: state === 'ask' ? 401 : 403,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export async function onRequest({ request, env, next }: Context): Promise<Response> {
  if ((env.SITE_GATE ?? '').toLowerCase() === 'off') return next();

  const url = new URL(request.url);
  if (isPublicAsset(url.pathname)) return next();

  const password = env.SITE_PASSWORD ?? '';
  // Пароль не задан — сайт остаётся закрытым (безопаснее, чем случайно открыть его всем)
  if (!password) return gatePage('/', 'closed');

  const token = await hmac(password, 'kaviku-access-v1');

  // Отправка формы входа
  if (url.pathname === LOGIN_PATH && request.method === 'POST') {
    const form = await request.formData().catch(() => undefined);
    const nextPath = safeNext(form?.get('next')?.toString() ?? null);
    const entered = form?.get('password')?.toString() ?? '';
    if (entered && safeEqual(await hmac(password, entered), await hmac(password, password))) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: nextPath,
          'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
          'Cache-Control': 'no-store',
        },
      });
    }
    // Небольшая пауза затрудняет перебор паролей
    await new Promise((r) => setTimeout(r, 800));
    return gatePage(nextPath, 'wrong');
  }

  const cookie = readCookie(request, COOKIE);
  if (cookie && safeEqual(cookie, token)) {
    const response = await next();
    // Закрытые страницы не должны оседать в общих кэшах (картинки, стили и скрипты кэшируются как обычно)
    if (!(response.headers.get('Content-Type') ?? '').includes('text/html')) return response;
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'private, no-store');
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }

  return gatePage(url.pathname === LOGIN_PATH ? '/' : url.pathname + url.search, 'ask');
}
