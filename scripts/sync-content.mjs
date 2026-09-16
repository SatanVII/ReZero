#!/usr/bin/env node
/**
 * 内容同步脚本（对应旧站 contentlayer/source-remote-files 的克隆/拉取逻辑）
 *
 * 用法：
 *   CONTENT_REPO=https://github.com/<user>/<blog>.git npm run content:sync
 *   未设置 CONTENT_REPO 时，直接使用本地 content/ 目录（仅同步其中的 IMAGES）
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const contentDir = path.join(root, 'content')
const imagesDir = path.join(contentDir, 'IMAGES')
const repo = process.env.CONTENT_REPO || ''

const run = (command) => {
  const result = spawnSync(command, { shell: true, stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(`命令失败：${command}`)
  }
}

const copyImages = () => {
  if (!fs.existsSync(imagesDir)) return
  const dest = path.join(root, 'public', 'IMAGES')
  fs.cpSync(imagesDir, dest, { recursive: true })
  console.log(`[sync] IMAGES → public/IMAGES（${fs.readdirSync(dest).length} 个文件）`)
}

const main = () => {
  if (repo) {
    if (fs.existsSync(path.join(contentDir, '.git'))) {
      console.log(`[sync] git pull ${repo}`)
      run(`git -C "${contentDir}" pull --ff-only`)
    } else {
      console.log(`[sync] git clone ${repo}`)
      run(`git clone --depth 1 --single-branch "${repo}" "${contentDir}"`)
    }
    copyImages()
    return
  }

  if (fs.existsSync(contentDir)) {
    console.log('[sync] 未设置 CONTENT_REPO，使用本地 content/ 目录')
    copyImages()
  } else {
    console.warn('[sync] content/ 目录不存在：设置 CONTENT_REPO=<内容仓库地址> 后重跑，或手动创建 content/wandering-clouds 与 content/computer-science')
  }
}

main()
