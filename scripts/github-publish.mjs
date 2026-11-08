/**
 * 通过 GitHub Git Data API 发布（本机到 github.com 的 git 端点不可达时的替代方案）。
 * 用法：GHTOKEN=<GitHub PAT> node scripts/github-publish.mjs [提交说明]
 * 流程：文件 → blobs → tree → commit → 创建/更新 refs/heads/main。
 * 令牌只经环境变量传入，不写入任何仓库文件。
 */
import fs from 'node:fs';
import path from 'node:path';

const token = process.env.GHTOKEN;
if (!token) throw new Error('缺少 GHTOKEN 环境变量');

const owner = 'MUTTERTOOLS';
const repo = 'trading-handbook-web';
const branch = 'main';
const api = 'https://api.github.com';
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
  'User-Agent': 'trading-handbook-web-publish',
};

async function apiCall(url, opts = {}) {
  const res = await fetch(url, { headers, ...opts });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* 非 JSON 响应原样抛出 */
  }
  if (!res.ok) throw new Error(`${res.status} ${url}\n${text.slice(0, 500)}`);
  return json;
}

/* ---- 收集文件（与 .gitignore 对应） ---- */
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.DS_Store' || e.name.endsWith('.local')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(full, out);
    } else {
      out.push(path.relative('.', full).split(path.sep).join('/'));
    }
  }
  return out;
}

const message = process.argv[2] ?? '更新内容';
const files = walk('.').sort();
console.log(`待发布文件数：${files.length}`);

/* ---- 1. 上传 blobs（并发 8） ---- */
const tree = [];
let cursor = 0;
async function blobWorker() {
  while (cursor < files.length) {
    const rel = files[cursor++];
    const content = fs.readFileSync(path.join('.', rel));
    const b = await apiCall(`${api}/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: content.toString('base64'), encoding: 'base64' }),
    });
    tree.push({ path: rel, mode: '100644', type: 'blob', sha: b.sha });
    console.log(`  blob ✓ ${rel}`);
  }
}
await Promise.all(Array.from({ length: 8 }, blobWorker));

/* ---- 2. 建 tree ---- */
const treeRes = await apiCall(`${api}/repos/${owner}/${repo}/git/trees`, {
  method: 'POST',
  body: JSON.stringify({ tree }),
});
console.log('tree:', treeRes.sha);

/* ---- 3. 取父提交（无则首建） ---- */
let parentSha = null;
try {
  const ref = await apiCall(`${api}/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  parentSha = ref?.object?.sha ?? null;
} catch {
  parentSha = null;
}

/* ---- 4. 建 commit ---- */
const commit = await apiCall(`${api}/repos/${owner}/${repo}/git/commits`, {
  method: 'POST',
  body: JSON.stringify({
    message,
    tree: treeRes.sha,
    parents: parentSha ? [parentSha] : [],
    author: {
      name: 'MUTTERTOOLS',
      email: '62096834+MUTTERTOOLS@users.noreply.github.com',
      date: new Date().toISOString(),
    },
  }),
});
console.log('commit:', commit.sha);

/* ---- 5. 创建/更新分支引用 ---- */
if (parentSha) {
  await apiCall(`${api}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
} else {
  await apiCall(`${api}/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }),
  });
}
console.log(`已发布到 ${owner}/${repo}@${branch}`);
