#!/usr/bin/env node

/**
 * CVE 严重程度批量分类脚本
 *
 * 用法:
 *   node scripts/classify-cve.js --key YOUR_API_KEY
 *   node scripts/classify-cve.js --key YOUR_API_KEY --year 2025
 *   node scripts/classify-cve.js --key YOUR_API_KEY --year 2025 --limit 30
 *   node scripts/classify-cve.js --key YOUR_API_KEY --url https://api.example.com/v1 --model gpt-4o
 *
 * 输出: cve_repo/classified.json
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

// ─── 配置 ───────────────────────────────────────────────
const CVE_REPO = path.join(__dirname, '../cve_repo');
const OUTPUT_FILE = path.join(CVE_REPO, 'classified.json');
const BATCH_SIZE = 5;
const DELAY_MS = 1500;
const MAX_RETRIES = 2;
const DEFAULT_LIMIT = 30;

// ─── 解析命令行参数 ──────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { year: null, limit: DEFAULT_LIMIT, key: 'tp-cne376ngywmc1jadq27iclc3a09bnzxpd2syq8z0ize70hq6', url: 'https://token-plan-cn.xiaomimimo.com/v1', model: 'mimo-v2.5' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--key' && args[i + 1]) opts.key = args[++i];
    if (args[i] === '--year' && args[i + 1]) opts.year = args[++i];
    if (args[i] === '--limit' && args[i + 1]) opts.limit = Math.min(parseInt(args[++i], 10), 200);
    if (args[i] === '--url' && args[i + 1]) opts.url = args[++i];
    if (args[i] === '--model' && args[i + 1]) opts.model = args[++i];
  }
  return opts;
}

// ─── 简易 HTTP 请求（避免依赖 axios）────────────────────
function request(url, body, apiKey) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const mod = urlObj.protocol === 'https:' ? https : http;
    const data = JSON.stringify(body);

    const req = mod.request(urlObj, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 60000,
    }, (res) => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(chunks));
        } catch {
          reject(new Error('响应解析失败: ' + chunks.substring(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
    req.write(data);
    req.end();
  });
}

// ─── 扫描文件列表 ────────────────────────────────────────
async function getFiles(yearFilter) {
  const years = yearFilter ? [String(yearFilter)] : await fs.readdir(CVE_REPO);
  let allFiles = [];
  for (const year of years) {
    const yearPath = path.join(CVE_REPO, year);
    try {
      const stat = await fs.stat(yearPath);
      if (!stat.isDirectory()) continue;
      const files = await fs.readdir(yearPath);
      for (const f of files) {
        if (f.endsWith('.md')) {
          allFiles.push({ id: f.replace('.md', ''), year, path: path.join(year, f) });
        }
      }
    } catch { /* skip */ }
  }
  allFiles.sort((a, b) => b.year.localeCompare(a.year) || b.id.localeCompare(a.id));
  return allFiles;
}

