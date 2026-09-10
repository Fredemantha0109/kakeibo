// Yuichiro口座（住信SBI銀行・三菱UFJ銀行）の残高を月次残高DBへ再登録する。
// 2026-08、口座名整理の事故でYuichiro分が消えたあとの復旧に使った。再発時に必要。
// 既存チェックはしない。同じキーのページが既にあると重複する。
// 実行: KAKEIBO_APP_KEY='...' node restore_yuichiro.js

const WORKERS_URL = 'https://kakeibo-notion-proxy.y-furuya0109.workers.dev';
const APP_KEY = process.env.KAKEIBO_APP_KEY || '';
const DB_BALANCES = '353e165e5f8a80268d64ebca79db2f2a';

const DATA = [
  {"ym":"2023-11","name":"住信SBI銀行","amount":514961},
  {"ym":"2024-12","name":"住信SBI銀行","amount":1832476},
  {"ym":"2024-12","name":"三菱UFJ銀行","amount":870000},
  {"ym":"2025-01","name":"住信SBI銀行","amount":844538},
  {"ym":"2025-01","name":"三菱UFJ銀行","amount":402131},
  {"ym":"2025-02","name":"住信SBI銀行","amount":491763},
  {"ym":"2025-02","name":"三菱UFJ銀行","amount":401988},
  {"ym":"2025-03","name":"住信SBI銀行","amount":1483623},
  {"ym":"2025-03","name":"三菱UFJ銀行","amount":401988},
  {"ym":"2025-04","name":"住信SBI銀行","amount":1563075},
  {"ym":"2025-04","name":"三菱UFJ銀行","amount":556593},
  {"ym":"2025-06","name":"住信SBI銀行","amount":1300142},
  {"ym":"2025-06","name":"三菱UFJ銀行","amount":56373},
  {"ym":"2025-09","name":"住信SBI銀行","amount":613888},
  {"ym":"2025-09","name":"三菱UFJ銀行","amount":197646},
  {"ym":"2025-10","name":"住信SBI銀行","amount":345652},
  {"ym":"2025-10","name":"三菱UFJ銀行","amount":1197646},
  {"ym":"2025-11","name":"住信SBI銀行","amount":766115},
  {"ym":"2025-11","name":"三菱UFJ銀行","amount":639426},
  {"ym":"2025-12","name":"住信SBI銀行","amount":912990},
  {"ym":"2025-12","name":"三菱UFJ銀行","amount":103119},
  {"ym":"2026-01","name":"住信SBI銀行","amount":190026},
  {"ym":"2026-01","name":"三菱UFJ銀行","amount":103119},
  {"ym":"2026-02","name":"住信SBI銀行","amount":1570850},
  {"ym":"2026-02","name":"三菱UFJ銀行","amount":105507},
  {"ym":"2026-04","name":"住信SBI銀行","amount":501784},
  {"ym":"2026-04","name":"三菱UFJ銀行","amount":60084},
];

const https = require('https');

function notionFetch(path, method = 'GET', body = null) {
  if (!APP_KEY) {
    return Promise.reject(new Error('環境変数 KAKEIBO_APP_KEY が未設定です'));
  }
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const url = new URL(`${WORKERS_URL}/notion/v1${path}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'X-Kakeibo-Key': APP_KEY,
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  if (!APP_KEY) {
    console.error('環境変数 KAKEIBO_APP_KEY が未設定です');
    process.exit(1);
  }
  console.log(`📦 Yuichiro口座再登録開始: ${DATA.length}件`);

  let ok = 0, ng = 0;

  for (let i = 0; i < DATA.length; i++) {
    const { ym, name, amount } = DATA[i];
    const key = `${ym}_${name}`;

    try {
      await notionFetch('/pages', 'POST', {
        parent: { database_id: DB_BALANCES },
        properties: {
          '名前': { title: [{ text: { content: key } }] },
          '年月': { rich_text: [{ text: { content: ym } }] },
          '口座名': { rich_text: [{ text: { content: name } }] },
          '残高': { number: amount }
        }
      });
      ok++;
      console.log(`✅ ${ok}件目: ${key} ¥${amount.toLocaleString()}`);
    } catch (e) {
      ng++;
      console.error(`❌ エラー: ${key} - ${e.message}`);
    }

    if (i < DATA.length - 1) await sleep(350);
  }

  console.log(`\n🎉 完了！ 成功:${ok}件 / エラー:${ng}件`);
}

main().catch(console.error);
