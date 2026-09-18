#!/usr/bin/env node
/**
 * check-residue.mjs — 内容残留与文件一致性检测（2026-09-18）
 *
 * 检测三类问题（当日 wandering-clouds/computer-science 残留事件的固化检测）：
 *  1. 主仓 git 有而磁盘无的文件（被 GC/外部进程删除）
 *  2. 磁盘有而 git 无的未跟踪残留（排除 node_modules/dist/.astro 与嵌套仓库）
 *  3. content 嵌套仓库与磁盘的一致性；workspace 旧 blog-content clone 的独有 md
 *
 * 用法：node tools/check-residue.mjs
 * 输出非零退出码 = 发现问题。
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['.git', 'node_modules', 'dist', '.astro']);
let problems = 0;

const lsFiles = (repo) =>
  new Set(
    execSync(`git -c core.quotepath=false -C "${repo}" ls-files`, { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean),
  );

const walkDisk = function walkDisk(dir, rel, out, skipGit) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipGit && f.name === '.git') continue;
    if (SKIP.has(f.name)) continue;
    const r = rel ? rel + '/' + f.name : f.name;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walkDisk(p, r, out, skipGit);
    else out.add(r);
  }
  return out;
};

// 1+2. 主仓
const tracked = lsFiles(ROOT);
const disk = walkDisk(ROOT, '', new Set(), true);
const deleted = [...tracked].filter((f) => !disk.has(f));
const untracked = [...disk].filter((f) => !tracked.has(f));
if (deleted.length) {
  problems++;
  console.log(`✗ 主仓缺失文件 ${deleted.length} 个（可 git checkout -- 恢复）:`);
  console.log('  ' + deleted.slice(0, 20).join('\n  '));
} else console.log('✓ 主仓 git 与磁盘一致（' + tracked.size + ' 文件）');
if (untracked.length) {
  problems++;
  console.log(`✗ 主仓未跟踪残留 ${untracked.length} 个:`);
  console.log('  ' + untracked.slice(0, 20).join('\n  '));
} else console.log('✓ 主仓无未跟踪残留');

// 3. content 嵌套仓库
const C = path.join(ROOT, 'content');
if (fs.existsSync(path.join(C, '.git'))) {
  const tc = lsFiles(C);
  const dc = walkDisk(C, '', new Set(), false);
  const d1 = [...tc].filter((f) => !dc.has(f));
  const u1 = [...dc].filter((f) => !tc.has(f));
  if (d1.length || u1.length) {
    problems++;
    console.log(`✗ content 不一致：缺失 ${d1.length}（${d1.slice(0, 8).join(', ')}）、未跟踪 ${u1.length}（${u1.slice(0, 8).join(', ')}）`);
  } else console.log('✓ content 仓库与磁盘一致（' + tc.size + ' 文件）');

  // 4. workspace 旧 blog-content clone 的独有 md（提醒手工处理，不自动动）
  const BC = path.join(path.dirname(ROOT), 'blog-content');
  if (fs.existsSync(BC)) {
    const names = (dir) => {
      const out = [];
      (function w(d) {
        for (const f of fs.readdirSync(d, { withFileTypes: true })) {
          if (f.name === '.git') continue;
          const p = path.join(d, f.name);
          if (f.isDirectory()) w(p);
          else if (f.name.endsWith('.md')) out.push(f.name);
        }
      })(dir);
      return out;
    };
    const onlyBc = names(BC).filter((n) => !names(path.join(C, 'blog-post')).includes(n));
    if (onlyBc.length) {
      console.log(`⚠ 旧 blog-content clone 有独有 md（未自动处理）: ${onlyBc.join(', ')}`);
    }
  }
} else {
  problems++;
  console.log('✗ content 仓库不存在');
}

process.exit(problems ? 1 : 0);