// ─── 提取关键信息（只保留对分类有用的字段）─────────────────
function extractInfo(content) {
  const id = (content.match(/### \[(.*?)\]/) || [])[1] || 'Unknown';
  const product = ((content.match(/Product&message=(.*?)&/) || [])[1] || '');
  const version = ((content.match(/Version&message=(.*?)&/) || [])[1] || '');
  const cwe = ((content.match(/Vulnerability&message=(.*?)&/) || [])[1] || '');
  const descMatch = content.match(/### Description\s+([\s\S]*?)(?=\s+###|$)/);
  const description = descMatch ? descMatch[1].trim() : '';
  return {
    id,
    product: decodeURIComponent(product),
    version: decodeURIComponent(version),
    cwe: decodeURIComponent(cwe),
    description,
  };
}

// ─── AI 分类 ─────────────────────────────────────────────
async function classifyBatch(items, opts) {
  const list = items.map((item, i) =>
    `${i + 1}. ${item.id}: ${item.description}`
  ).join('\n\n');

  const prompt = `对以下CVE漏洞按严重程度分类，只根据Description判断。

- Critical: 无需认证的RCE、系统级权限提升、广泛影响的关键基础设施漏洞
- High: 需要条件的RCE、认证后权限提升、SQL注入、命令注入等
- Medium: 需要认证才能利用、信息泄露、本地权限提升、XSS等

严格返回JSON，不要其他文字：
{"results":[{"id":"CVE-XXXX-XXXXX","severity":"Critical|High|Medium"}]}

${list}`;

  const resp = await request(`${opts.url}/chat/completions`, {
    model: opts.model,
    messages: [
      { role: 'system', content: '你是网络安全漏洞分析专家，只返回JSON格式的分类结果。' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 4000,
  }, opts.key);

  const text = resp.choices?.[0]?.message?.content || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI 返回格式错误: ' + text.substring(0, 200));
  return JSON.parse(jsonMatch[0]);
}

// ─── 加载已有结果 ────────────────────────────────────────
async function loadExisting() {
  try { return JSON.parse(await fs.readFile(OUTPUT_FILE, 'utf-8')); }
  catch { return {}; }
}

// ─── 主流程 ──────────────────────────────────────────────
async function main() {
  const opts = parseArgs();

  if (!opts.key) {
    console.error('❌ 请提供 API Key: node scripts/classify-cve.js --key YOUR_API_KEY');
    console.error('   可选参数: --year 2025 --limit 30 --url https://api.example.com/v1 --model model-name');
    process.exit(1);
  }

  console.log('📂 扫描 cve_repo ...');
  let files = await getFiles(opts.year);
  files = files.slice(0, opts.limit);
  console.log(`📋 共 ${files.length} 个文件待处理`);
  console.log(`🤖 模型: ${opts.model} | API: ${opts.url}`);
  console.log('─'.repeat(50));

  const results = await loadExisting();
  const doneSet = new Set(Object.keys(results));
  const pending = files.filter(f => !doneSet.has(f.id));

  if (pending.length === 0) {
    console.log('✅ 所有文件已处理');
    printStats(results);
    return;
  }

  console.log(`🔄 已有 ${doneSet.size} 条，剩余 ${pending.length} 条`);
  console.log('─'.repeat(50));

  let processed = 0, failed = 0;
  const t0 = Date.now();

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const items = [];
    for (const file of batch) {
      try {
        const content = await fs.readFile(path.join(CVE_REPO, file.path), 'utf-8');
        items.push(extractInfo(content));
      } catch { failed++; }
    }
    if (items.length === 0) continue;

    let retries = 0;
    while (retries <= MAX_RETRIES) {
      try {
        const aiResult = await classifyBatch(items, opts);
        for (const r of aiResult.results || []) {
          const sev = ['Critical', 'High', 'Medium'].includes(r.severity) ? r.severity : 'Medium';
          const item = items.find(it => it.id === r.id);
          results[r.id] = {
            id: r.id, severity: sev,
            product: item?.product || 'Unknown',
            version: item?.version || 'Unknown',
            cwe: item?.cwe || 'Unknown',
            description: item?.description || '',
          };
          processed++;
        }
        break;
      } catch (err) {
        retries++;
        if (retries > MAX_RETRIES) {
          console.error(`\n  ❌ 失败: ${batch.map(f => f.id).join(', ')} - ${err.message}`);
          failed += batch.length;
        } else {
          await sleep(err.message.includes('429') || err.message.includes('限流') ? 5000 : 2000);
        }
      }
    }

    const elapsed = Math.floor((Date.now() - t0) / 1000);
    const total = processed + failed;
    const pct = Math.round((total / pending.length) * 100);
    process.stdout.write(
      `\r  ⏳ ${total}/${pending.length} (${pct}%) | 成功: ${processed} | 失败: ${failed} | ${elapsed}s`
    );

    // 每 10 批保存一次
    if (Math.floor(i / BATCH_SIZE) % 10 === 0) await saveResults(results);
    await sleep(DELAY_MS);
  }

  await saveResults(results);
  console.log('\n' + '─'.repeat(50));
  console.log('✅ 完成！');
  printStats(results);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function saveResults(results) {
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');
}

function printStats(results) {
  const v = Object.values(results);
  const c = v.filter(r => r.severity === 'Critical').length;
  const h = v.filter(r => r.severity === 'High').length;
  const m = v.filter(r => r.severity === 'Medium').length;
  console.log(`\n📊 统计: 总计 ${v.length} | 🔴严重 ${c} | 🟠高危 ${h} | 🟡中危 ${m}`);
  console.log(`💾 已保存: ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('\n❌ 异常:', err.message);
  process.exit(1);
});
