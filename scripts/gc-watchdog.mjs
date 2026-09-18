#!/usr/bin/env node
/**
 * gc-watchdog.mjs — 沙箱 GC 误删文件自动恢复看门狗
 *
 * 背景：WorkBuddy 沙箱的 sandbox-cli-gc.exe（--retain-sec 600 / maxSizeMb 3000）
 * 清理会话备份时会误删真实工作区文件（2026-09-18 当日六次，详见
 * ../.workbuddy/memory/2026-09-18.md）。
 *
 * 行为：每 30s 跑一次 `git status --porcelain`，把「未暂存的工作树删除」（` D` 行）
 * 用 `git checkout -- <path>` 自动恢复；已被 git add 的删除（`D `）不碰。
 *
 * 用法（在本机自己的终端运行，勿在 Agent 沙箱内运行）：
 *   node scripts/gc-watchdog.mjs            # 常驻（Ctrl+C 停止）
 *   node scripts/gc-watchdog.mjs --once     # 只检查恢复一次后退出
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INTERVAL = 30_000;
const once = process.argv.includes('--once');

// git 可执行：便携版真身优先（cmd/git.exe 是依赖 PATH 的 wrapper），回退 PATH 解析。
// ⚠️ 仓库路径通过 `git -C` 传入而非 spawn 的 cwd 选项——cwd 混合斜杠路径会让
// CreateProcess 直接 ENOENT（路径问题伪装成「程序不存在」）。
const GIT_CANDIDATES = [
  'C:/Users/ybeib/.workbuddy/binaries/PortableGit/current/mingw64/bin/git.exe',
  'C:/Users/ybeib/.workbuddy/binaries/PortableGit/versions/1.2.0/mingw64/bin/git.exe',
  'git',
];
const gitBin = GIT_CANDIDATES.find((p) => p === 'git' || fs.existsSync(p));
if (!gitBin) {
  console.error('git.exe not found');
  process.exit(1);
}

const git = (...args) => {
  const r = spawnSync(gitBin, ['-C', REPO, ...args], { encoding: 'utf8' });
  if (r.error) throw r.error;
  return r.stdout ?? '';
};

const sweep = () => {
  const status = git('status', '--porcelain');
  const deleted = status
    .split('\n')
    .filter((l) => l.startsWith(' D '))
    .map((l) => l.slice(3).trim().replace(/^"(.*)"$/, '$1'));
  if (!deleted.length) return 0;
  for (const f of deleted) {
    const r = spawnSync(gitBin, ['-C', REPO, 'checkout', '--', f], { encoding: 'utf8' });
    if (r.error || r.status !== 0) {
      console.error(`[${new Date().toLocaleTimeString()}] FAILED: ${f}`);
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] restored: ${f}`);
    }
  }
  return deleted.length;
};

if (once) {
  sweep();
} else {
  console.log(`gc-watchdog watching ${REPO} (every ${INTERVAL / 1000}s)`);
  setInterval(() => {
    try {
      sweep();
    } catch (e) {
      console.error('sweep error:', String(e.message).slice(0, 160));
    }
  }, INTERVAL);
  sweep();
}
