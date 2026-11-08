/** 空仓库引导：用 Contents API 创建第一个提交（临时脚本） */
import fs from 'node:fs';

const token = process.env.GHTOKEN;
if (!token) throw new Error('缺少 GHTOKEN');
const content = fs.readFileSync('README.md').toString('base64');

const r = await fetch('https://api.github.com/repos/MUTTERTOOLS/trading-handbook-web/contents/README.md', {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'publish',
  },
  body: JSON.stringify({ message: '引导提交：初始化仓库', content }),
});
const j = await r.json();
console.log('status:', r.status, '| commit:', j.commit ? j.commit.sha.slice(0, 10) : j.message);
if (!r.ok) process.exit(1);
