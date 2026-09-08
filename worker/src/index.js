/**
 * Notion API プロキシ (kakeibo-notion-proxy)
 *
 * 家計簿アプリ (kakeibo.html) のブラウザ側から Notion API を叩くための中継。
 * ブラウザから api.notion.com を直接呼ぶと CORS で弾かれるため存在する。
 *
 * 経緯:
 *   2026-05、Cloudflare ダッシュボードで名前を付けずに作成したため
 *   `blue-cake-9a3b` という自動生成名のまま運用されていた。
 *   2026-09、名前を付け直してソースをリポジトリ管理下に移した。
 *   ロジックは当時のものをそのまま引き継いでいる（挙動を変えないため）。
 *
 * 設計上の注意:
 *   Spring ARK Home の notion-proxy とは方針が違う。
 *   - あちら: Worker 側の secret にトークンを持ち、オリジンを許可リストで限定
 *   - こちら: トークンはクライアントが Authorization ヘッダーで毎回送る
 *             （kakeibo.html が localStorage に保持）。Worker はトークンを
 *             持たないので、CORS を * にしても他人が勝手に読み書きはできない。
 *   両者を統一する場合は kakeibo.html のトークン入力 UI ごと作り直しになる。
 */

export default {
  async fetch(request, env, ctx) {
    // CORSヘッダー
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // OPTIONSリクエスト（プリフライト）への対応
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // リクエストURLからNotion APIのパスを取得
    const url = new URL(request.url);
    const notionPath = url.pathname.replace('/notion', '');
    const notionUrl = `https://api.notion.com/v1${notionPath}${url.search}`;

    // Authorizationヘッダーをそのまま転送
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Notion APIにリクエストを転送
    const notionRequest = new Request(notionUrl, {
      method: request.method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: request.method !== 'GET' ? request.body : undefined,
    });

    const notionResponse = await fetch(notionRequest);
    const data = await notionResponse.text();

    return new Response(data, {
      status: notionResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  },
};
