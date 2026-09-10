/**
 * Notion API プロキシ (kakeibo-notion-proxy)
 *
 * 家計簿アプリ (kakeibo.html) 専用。Notionトークンは Worker のシークレットだけが持ち、
 * ブラウザは合言葉 (X-Kakeibo-Key) しか送らない。
 *
 * 許可する Notion パスは kakeibo.html の実呼び出しと突き合わせ済み:
 *   POST /v1/databases/{口座|残高|設定}/query
 *     queryDB()。ページネーションの start_cursor はボディに入るのでパスは同じ。
 *   POST /v1/pages
 *     writeBalance() の新規作成。parent.database_id は月次残高DBのみ（ボディでも検証）。
 *   PATCH /v1/pages/{pageId}
 *     writeBalance() の更新と saveTarget()。archived は送らない（アプリに削除処理はない）。
 *   GET  /v1/users/me
 *     testConnection()。
 * アプリは GET /v1/databases/{id}（スキーマ取得）も DELETE も呼んでいない。
 */

const ALLOWED_DB_IDS = new Set([
  '353e165e5f8a805993dbe53adb999fe2', // 口座マスタ
  '353e165e5f8a80268d64ebca79db2f2a', // 月次残高
  '353e165e5f8a80d49eade18b52d1884d', // 設定
]);

function jsonError(status, message, corsHeaders) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeDbId(id) {
  return String(id || '').replace(/-/g, '').toLowerCase();
}

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const aa = enc.encode(String(a ?? ''));
  const bb = enc.encode(String(b ?? ''));
  const len = Math.max(aa.length, bb.length, 1);
  const xa = new Uint8Array(len);
  const xb = new Uint8Array(len);
  xa.set(aa);
  xb.set(bb);
  let diff = aa.length ^ bb.length;
  for (let i = 0; i < len; i++) diff |= xa[i] ^ xb[i];
  return diff === 0;
}

function normalizeNotionPath(pathname) {
  let p = pathname.startsWith('/notion') ? pathname.slice('/notion'.length) : pathname;
  if (!p.startsWith('/')) p = '/' + p;
  if (!p.startsWith('/v1/')) p = '/v1' + p;
  return p;
}

function isAllowedPath(method, path) {
  if (method === 'GET' && path === '/v1/users/me') return true;
  if (method === 'POST' && path === '/v1/pages') return true;
  // Notion の page id はハイフン無し32文字 or UUID 36文字
  if (method === 'PATCH' && /^\/v1\/pages\/[0-9a-fA-F-]{32,36}$/.test(path)) return true;
  const m = path.match(/^\/v1\/databases\/([0-9a-fA-F-]{32,36})\/query$/);
  if (method === 'POST' && m && ALLOWED_DB_IDS.has(normalizeDbId(m[1]))) return true;
  return false;
}

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || '';
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Kakeibo-Key, Notion-Version',
    };

    const origin = request.headers.get('Origin');
    if (origin && origin !== allowedOrigin) {
      return jsonError(403, 'origin not allowed', corsHeaders);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (!env.NOTION_TOKEN || !env.APP_KEY || !allowedOrigin) {
      return jsonError(500, 'server configuration error', corsHeaders);
    }

    const provided = request.headers.get('X-Kakeibo-Key') || '';
    if (!timingSafeEqual(provided, env.APP_KEY)) {
      return jsonError(401, 'unauthorized', corsHeaders);
    }

    const url = new URL(request.url);
    const path = normalizeNotionPath(url.pathname);
    if (!isAllowedPath(request.method, path)) {
      return jsonError(403, 'path not allowed', corsHeaders);
    }

    let bodyText = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      bodyText = await request.text();
    }

    if (request.method === 'POST' && path === '/v1/pages') {
      let parsed;
      try {
        parsed = JSON.parse(bodyText || '{}');
      } catch {
        return jsonError(400, 'invalid json', corsHeaders);
      }
      const parentId = normalizeDbId(parsed?.parent?.database_id);
      if (!ALLOWED_DB_IDS.has(parentId)) {
        return jsonError(403, 'database not allowed', corsHeaders);
      }
    }

    const notionUrl = `https://api.notion.com${path}${url.search}`;
    const notionRes = await fetch(notionUrl, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: bodyText,
    });

    return new Response(await notionRes.text(), {
      status: notionRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
