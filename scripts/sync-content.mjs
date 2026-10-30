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

/**
 * 跑一条外部命令。
 *
 * 2026-10-31 改：原实现是 `spawnSync(command, { shell: true, stdio: 'inherit' })`，
 * 把整条命令拼成一个字符串交给 shell —— 仓库路径里只要出现空格、引号、`&`、
 * 或 `$`（本机路径 `D:\ybeib\Desktop\ReZero\` 目前侥幸没踩到），就会被 shell
 * 重新解释成多条命令或直接 ENOENT。改成「程序名 + 参数数组」后路径原样传给 git，
 * 不经过任何 shell 解析。项目其余脚本已统一 `git -C <路径>`（AGENTS.md §13），
 * 这条只是补齐搬运方式。
 *
 * `optional` 用于「失败也无所谓」的步骤（如 predev 的 git pull）：只告警不抛错。
 */
const run = (file, args, { optional = false } = {}) => {
  const result = spawnSync(file, args, { stdio: 'inherit' })
  const fail = (reason) => {
    if (!optional) throw new Error(`命令失败：${file} ${args.join(' ')}（${reason}）`)
    console.warn(`[sync] 跳过：${file} ${args.join(' ')}（${reason}）`)
    return false
  }
  if (result.error) return fail(result.error.message)
  if (result.status !== 0) return fail(`退出码 ${result.status ?? 'null'}`)
  return true
}

const copyImages = () => {
  if (!fs.existsSync(imagesDir)) return
  const dest = path.join(root, 'public', 'IMAGES')
  /*
   * 先清空目标目录再拷贝（2026-09-27）：
   * fs.cpSync 只做「拷贝/覆盖」，**不会删除**源里已不存在的文件——于是在 vault 中
   * 删除或改名的图片会以旧文件形式残留在 public/IMAGES（实测：源里删了 sample.jpg，
   * 目标里仍留着 Sep 18 的旧件）。先 rmSync 再 cpSync 可保证目标目录始终与
   * content/IMAGES 完全一致。
   */
  fs.rmSync(dest, { recursive: true, force: true })
  fs.cpSync(imagesDir, dest, { recursive: true })
  console.log(`[sync] IMAGES → public/IMAGES（${fs.readdirSync(dest).length} 个文件）`)
}

const main = () => {
  if (repo) {
    if (fs.existsSync(path.join(contentDir, '.git'))) {
      console.log(`[sync] git pull ${repo}`)
      /*
       * pull 失败不阻断（2026-10-31）：离线、代理故障、或本地有未推送改动时报
       * 「fatal: Not possible to fast-forward」都是常事，而本地 content/ 里的文章
       * 已经够构建。原先这里 throw，于是断网时 `npm run dev` 直接起不来
       * （predev 就是跑这个脚本），dev 服务器一个字都不输出。
       */
      run('git', ['-C', contentDir, 'pull', '--ff-only'], { optional: true })
    } else {
      console.log(`[sync] git clone ${repo}`)
      // clone 是必需步骤：没有 content/ 就没有任何文章，必须让构建失败
      run('git', ['clone', '--depth', '1', '--single-branch', repo, contentDir])
    }
    copyImages()
    return
  }

  if (fs.existsSync(contentDir)) {
    console.log('[sync] 未设置 CONTENT_REPO，使用本地 content/ 目录')
    copyImages()
  } else {
    console.warn('[sync] content/ 目录不存在：设置 CONTENT_REPO=<内容仓库地址> 后重跑，或手动创建 content/blog-post（文章按年份子目录归档）')
  }
}

main()
