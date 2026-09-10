# kakeibo-notion-proxy

家計簿アプリ (`kakeibo.html`) 専用の Notion API プロキシ（Cloudflare Workers）。

## 何をしているか

ブラウザは合言葉だけを `X-Kakeibo-Key` で送る。Worker が `NOTION_TOKEN` を付けて
`https://api.notion.com` へ転送する。許可オリジン・許可パス以外は拒否する。

## Cloudflare で設定する環境変数（値は書かない）

| 名前 | 型 | 用途 |
|---|---|---|
| `NOTION_TOKEN` | シークレット | Notion のアクセストークン。Worker だけが持つ |
| `APP_KEY` | シークレット | アプリの合言葉（24文字程度のランダム文字列を想定） |
| `ALLOWED_ORIGIN` | 通常の変数 | 許可する Origin。本番は GitHub Pages のオリジン |

## 経緯

2026-05 にダッシュボードで直接作成したため、`blue-cake-9a3b` という
自動生成名のままだった。2026-09 に `kakeibo-notion-proxy` へ名前を付け直し、
ソースをここに置いた。その後、トークンをブラウザに置かない構成へ切り替えた。

`kakeibo.html` が向いているのは `kakeibo-notion-proxy`。旧 `blue-cake-9a3b` は
リポジトリからは参照していない。

## デプロイ

```
cd worker
npx wrangler deploy
```

または Cloudflare ダッシュボードに `src/index.js` を貼る。
