/**
 * 正文图片增强（客户端模块）：渐显 + 灯箱。
 *
 * 2026-10-31 从 `BaseLayout.astro` 的 `<script>` 里拆出：那个 script 同时管主题、
 * 夜间模式、图片、灯箱、AOS 入场、代码块复制，672 行里分不清哪些属于首屏关键路径。
 * 图片这两块彼此相关（都只作用于 `.prose img`）、不需要任何跨块状态，是最干净的一刀。
 *
 * 本函数只注册委托监听、不持有一次性快照，因此整份只需执行一次：
 * 图片的增删（换页）与懒加载都不影响 —— 监听挂在 document 上。
 */
export const setupImageEnhance = () => {
  /*
   * 渐显：图注（figure/figcaption）与 loading/decoding 已在构建期由 hast 插件生成，
   * 这里只把「解码完成」翻译成 `.loaded` 类，具体透明度由 global.css 的
   * `.js .prose img` 规则负责。
   * load / error **不冒泡**，所以必须写在捕获阶段，否则一张图都收不到。
   */
  document.addEventListener(
    'load',
    (event) => {
      if (event.target instanceof HTMLImageElement) event.target.classList.add('loaded');
    },
    true,
  );
  document.addEventListener(
    'error',
    (event) => {
      // 加载失败时也显示出来（保持 opacity:1），避免图片永久不可见
      if (event.target instanceof HTMLImageElement) event.target.classList.add('loaded');
    },
    true,
  );

  /* ---------- 正文图片灯箱 ----------
   * <dialog id="photo-lightbox"> 是构建期输出的静态标记，这里只挂一个委托监听器。 */
  document.addEventListener('click', (event) => {
    const img = (event.target as HTMLElement).closest<HTMLImageElement>('.prose img');
    if (!img) return;
    const dialog = document.getElementById('photo-lightbox');
    if (!(dialog instanceof HTMLDialogElement)) return;
    dialog.querySelector('img')?.setAttribute('src', img.currentSrc || img.src);
    const caption = dialog.querySelector('.photo-caption');
    if (caption) caption.textContent = img.alt ? `◭ ${img.alt}` : '';
    dialog.showModal();
  });

  /* 点击灯箱任意区域（大图 / 图注 / 背景）关闭 —— 对应样式里的 cursor-zoom-out；
   * 旧站 react-photo-view 的「点击遮罩关闭」等价物。dialog 内的 img 不在 .prose 内，
   * 不会误触上面的打开逻辑；ESC 关闭是 showModal 的原生行为，无需额外处理。 */
  document.addEventListener('click', (event) => {
    const dialog = (event.target as HTMLElement).closest('#photo-lightbox');
    if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close();
  });
};
