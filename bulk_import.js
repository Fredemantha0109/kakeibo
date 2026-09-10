// 過去データ（263件・14ヶ月分）の初回一括インポート。2026-05頃に使った。
// 月次残高DBを query し、既存があればスキップ、無ければ POST /pages する。
// 通常の月次入力・過去一括入力画面では使わない。再実行は重複注意。
// 実行: KAKEIBO_APP_KEY='...' node bulk_import.js

const WORKERS_URL = 'https://kakeibo-notion-proxy.y-furuya0109.workers.dev';
const APP_KEY = process.env.KAKEIBO_APP_KEY || '';
const DB_BALANCES = '353e165e5f8a80268d64ebca79db2f2a';

// ===== 過去データ（263件・14ヶ月分）=====
const DATA = [
  {"ym":"2023-11","name":"SBI（外貨）","amount":576682},
  {"ym":"2023-11","name":"セゾン投信","amount":4923733},
  {"ym":"2023-11","name":"外貨預金","amount":58016},
  {"ym":"2023-11","name":"ひふみ","amount":1872508},
  {"ym":"2023-11","name":"楽天銀行","amount":203949},
  {"ym":"2023-11","name":"SBI（国内）","amount":771237},
  {"ym":"2023-11","name":"三菱UFJ銀行","amount":152692},
  {"ym":"2023-11","name":"住信SBI銀行","amount":514961},
  {"ym":"2023-11","name":"みずほ銀行","amount":3260326},
  {"ym":"2023-11","name":"Bitcoin","amount":254586},
  {"ym":"2023-11","name":"住信SBI銀行(yoko)","amount":20000},
  {"ym":"2023-11","name":"三井住友信託銀行(yoko)","amount":374909},
  {"ym":"2023-11","name":"三菱UFJ銀行(yoko)","amount":1706494},
  {"ym":"2023-11","name":"SBI(yoko)","amount":1200000},
  {"ym":"2024-12","name":"セゾン投信","amount":5175903},
  {"ym":"2024-12","name":"住信SBI銀行","amount":1832476},
  {"ym":"2024-12","name":"SBI（外貨）","amount":720000},
  {"ym":"2024-12","name":"SBI（国内）","amount":700000},
  {"ym":"2024-12","name":"三菱UFJ銀行","amount":870000},
  {"ym":"2024-12","name":"外貨預金","amount":73405},
  {"ym":"2024-12","name":"ひふみ","amount":2482812},
  {"ym":"2024-12","name":"楽天銀行","amount":20000},
  {"ym":"2024-12","name":"みずほ銀行","amount":0},
  {"ym":"2024-12","name":"三菱UFJ銀行(yoko)","amount":1985510},
  {"ym":"2024-12","name":"SBI(yoko)","amount":0},
  {"ym":"2024-12","name":"三井住友信託銀行(yoko)","amount":908796},
  {"ym":"2024-12","name":"住信SBI銀行(yoko)","amount":86000},
  {"ym":"2024-12","name":"Bitcoin","amount":660000},
  {"ym":"2024-12","name":"SGD(yoko)","amount":2760540},
  {"ym":"2024-12","name":"新生銀行","amount":500000},
  {"ym":"2024-12","name":"メルカリ","amount":130000},
  {"ym":"2024-12","name":"Paypay","amount":200000},
  {"ym":"2025-01","name":"住信SBI銀行","amount":844538},
  {"ym":"2025-01","name":"SBI（外貨）","amount":719911},
  {"ym":"2025-01","name":"SBI（国内）","amount":363220},
  {"ym":"2025-01","name":"三菱UFJ銀行","amount":402131},
  {"ym":"2025-01","name":"外貨預金","amount":0},
  {"ym":"2025-01","name":"楽天銀行","amount":184946},
  {"ym":"2025-01","name":"ひふみ","amount":2538056},
  {"ym":"2025-01","name":"三菱UFJ銀行(yoko)","amount":1529184},
  {"ym":"2025-01","name":"みずほ銀行","amount":0},
  {"ym":"2025-01","name":"SBI(yoko)","amount":0},
  {"ym":"2025-01","name":"三井住友信託銀行(yoko)","amount":546480},
  {"ym":"2025-01","name":"住信SBI銀行(yoko)","amount":86000},
  {"ym":"2025-01","name":"Bitcoin","amount":587225},
  {"ym":"2025-01","name":"Paypay","amount":220000},
  {"ym":"2025-01","name":"メルカリ","amount":74647},
  {"ym":"2025-01","name":"新生銀行","amount":346961},
  {"ym":"2025-01","name":"SGD(yoko)","amount":4195400},
  {"ym":"2025-01","name":"セゾン投信","amount":6491535},
  {"ym":"2025-02","name":"セゾン投信","amount":6455066},
  {"ym":"2025-02","name":"住信SBI銀行","amount":491763},
  {"ym":"2025-02","name":"SBI（外貨）","amount":685046},
  {"ym":"2025-02","name":"SBI（国内）","amount":345893},
  {"ym":"2025-02","name":"三菱UFJ銀行","amount":401988},
  {"ym":"2025-02","name":"外貨預金","amount":0},
  {"ym":"2025-02","name":"ひふみ","amount":2405219},
  {"ym":"2025-02","name":"楽天銀行","amount":17269},
  {"ym":"2025-02","name":"みずほ銀行","amount":0},
  {"ym":"2025-02","name":"三菱UFJ銀行(yoko)","amount":1529184},
  {"ym":"2025-02","name":"SBI(yoko)","amount":0},
  {"ym":"2025-02","name":"三井住友信託銀行(yoko)","amount":546480},
  {"ym":"2025-02","name":"住信SBI銀行(yoko)","amount":86000},
  {"ym":"2025-02","name":"Bitcoin","amount":510292},
  {"ym":"2025-02","name":"Paypay","amount":164229},
  {"ym":"2025-02","name":"メルカリ","amount":29647},
  {"ym":"2025-02","name":"新生銀行","amount":795950},
  {"ym":"2025-02","name":"SGD(yoko)","amount":3383380},
  {"ym":"2025-03","name":"セゾン投信","amount":6320221},
  {"ym":"2025-03","name":"住信SBI銀行","amount":1483623},
  {"ym":"2025-03","name":"SBI（外貨）","amount":625330},
  {"ym":"2025-03","name":"SBI（国内）","amount":308333},
  {"ym":"2025-03","name":"三菱UFJ銀行","amount":401988},
  {"ym":"2025-03","name":"外貨預金","amount":0},
  {"ym":"2025-03","name":"ひふみ","amount":2243990},
  {"ym":"2025-03","name":"楽天銀行","amount":17769},
  {"ym":"2025-03","name":"みずほ銀行","amount":0},
  {"ym":"2025-03","name":"三菱UFJ銀行(yoko)","amount":1471764},
  {"ym":"2025-03","name":"SBI(yoko)","amount":0},
  {"ym":"2025-03","name":"三井住友信託銀行(yoko)","amount":466350},
  {"ym":"2025-03","name":"住信SBI銀行(yoko)","amount":86000},
  {"ym":"2025-03","name":"Bitcoin","amount":466697},
  {"ym":"2025-03","name":"Paypay","amount":100799},
  {"ym":"2025-03","name":"メルカリ","amount":29647},
  {"ym":"2025-03","name":"新生銀行","amount":454987},
  {"ym":"2025-03","name":"SGD(yoko)","amount":2980000},
  {"ym":"2025-04","name":"セゾン投信","amount":6613112},
  {"ym":"2025-04","name":"住信SBI銀行","amount":1563075},
  {"ym":"2025-04","name":"SBI（外貨）","amount":666348},
  {"ym":"2025-04","name":"SBI（国内）","amount":327258},
  {"ym":"2025-04","name":"三菱UFJ銀行","amount":556593},
  {"ym":"2025-04","name":"外貨預金","amount":0},
  {"ym":"2025-04","name":"ひふみ","amount":2385308},
  {"ym":"2025-04","name":"楽天銀行","amount":2013},
  {"ym":"2025-04","name":"みずほ銀行","amount":0},
  {"ym":"2025-04","name":"三菱UFJ銀行(yoko)","amount":1471764},
  {"ym":"2025-04","name":"SBI(yoko)","amount":0},
  {"ym":"2025-04","name":"三井住友信託銀行(yoko)","amount":306090},
  {"ym":"2025-04","name":"住信SBI銀行(yoko)","amount":86000},
  {"ym":"2025-04","name":"Bitcoin","amount":491973},
  {"ym":"2025-04","name":"Paypay","amount":138633},
  {"ym":"2025-04","name":"メルカリ","amount":29647},
  {"ym":"2025-04","name":"新生銀行","amount":453978},
  {"ym":"2025-04","name":"SGD(yoko)","amount":3705680},
  {"ym":"2025-06","name":"SGD(yoko)","amount":4112170},
  {"ym":"2025-06","name":"セゾン投信","amount":6951536},
  {"ym":"2025-06","name":"住信SBI銀行","amount":1300142},
  {"ym":"2025-06","name":"SBI（外貨）","amount":675859},
  {"ym":"2025-06","name":"SBI（国内）","amount":332875},
  {"ym":"2025-06","name":"三菱UFJ銀行","amount":56373},
  {"ym":"2025-06","name":"外貨預金","amount":0},
  {"ym":"2025-06","name":"ひふみ","amount":2487943},
  {"ym":"2025-06","name":"楽天銀行","amount":5773},
  {"ym":"2025-06","name":"みずほ銀行","amount":0},
  {"ym":"2025-06","name":"三菱UFJ銀行(yoko)","amount":1445274},
  {"ym":"2025-06","name":"SBI(yoko)","amount":0},
  {"ym":"2025-06","name":"三井住友信託銀行(yoko)","amount":306900},
  {"ym":"2025-06","name":"住信SBI銀行(yoko)","amount":86000},
  {"ym":"2025-06","name":"Bitcoin","amount":558528},
  {"ym":"2025-06","name":"Paypay","amount":174682},
  {"ym":"2025-06","name":"メルカリ","amount":29647},
  {"ym":"2025-06","name":"新生銀行","amount":2997},
  {"ym":"2025-09","name":"SBI（国内）","amount":334653},
  {"ym":"2025-09","name":"三菱UFJ銀行","amount":197646},
  {"ym":"2025-09","name":"外貨預金","amount":0},
  {"ym":"2025-09","name":"ひふみ","amount":2709558},
  {"ym":"2025-09","name":"楽天銀行","amount":2377},
  {"ym":"2025-09","name":"みずほ銀行","amount":0},
  {"ym":"2025-09","name":"三菱UFJ銀行(yoko)","amount":621908},
  {"ym":"2025-09","name":"SBI(yoko)","amount":0},
  {"ym":"2025-09","name":"三井住友信託銀行(yoko)","amount":443803},
  {"ym":"2025-09","name":"住信SBI銀行(yoko)","amount":0},
  {"ym":"2025-09","name":"SGD(yoko)","amount":2834770},
  {"ym":"2025-09","name":"セゾン投信","amount":6909141},
  {"ym":"2025-09","name":"住信SBI銀行","amount":613888},
  {"ym":"2025-09","name":"SBI（外貨）","amount":738080},
  {"ym":"2025-09","name":"新生銀行","amount":449929},
  {"ym":"2025-09","name":"メルカリ","amount":29647},
  {"ym":"2025-09","name":"Paypay","amount":213873},
  {"ym":"2025-09","name":"Bitcoin","amount":710471},
  {"ym":"2025-10","name":"外貨預金","amount":0},
  {"ym":"2025-10","name":"住信SBI銀行","amount":345652},
  {"ym":"2025-10","name":"Bitcoin","amount":779281},
  {"ym":"2025-10","name":"三菱UFJ銀行","amount":1197646},
  {"ym":"2025-10","name":"SBI（外貨）","amount":738080},
  {"ym":"2025-10","name":"ひふみ","amount":2868012},
  {"ym":"2025-10","name":"みずほ銀行","amount":0},
  {"ym":"2025-10","name":"セゾン投信","amount":6267213},
  {"ym":"2025-10","name":"楽天銀行","amount":1697},
  {"ym":"2025-10","name":"SBI（国内）","amount":345603},
  {"ym":"2025-10","name":"Paypay","amount":256336},
  {"ym":"2025-10","name":"SBI(yoko)","amount":0},
  {"ym":"2025-10","name":"三菱UFJ銀行(yoko)","amount":219379},
  {"ym":"2025-10","name":"住信SBI銀行(yoko)","amount":86381},
  {"ym":"2025-10","name":"SGD(yoko)","amount":3097084},
  {"ym":"2025-10","name":"メルカリ","amount":29647},
  {"ym":"2025-10","name":"三井住友信託銀行(yoko)","amount":363673},
  {"ym":"2025-10","name":"新生銀行","amount":684},
  {"ym":"2025-11","name":"楽天銀行","amount":205},
  {"ym":"2025-11","name":"SBI（国内）","amount":333623},
  {"ym":"2025-11","name":"Bitcoin","amount":630615},
  {"ym":"2025-11","name":"みずほ銀行","amount":0},
  {"ym":"2025-11","name":"住信SBI銀行","amount":766115},
  {"ym":"2025-11","name":"外貨預金","amount":0},
  {"ym":"2025-11","name":"ひふみ","amount":2910806},
  {"ym":"2025-11","name":"SBI（外貨）","amount":790276},
  {"ym":"2025-11","name":"セゾン投信","amount":5673066},
  {"ym":"2025-11","name":"三菱UFJ銀行","amount":639426},
  {"ym":"2025-11","name":"Paypay","amount":261395},
  {"ym":"2025-11","name":"SBI(yoko)","amount":0},
  {"ym":"2025-11","name":"三菱UFJ銀行(yoko)","amount":512781},
  {"ym":"2025-11","name":"住信SBI銀行(yoko)","amount":86381},
  {"ym":"2025-11","name":"SGD(yoko)","amount":2479000},
  {"ym":"2025-11","name":"メルカリ","amount":29647},
  {"ym":"2025-11","name":"三井住友信託銀行(yoko)","amount":283543},
  {"ym":"2025-11","name":"新生銀行","amount":449636},
  {"ym":"2025-12","name":"セゾン投信","amount":4712054},
  {"ym":"2025-12","name":"SBI（外貨）","amount":818458},
  {"ym":"2025-12","name":"みずほ銀行","amount":0},
  {"ym":"2025-12","name":"三菱UFJ銀行","amount":103119},
  {"ym":"2025-12","name":"三菱UFJ銀行(yoko)","amount":301001},
  {"ym":"2025-12","name":"SBI（国内）","amount":332433},
  {"ym":"2025-12","name":"住信SBI銀行","amount":912990},
  {"ym":"2025-12","name":"住信SBI銀行(yoko)","amount":86381},
  {"ym":"2025-12","name":"ひふみ","amount":2975885},
  {"ym":"2025-12","name":"Bitcoin","amount":557119},
  {"ym":"2025-12","name":"楽天銀行","amount":23799},
  {"ym":"2025-12","name":"外貨預金","amount":0},
  {"ym":"2025-12","name":"Paypay","amount":274035},
  {"ym":"2025-12","name":"SBI(yoko)","amount":0},
  {"ym":"2025-12","name":"SGD(yoko)","amount":4481101},
  {"ym":"2025-12","name":"メルカリ","amount":29647},
  {"ym":"2025-12","name":"三井住友信託銀行(yoko)","amount":203413},
  {"ym":"2025-12","name":"新生銀行","amount":449000},
  {"ym":"2026-01","name":"セゾン投信","amount":4916743},
  {"ym":"2026-01","name":"新生銀行","amount":898029},
  {"ym":"2026-01","name":"三井住友信託銀行(yoko)","amount":220836},
  {"ym":"2026-01","name":"メルカリ","amount":29647},
  {"ym":"2026-01","name":"SGD(yoko)","amount":3249480},
  {"ym":"2026-01","name":"SBI(yoko)","amount":0},
  {"ym":"2026-01","name":"Paypay","amount":268756},
  {"ym":"2026-01","name":"外貨預金","amount":0},
  {"ym":"2026-01","name":"楽天銀行","amount":1740},
  {"ym":"2026-01","name":"Bitcoin","amount":589440},
  {"ym":"2026-01","name":"ひふみ","amount":2999410},
  {"ym":"2026-01","name":"住信SBI銀行(yoko)","amount":86381},
  {"ym":"2026-01","name":"住信SBI銀行","amount":190026},
  {"ym":"2026-01","name":"SBI（国内）","amount":330663},
  {"ym":"2026-01","name":"三菱UFJ銀行(yoko)","amount":93656},
  {"ym":"2026-01","name":"三菱UFJ銀行","amount":103119},
  {"ym":"2026-01","name":"みずほ銀行","amount":0},
  {"ym":"2026-01","name":"SBI（外貨）","amount":825149},
  {"ym":"2026-01","name":"見込COF","amount":-600000},
  {"ym":"2026-02","name":"セゾン投信","amount":3273008},
  {"ym":"2026-02","name":"SBI（外貨）","amount":831551},
  {"ym":"2026-02","name":"新生銀行","amount":449002},
  {"ym":"2026-02","name":"みずほ銀行","amount":0},
  {"ym":"2026-02","name":"三菱UFJ銀行","amount":105507},
  {"ym":"2026-02","name":"三菱UFJ銀行(yoko)","amount":93656},
  {"ym":"2026-02","name":"SBI（国内）","amount":228680},
  {"ym":"2026-02","name":"住信SBI銀行","amount":1570850},
  {"ym":"2026-02","name":"住信SBI銀行(yoko)","amount":86381},
  {"ym":"2026-02","name":"ひふみ","amount":3221484},
  {"ym":"2026-02","name":"Bitcoin","amount":450931},
  {"ym":"2026-02","name":"楽天銀行","amount":1984},
  {"ym":"2026-02","name":"外貨預金","amount":4},
  {"ym":"2026-02","name":"Paypay","amount":264775},
  {"ym":"2026-02","name":"SBI(yoko)","amount":0},
  {"ym":"2026-02","name":"SGD(yoko)","amount":3687840},
  {"ym":"2026-02","name":"メルカリ","amount":29647},
  {"ym":"2026-02","name":"見込COF","amount":-1360000},
  {"ym":"2026-02","name":"三井住友信託銀行(yoko)","amount":220000},
  {"ym":"2026-02","name":"JRE BANK","amount":50047},
  {"ym":"2026-02","name":"WAON","amount":409},
  {"ym":"2026-02","name":"楽天ポイント","amount":22823},
  {"ym":"2026-02","name":"三井住友信託投資信託","amount":0},
  {"ym":"2026-02","name":"Marriott","amount":229248},
  {"ym":"2026-02","name":"Amazon","amount":577},
  {"ym":"2026-04","name":"セゾン投信","amount":2610836},
  {"ym":"2026-04","name":"SBI（外貨）","amount":852081},
  {"ym":"2026-04","name":"新生銀行","amount":1},
  {"ym":"2026-04","name":"みずほ銀行","amount":0},
  {"ym":"2026-04","name":"三菱UFJ銀行","amount":60084},
  {"ym":"2026-04","name":"三菱UFJ銀行(yoko)","amount":130000},
  {"ym":"2026-04","name":"SBI（国内）","amount":236112},
  {"ym":"2026-04","name":"住信SBI銀行","amount":501784},
  {"ym":"2026-04","name":"住信SBI銀行(yoko)","amount":0},
  {"ym":"2026-04","name":"ひふみ","amount":3300167},
  {"ym":"2026-04","name":"Bitcoin","amount":437233},
  {"ym":"2026-04","name":"楽天銀行","amount":56956},
  {"ym":"2026-04","name":"外貨預金","amount":4},
  {"ym":"2026-04","name":"Amazon","amount":181},
  {"ym":"2026-04","name":"JRE BANK","amount":49597},
  {"ym":"2026-04","name":"Marriott","amount":250621},
  {"ym":"2026-04","name":"Paypay","amount":255540},
  {"ym":"2026-04","name":"SBI(yoko)","amount":0},
  {"ym":"2026-04","name":"SGD(yoko)","amount":4728000},
  {"ym":"2026-04","name":"WAON","amount":413},
  {"ym":"2026-04","name":"メルカリ","amount":29647},
  {"ym":"2026-04","name":"楽天ポイント","amount":24102},
  {"ym":"2026-04","name":"見込COF","amount":0},
  {"ym":"2026-04","name":"三井住友信託銀行(yoko)","amount":60000},
  {"ym":"2026-04","name":"三井住友信託投資信託","amount":0}
];

// ===== Notion API (https module for Node.js compatibility) =====
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
  console.log(`📦 書き込み開始: ${DATA.length}件・14ヶ月分`);

  let ok = 0, ng = 0, skip = 0;

  for (let i = 0; i < DATA.length; i++) {
    const { ym, name, amount } = DATA[i];
    const key = `${ym}_${name}`;

    try {
      // 既存チェック
      const existing = await notionFetch(`/databases/${DB_BALANCES}/query`, 'POST', {
        filter: {
          and: [
            { property: '年月', rich_text: { equals: ym } },
            { property: '口座名', rich_text: { equals: name } }
          ]
        }
      });

      if (existing.results.length > 0) {
        // 既存あり → スキップ
        skip++;
        console.log(`⏭  スキップ: ${key}`);
      } else {
        // 新規作成
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
      }
    } catch (e) {
      ng++;
      console.error(`❌ エラー: ${key} - ${e.message}`);
    }

    // レート制限対策: 350ms待機
    if (i < DATA.length - 1) await sleep(350);
  }

  console.log(`\n🎉 完了！ 成功:${ok}件 / スキップ:${skip}件 / エラー:${ng}件`);
}

main().catch(console.error);