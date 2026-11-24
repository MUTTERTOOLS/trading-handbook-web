/**
 * 结构图组件客户端增强（契约 §5.4 layer-map / §5.5 flow-steps，派单 D51）：
 * 插件渲染产物（apps/web/.vitepress/plugins/content.ts）为 SSR 静态完整 HTML，
 * 本模块只做渐进增强，不做任何初始 DOM 改写——事件委托挂在 document 上
 * （figureTooltip.ts 同例），全部 DOM 变更均由用户交互触发，晚于 Vue 注水，
 * 零注水错配。
 *
 * 职责：
 * - layer-map：层条点击钉住/收起 + aria-expanded 同步；键盘 Enter/Space 可达；
 *   "重播浮现动画"按钮（移除再挂回 .play，reflow 重启 CSS 动画）；
 *   展开/收起的 hover 与键盘聚焦分支为纯 CSS（:hover / :focus-within），无 JS 亦可达。
 * - flow-steps：步骤盒点击高亮其"不通过"汇流路径（本步菱形填实、下方红线加实、
 *   出口框描边加亮），再点取消；键盘 Enter/Space 可达；"演示错误顺序"为原生
 *   <details>，开合状态经捕获阶段 toggle 事件映射到容器 .fw-errors class
 *   （toggle 事件不冒泡，须 capture）。
 */

function toggleLayer(layer: HTMLElement): void {
  const open = layer.classList.toggle('open');
  layer.setAttribute('aria-expanded', open ? 'true' : 'false');
}

/** 步骤选中态：该步菱形填实、其下方整段汇流红线加实、出口框加亮（mockup 同规） */
function applyFlowSelection(flow: Element, selected: number): void {
  flow.querySelectorAll<HTMLElement>('.box').forEach((box) => {
    const on = parseInt(box.dataset.s ?? '0', 10) === selected;
    box.classList.toggle('sel', on);
    box.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  flow.querySelectorAll<HTMLElement>('.rail').forEach((rail) => {
    const ord = parseFloat(rail.dataset.ord ?? '0');
    rail.classList.toggle('hot', selected > 0 && ord >= selected);
    rail.classList.toggle('cur', selected > 0 && Math.abs(ord - selected) < 0.001);
  });
  flow.querySelector('.exit')?.classList.toggle('hot', selected > 0);
}

export function setupDiagramEnhance(): void {
  if (typeof document === 'undefined') return; // SSR 守卫：构建期不挂载
  const root = document.documentElement;
  if ((root.dataset as { diagramEnhance?: string }).diagramEnhance === 'on') return;
  (root.dataset as { diagramEnhance?: string }).diagramEnhance = 'on';

  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    if (!target || typeof target.closest !== 'function') return;

    const layer = target.closest<HTMLElement>('.lm-layer');
    if (layer) {
      toggleLayer(layer);
      return;
    }

    const replay = target.closest<HTMLElement>('.lm-replay');
    if (replay) {
      const lm = replay.closest<HTMLElement>('.lm');
      if (lm) {
        lm.classList.remove('play');
        void lm.offsetWidth; // 强制重排以重启动画
        lm.classList.add('play');
      }
      return;
    }

    const box = target.closest<HTMLElement>('.fw .box');
    if (box) {
      const flow = box.closest<HTMLElement>('.fw');
      if (!flow) return;
      const current = parseInt(flow.dataset.sel ?? '0', 10);
      const next = parseInt(box.dataset.s ?? '0', 10);
      const selected = current === next ? 0 : next;
      flow.dataset.sel = String(selected);
      applyFlowSelection(flow, selected);
    }
  });

  // 键盘可达：层条与步骤盒是 role="button" 的 tabindex 元素，Enter/Space 触发
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target as Element | null;
    if (!target || typeof target.closest !== 'function') return;
    const layer = target.closest<HTMLElement>('.lm-layer');
    if (layer) {
      event.preventDefault();
      toggleLayer(layer);
      return;
    }
    const box = target.closest<HTMLElement>('.fw .box');
    if (box) {
      event.preventDefault();
      const flow = box.closest<HTMLElement>('.fw');
      if (!flow) return;
      const current = parseInt(flow.dataset.sel ?? '0', 10);
      const next = parseInt(box.dataset.s ?? '0', 10);
      const selected = current === next ? 0 : next;
      flow.dataset.sel = String(selected);
      applyFlowSelection(flow, selected);
    }
  });

  // 演示错误顺序开关（原生 details）：toggle 不冒泡，捕获阶段接住再映射容器状态
  document.addEventListener(
    'toggle',
    (event) => {
      const details = event.target as Element;
      if (!(details instanceof HTMLDetailsElement) || !details.classList.contains('fw-demo')) {
        return;
      }
      details.closest<HTMLElement>('.fw')?.classList.toggle('fw-errors', details.open);
    },
    true
  );
}
