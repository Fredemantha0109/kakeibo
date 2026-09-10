// Yoko口座の名前ゆれ修正。旧名（括弧なし）を新名へ PATCH したときに使った（2026-08頃）。
// 年月＋旧口座名＋金額で query し、該当ページの口座名を書き換える。
// 通常運用では使わない。同名・同額があると別ページを更新する危険がある。
// 実行: KAKEIBO_APP_KEY='...' node fix_yoko_names.js

const WORKERS_URL = 'https://kakeibo-notion-proxy.y-furuya0109.workers.dev';
const APP_KEY = process.env.KAKEIBO_APP_KEY || '';
const DB_BALANCES = '353e165e5f8a80268d64ebca79db2f2a';
const SKIP_MONTHS = ["2026-05", "2026-08"];

// 旧名 → 新名マッピング（Yoko口座のみ）
// bulkデータでのYoko口座の金額と照合して特定する
const YOKO_BULK_DATA = [
  {"ym":"2023-11","old":"住信SBI銀行","new":"住信SBI銀行(Yoko)","amount":20000},
  {"ym":"2023-11","old":"三菱UFJ銀行","new":"三菱UFJ銀行(Yoko)","amount":1706494},
  {"ym":"2023-11","old":"三井住友信託銀行","new":"三井住友信託銀行(Yoko)","amount":374909},
  {"ym":"2024-12","old":"住信SBI銀行","new":"住信SBI銀行(Yoko)","amount":86000},
  {"ym":"2024-12","old":"三菱UFJ銀行","new":"三菱UFJ銀行(Yoko)","amount":1985510},
  {"ym":"2024-12","old":"三井住友信託銀行","new":"三井住友信託銀行(Yoko)","amount":908796},
  {"ym":"2025-01","old":"住信SBI銀行","new":"住信SBI銀行(Yoko)","amount":86000},
  {"ym":"2025-01","old":"三菱UFJ銀行","new":"三菱UFJ銀行(Yoko)","amount":1529184},
  {"ym":"2025-01","old":"三井住友信託銀行","new":"三井住友信託銀行(Yoko)","amount":546480},
  {"ym":"2025-02","old":"住信SBI銀行","new":"住信SBI銀行(Yoko)","amount":86000},
  {"ym":"2025-02","old":"三菱UFJ銀行","new":"三菱UFJ銀行(Yoko)","amount":1529184},
  {"ym":"2025-02","old":"三井住友信託銀行","new":"三井住友信託銀行(Yoko)","amount":546480},
  {"ym":"2025-03","old":"住信SBI銀行","new":"住信SBI銀行(Yoko)","amount":86000},
  {"ym":"2025-03","old":"三菱UFJ銀行","new":"三菱UFJ銀行(Yoko)","amount":1471764},
  {"ym":"2025-03","old":"三井住友信託銀行","new":"三井住友信託銀行(Yoko)","amount":466350},
  {"ym":"2025-04","old":"住信SBI銀行","new":"住信SBI銀行(Yoko)","amount":86000},
  {"ym":"2025-04","old":"三菱UFJ銀行","new":"三菱UFJ銀行(Yoko)","amount":1471764},
  {"ym":"2025-04","old":"三井住友信託銀行","new":"三井住友信託銀行(Yoko)","amount":306090},
  {"ym":"2025-06","old":"住信SBI銀行","new":"住信SBI銀行(Yoko)","amount":86000},
  {"ym":"2025-06","old":"三菱UFJ銀行","new":"三菱UFJ銀行(Yoko)","amount":1445274},
  {"ym":"2025-06","old":"三井住友信託銀行","new":"三井住友信託銀行(Yoko)","amount":306900},
  {"ym":"2025-09","old":"住信SBI銀行","new":"住信SBI銀行(Yoko)","amount":0},
  {"ym":"2025-09","old":"三菱UFJ銀行","new":"三菱UFJ銀行(Yoko)","amount":621908},
  {"ym":"2025-09","old":"三井住友信託銀行","new":"三井住友信託銀行(Yoko)","amount":443803},
  {"ym":"2025-10","old":"住信SBI銀行","new":"住信SBI銀行(Yoko)","amount":86381},
  {"ym":"2025-10","old":"三菱UFJ銀行","new":"三菱UFJ銀行(Yoko)","amount":219379},
  {"ym":"2025-10","old":"三井住友信託銀行","new":"三井住友信託銀行(Yoko)","amount":363673},
  {"ym":"2025-11","old":"住信SBI銀行","new":"住信SBI銀行(Yoko)","amount":86381},
  {"ym":"2025-11","old":"三菱UFJ銀行","new":"三菱UFJ銀行(Yoko)","amount":512781},
  {"ym":"2025-11","old":"三井住友信託銀行","new":"三井住友信託銀行(Yoko)","amount":283543},
  {"ym":"2025-12","old":"住信SBI銀行","new":"住信SBI銀行(Yoko)","amount":86381},
  {"ym":"2025-12","old":"三菱UFJ銀行","new":"三菱UFJ銀行(Yoko)","amount":301001},
  {"ym":"2025-12","old":"三井住友信託銀行","new":"三井住友信託銀行(Yoko)","amount":203413},
  {"ym":"2026-01","old":"住信SBI銀行","new":"住信SBI銀行(Yoko)","amount":86381},
  {"ym":"2026-01","old":"三菱UFJ銀行","new":"三菱UFJ銀行(Yoko)","amount":93656},
  {"ym":"2026-01","old":"三井住友信託銀行","new":"三井住友信託銀行(Yoko)","amount":220836},
  {"ym":"2026-02","old":"住信SBI銀行","new":"住信SBI銀行(Yoko)","amount":86381},
  {"ym":"2026-02","old":"三菱UFJ銀行","new":"三菱UFJ銀行(Yoko)","amount":93656},
  {"ym":"2026-02","old":"三井住友信託銀行","new":"三井住友信託銀行(Yoko)","amount":220000},
  {"ym":"2026-04","old":"住信SBI銀行","new":"住信SBI銀行(Yoko)","amount":0},
  {"ym":"2026-04","old":"三菱UFJ銀行","new":"三菱UFJ銀行(Yoko)","amount":130000},
  {"ym":"2026-04","old":"三井住友信託銀行","new":"三井住友信託銀行(Yoko)","amount":60000},
];

