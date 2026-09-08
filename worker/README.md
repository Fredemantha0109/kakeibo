# kakeibo-notion-proxy

家計簿アプリ (`kakeibo.html`) 専用の Notion API プロキシ（Cloudflare Workers）。

## 何をしているか

`{WORKERS_URL}/notion/databases/xxx/query` のようなリクエストを受け、
`/notion` を取り除いて `https://api.notion.com/v1/...` に中継するだけ。
CORS ヘッダーを付けて返すので、ブラウザから直接 Notion を読み書きできる。

トークンは Worker 側では持たない。クライアント（kakeibo.html）が
`Authorization: Bearer ntn_...` を毎回送る。ヘッダーが無ければ 401。

## 経緯

2026-05 にダッシュボードで直接作成したため、`blue-cake-9a3b` という
自動生成名のままだった。2026-09 に名前を付け直し、ソースをここに置いた。
ロジックは当時のまま（挙動を変えない方針）。

## デプロイ

```
cd worker
npx wrangler deploy
```

デプロイ後、`kakeibo.html` の `WORKERS_URL` を新しい URL に更新すること。

## 関連

`~/src/spring-ark-home/worker-notion/` の `notion-proxy` は別物。
あちらは Worker 側 secret にトークンを持ち、オリジンを許可リストで限定する設計。
