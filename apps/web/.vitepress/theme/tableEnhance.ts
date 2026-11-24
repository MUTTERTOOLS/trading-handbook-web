/**
 * 宽表增强（派单 D54，反馈一"六列总表太密难读"）：
 * plugins/content.ts 给所有顶层表格统一包 .table-scroll（overflow-x:auto）。
 * 此前 .data-table 的 max-width:100% 把宽表硬压进容器（六列挤成竖条），
 * 本模块放开宽表的自然宽度让其横向滚动，并按"是否溢出"给容器挂 .is-wide
 * 驱动宽表可读性样式（首列定位 sticky、行距列距放宽）；窄表不挂类、外观不变。
 *
 * 纪律：与 figureTooltip / diagramEnhance 同一渐进增强模式——纯 class 切换，
 * 无初始 DOM 改写；无 JS 时表格仍可横向滚动（只少首列定位）。
 * 监听：初始扫描 + resize（rAF 节流）+ MutationObserver（客户端换页后
 * 新注入的表格自动扫描；enhanceApp 挂载早于页面内容入 DOM，初始扫描通常为空）。
 */

function scan(): void {
  document.querySelectorAll<HTMLElement>('.table-scroll').forEach((box) => {
    const table = box.querySelector<HTMLElement>('.data-table');
    if (!table) return;
    // width:auto 的表格按 shrink-to-fit 收缩到容器宽内（min-content 低于容器时
    // 永不溢出、scrollWidth 恒等于 clientWidth），须借 max-content 测"自然需求
    // 宽"再还原，才能判定该表是否真需要横向滚动（真宽表）。
    const prevWidth = table.style.width;
    table.style.width = 'max-content';
    const natural = table.offsetWidth;
    table.style.width = prevWidth;
    box.classList.toggle('is-wide', natural > box.clientWidth + 1);
  });
}

export function setupTableEnhance(): void {
  if (typeof document === 'undefined') return; // SSR 守卫：构建期不挂载
  const root = document.documentElement;
  if ((root.dataset as { tableEnhance?: string }).tableEnhance === 'on') return;
  (root.dataset as { tableEnhance?: string }).tableEnhance = 'on';

  let raf = 0;
  const scheduleScan = (): void => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      scan();
    });
  };

  scan();
  window.addEventListener('resize', scheduleScan, { passive: true });
  new MutationObserver(scheduleScan).observe(document.body, {
    childList: true,
    subtree: true,
  });
}