// ===== Notion API =====
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

// ===== メイン処理 =====
async function main() {
  if (!APP_KEY) {
    console.error('環境変数 KAKEIBO_APP_KEY が未設定です');
    process.exit(1);
  }
  console.log(`🔧 Yoko口座名修正開始: ${YOKO_BULK_DATA.length}件対象`);

  let ok = 0, ng = 0, notFound = 0;

  for (let i = 0; i < YOKO_BULK_DATA.length; i++) {
    const { ym, old: oldName, new: newName, amount } = YOKO_BULK_DATA[i];

    try {
      // 対象レコードを検索（年月＋旧口座名＋金額で特定）
      const res = await notionFetch(`/databases/${DB_BALANCES}/query`, 'POST', {
        filter: {
          and: [
            { property: '年月', rich_text: { equals: ym } },
            { property: '口座名', rich_text: { equals: oldName } },
            { property: '残高', number: { equals: amount } }
          ]
        }
      });

      if (res.results.length === 0) {
        notFound++;
        console.log(`⚠️  見つからず: ${ym}_${oldName} ¥${amount.toLocaleString()}`);
      } else {
        const pageId = res.results[0].id;
        const key = `${ym}_${newName}`;

        // 口座名と名前を更新
        await notionFetch(`/pages/${pageId}`, 'PATCH', {
          properties: {
            '名前': { title: [{ text: { content: key } }] },
            '口座名': { rich_text: [{ text: { content: newName } }] }
          }
        });

        ok++;
        console.log(`✅ ${ok}件目: ${ym} ${oldName} → ${newName}`);
      }
    } catch (e) {
      ng++;
      console.error(`❌ エラー: ${ym}_${oldName} - ${e.message}`);
    }

    if (i < YOKO_BULK_DATA.length - 1) await sleep(350);
  }

  console.log(`\n🎉 完了！ 成功:${ok}件 / 見つからず:${notFound}件 / エラー:${ng}件`);
}

main().catch(console.error);
