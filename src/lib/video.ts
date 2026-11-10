// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Ссылки на видео из поля videoUrl → адрес встроенного плеера.
 * Поддерживаются: YouTube, VK Видео, Rutube и прямые ссылки на файлы .mp4 / .webm.
 */
export interface VideoSource {
  kind: 'youtube' | 'vk' | 'rutube' | 'file';
  /** Адрес для iframe (или для <video>, если kind = file). */
  embed: string;
  /** Готовая превью-картинка, если сервис её даёт (у YouTube). */
  thumb?: string;
  url: string;
}

export const SUPPORTED_VIDEO_HINT = 'поддерживаются YouTube, VK Видео, Rutube или прямая ссылка на файл .mp4 / .webm';

export function parseVideoUrl(raw: string): VideoSource | undefined {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return undefined;
  }
  if (url.protocol !== 'https:') return undefined;
  const host = url.hostname.replace(/^(www\.|m\.)/, '');

  // YouTube: watch?v=ID, youtu.be/ID, /shorts/ID, /embed/ID, /live/ID
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com') {
    const id =
      host === 'youtu.be'
        ? url.pathname.slice(1).split('/')[0]
        : (url.searchParams.get('v') ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/)?.[1]);
    if (!id || !/^[\w-]{6,20}$/.test(id)) return undefined;
    const start = Number.parseInt(url.searchParams.get('t') ?? url.searchParams.get('start') ?? '', 10);
    return {
      kind: 'youtube',
      embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0${Number.isFinite(start) && start > 0 ? `&start=${start}` : ''}`,
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      url: raw,
    };
  }

  // VK Видео: vk.com/video-123_456, vkvideo.ru/video-123_456, vk.com/...?z=video-123_456, video_ext.php?oid=&id=
  if (host === 'vk.com' || host === 'vkvideo.ru' || host === 'vk.ru') {
    if (url.pathname === '/video_ext.php' && url.searchParams.get('oid') && url.searchParams.get('id')) {
      return { kind: 'vk', embed: `https://vk.com/video_ext.php?${url.searchParams.toString()}&autoplay=1`, url: raw };
    }
    const m = (url.pathname + ' ' + (url.searchParams.get('z') ?? '')).match(/video(-?\d+)_(\d+)/);
    if (!m) return undefined;
    return { kind: 'vk', embed: `https://vk.com/video_ext.php?oid=${m[1]}&id=${m[2]}&hd=2&autoplay=1`, url: raw };
  }

  // Rutube: rutube.ru/video/ID/, rutube.ru/play/embed/ID
  if (host === 'rutube.ru') {
    const id = url.pathname.match(/^\/(?:video|play\/embed)\/([0-9a-f]{20,40})/i)?.[1];
    if (!id) return undefined;
    return { kind: 'rutube', embed: `https://rutube.ru/play/embed/${id}?autoplay=1`, url: raw };
  }

  // Прямая ссылка на видеофайл
  if (/\.(mp4|webm)$/i.test(url.pathname)) {
    return { kind: 'file', embed: url.toString(), url: raw };
  }

  return undefined;
}
