/**
 * 成品图悬浮提示（派单 D21）：为构建期内联 SVG 中带 data-tip="…" 的元素
 * 提供统一的悬浮读数——数据类图的关键点（转折/末端/峰值/柱顶/阈值线）
 * 悬停即可看到数值或口径，与 interactive 组件的 tooltip 能力对齐。
 *
 * 设计要点：
 * - 仅浏览器端挂载：enhanceApp 里 SSR 守卫后调用，Node 构建期不触碰 window。
 * - 事件委托挂在 document 上（不用逐元素绑定），客户端路由换页后新注入的
 *   SVG 无需重新绑定；共享一个 tooltip 元素驱动全站。
 * - pointermove 驱动显示与跟随（桌面）；pointerdown 兜底触屏（点按显示，
 *   3 秒后或下次点按/滚动时消失）；scroll 时隐藏（fixed 定位会脱离光标）。
 */

const OFFSET_X = 14;
const OFFSET_Y = 18;
const EDGE_PAD = 10;
const TOUCH_SHOW_MS = 3000;

let tipEl: HTMLDivElement | null = null;
let touchTimer: ReturnType<typeof setTimeout> | undefined;

function ensureTip(): HTMLDivElement {
  if (tipEl) return tipEl;
  tipEl = document.createElement('div');
  tipEl.className = 'fig-tip';
  tipEl.setAttribute('role', 'tooltip');
  tipEl.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tipEl);
  return tipEl;
}

/** 光标位置放提示：默认右下偏移，贴近视口边缘时翻转，不遮挡光标处图形 */
function placeAt(el: HTMLDivElement, x: number, y: number): void {
  const rect = el.getBoundingClientRect();
  let left = x + OFFSET_X;
  let top = y + OFFSET_Y;
  if (left + rect.width + EDGE_PAD > window.innerWidth) left = x - rect.width - OFFSET_X;
  if (top + rect.height + EDGE_PAD > window.innerHeight) top = y - rect.height - OFFSET_Y;
  el.style.left = `${Math.max(EDGE_PAD, left)}px`;
  el.style.top = `${Math.max(EDGE_PAD, top)}px`;
}

function showTip(text: string, x: number, y: number): void {
  const el = ensureTip();
  if (el.textContent !== text) el.textContent = text;
  el.classList.add('show');
  placeAt(el, x, y);
}

function hideTip(): void {
  if (touchTimer !== undefined) {
    clearTimeout(touchTimer);
    touchTimer = undefined;
  }
  tipEl?.classList.remove('show');
}

function tipTarget(target: EventTarget | null): HTMLElement | null {
  const el = target as Element | null;
  if (!el || typeof el.closest !== 'function') return null;
  return el.closest<HTMLElement>('[data-tip]');
}

export function setupFigureTooltips(): void {
  if (typeof document === 'undefined') return; // SSR 守卫：构建期不挂载
  if ((document.documentElement.dataset as { figTip?: string }).figTip === 'on') return;
  (document.documentElement.dataset as { figTip?: string }).figTip = 'on';

  document.addEventListener(
    'pointermove',
    (event: PointerEvent) => {
      if (event.pointerType === 'touch') return; // 触屏走 pointerdown
      const el = tipTarget(event.target);
      if (!el) {
        hideTip();
        return;
      }
      showTip(el.getAttribute('data-tip') ?? '', event.clientX, event.clientY);
    },
    { passive: true }
  );

  document.addEventListener(
    'pointerdown',
    (event: PointerEvent) => {
      if (event.pointerType !== 'touch') {
        hideTip();
        return;
      }
      const el = tipTarget(event.target);
      if (!el) {
        hideTip();
        return;
      }
      showTip(el.getAttribute('data-tip') ?? '', event.clientX, event.clientY);
      if (touchTimer !== undefined) clearTimeout(touchTimer);
      touchTimer = setTimeout(hideTip, TOUCH_SHOW_MS);
    },
    { passive: true }
  );

  // 页面滚动 / 离开窗口时提示位置已失效，直接隐藏
  document.addEventListener('scroll', hideTip, { passive: true, capture: true });
  window.addEventListener('blur', hideTip);
}
