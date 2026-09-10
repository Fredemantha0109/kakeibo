// Yoko口座の重複削除。(yoko)なし旧名があり、同月に(yoko)ありもあるページをアーカイブする。
// 口座名整理のあと、旧レコードが残ったときに使った。通常運用では使わない。
// PATCH archived:true。実行: KAKEIBO_APP_KEY='...' node delete_duplicates.js

const WORKERS_URL = 'https://kakeibo-notion-proxy.y-furuya0109.workers.dev';
const APP_KEY = process.env.KAKEIBO_APP_KEY || '';
const DB_BALANCES = '353e165e5f8a80268d64ebca79db2f2a';

// Yoko口座の旧名（これらが重複している）
const YOKO_OLD_NAMES = [
  '住信SBI銀行',
  '三菱UFJ銀行',
  'SBI',
  'SGD',
  '三井住友信託銀行',
  '見込COF',
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

async function getAllRecords() {
  let all = [];
  let cursor = null;
  while (true) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const data = await notionFetch(`/databases/${DB_BALANCES}/query`, 'POST', body);
    all = all.concat(data.results);
    if (!data.has_more) break;
    cursor = data.next_cursor;
    await sleep(350);
  }
  return all;
}

async function main() {
  console.log('📦 全レコード取得中...');
  const all = await getAllRecords();
  console.log(`総レコード数: ${all.length}`);

  // レコードをインデックス化
  const recordMap = {}; // key: "ym_口座名" → page_id
  for (const p of all) {
    const ym = p.properties['年月']?.rich_text?.[0]?.plain_text || '';
    const name = p.properties['口座名']?.rich_text?.[0]?.plain_text || '';
    if (ym && name) {
      const key = `${ym}_${name}`;
      if (!recordMap[key]) recordMap[key] = [];
      recordMap[key].push(p.id);
    }
  }

  // 削除対象を特定
  // 条件：旧名(yoko)なし のレコードがあり、かつ新名(yoko)ありのレコードも存在する
  const toDelete = [];
  for (const p of all) {
    const ym = p.properties['年月']?.rich_text?.[0]?.plain_text || '';
    const name = p.properties['口座名']?.rich_text?.[0]?.plain_text || '';

    if (!ym || !name) continue;

    // 旧名かどうか確認（完全一致）
    if (!YOKO_OLD_NAMES.includes(name)) continue;

    // 対応する新名(yoko)ありのレコードが存在するか確認
    const newName = `${name}(yoko)`;
    const newKey = `${ym}_${newName}`;
    if (recordMap[newKey] && recordMap[newKey].length > 0) {
      toDelete.push({ page_id: p.id, ym, name });
    }
  }

  console.log(`\n🗑️  削除対象: ${toDelete.length}件`);
  toDelete.forEach(r => console.log(`  ${r.ym}_${r.name}`));

  if (toDelete.length === 0) {
    console.log('削除対象なし。終了します。');
    return;
  }

  console.log('\n削除開始...');
  let ok = 0, ng = 0;

  for (let i = 0; i < toDelete.length; i++) {
    const { page_id, ym, name } = toDelete[i];
    try {
      // Notion APIではページをアーカイブ（削除）する
      await notionFetch(`/pages/${page_id}`, 'PATCH', {
        archived: true
      });
      ok++;
      console.log(`✅ ${ok}件目: ${ym}_${name} を削除`);
    } catch (e) {
      ng++;
      console.error(`❌ エラー: ${ym}_${name} - ${e.message}`);
    }
    if (i < toDelete.length - 1) await sleep(350);
  }

  console.log(`\n🎉 完了！ 削除:${ok}件 / エラー:${ng}件`);
}

main().catch(console.error);
