/**
 * 手册内容渲染插件：把内容语法契约（docs/content-grammar.md）转成呈现层标记。
 *
 * 输入约定（由 content:check 保证，插件侧再兜底校验，出错即构建失败）：
 * - 章节固定小节 `## 开场问题` / `一句话结论` / `本章学习目标` / `正文` /
 *   `常见误区` / `本章小结` / `自测题` / `速查卡*` / `延伸与链接` / `⚠️ 风险提示`
 * - `〔B?-C??〕` 交叉引用；`【待核验】` 与变体 `【待核验：说明】` → 上标 ※ 核验
 *   标记（hover title 提示；D46 起不再渲染"【待核验】"字面文本）
 * - `::: interactive <SlotId>` 空容器（槽位清单见 ../slots.ts，未知类型/槽位抛错）
 * - `::: figure-spec` 容器（制图说明，体内文字不进渲染输出）；成品图
 *   `<章id>-fig<n>.svg`（n 为章内容器出现顺序）存在时构建期内联为默认可见的
 *   `<figure class="figure-block">`（SVG 内 var(--fig-*) 随站点主题解析，
 *   校验不过退化为 <img src>；无成品图整块不渲染）
 * - `::: qa-cards <卡头题句>` 问答卡片容器（契约 §5.3）：容器体逐行为
 *   对答行（`序词：内容`）+ 至多一条结论行（`结论：` 开头），整组渲染为
 *   .qa-group 卡片组（视觉规格 content/editorial/mockup-qa-cards.html）；
 *   容器体是读者可见内容，不参与字数剔除
 * - `::: layer-map <图题>` 分层结构图容器（契约 §5.4）：容器体逐行为
 *   层行（`层 {层名}（{层副名}）：{一句话}`）+ 字段行（`{层名}·{字段名}：{内容}`）
 *   + 至多一条底座行（`底座：{内容}`），渲染为 .lm 堆叠层组件
 *   （视觉规格 content/editorial/mockup-diagrams.html 组件一节）
 * - `::: flow-steps <图题>` 流程步骤图容器（契约 §5.5）：容器体逐行为
 *   步行（`步 …`，冒号后 输入/→ 输出/｜不通过 段）+ 出口/分界/演示行，
 *   渲染为 .fw 竖向流程组件（视觉规格同上组件二节）；全部步行无 ｜不通过
 *   段且无出口行时为无分支线性形态（.fw-linear）
 * - 误区组以 `**误区…**` 段落开头，自测题组以 `**题 N.**` 段落开头
 * - 站点框架页（index.md / [volume].md）含 `<SeriesHome />` / `<VolumeIntro />`：
 *   `html:false` 下按普通段落进入 token 流，这里转回 html 标签
 *
 * 输出：真实 link token（交叉引用可被静态托管直接访问）+ 少量包裹性
 * html_block，样式全部由 theme/custom.css 按 class / data-section 提供。
 *
 * 刻意不依赖 markdown-it 的类型导出：仓库里同时存在根目录 @types/markdown-it
 * 与 VitePress 内置 markdown-it 两套类型，直接引用会产生双源冲突。
 * 这里用最小结构类型描述用到的 token / state 能力。
 */
import fs from 'node:fs';
import path from 'node:path';
import { SLOT_IDS } from '../slots';

/** md.use(contentPlugin, options) 的选项 */
export interface ContentPluginOptions {
  /** 成品图目录（apps/web/public/figures）；缺省时只渲染折叠说明、不注入 */
  figuresDir?: string;
  /** 站点 base（与 config.mts 同源，缺省 '/'）：内联退化 <img> 的
   *  /figures/… 绝对路径需感知 base，Pages 子路径部署才不会 404 */
  base?: string;
}

interface MdToken {
  type: string;
  tag: string;
  content: string;
  children: MdToken[] | null;
  level: number;
  info: string;
  attrSet(name: string, value: string): void;
}

interface MdBlockTokenizer {
  tokenize(state: MdBlockState, startLine: number, endLine: number): void;
}

interface MdBlockRuler {
  ruler: {
    before(
      beforeName: string,
      name: string,
      rule: (state: MdBlockState, startLine: number, endLine: number, silent: boolean) => boolean,
      alt?: { alt: string[] }
    ): void;
  };
}

interface MdBlockState extends MdState {
  src: string;
  bMarks: number[];
  tShift: number[];
  eMarks: number[];
  sCount: number[];
  blkIndent: number;
  lineMax: number;
  line: number;
  md: { block: MdBlockTokenizer };
}

interface MdState {
  tokens: MdToken[];
  Token: new (type: string, tag: string, nesting: 1 | 0 | -1) => MdToken;
  env: Record<string, unknown>;
}

/** 渲染器最小结构：只用到按名覆盖规则与属性序列化（F-024 table_open 覆写）。
 *  rules 的规则值参数用底类型（never[]）声明：本插件 MdToken 是 markdown-it Token
 *  的子集结构类型，函数类型属性在 strictFunctionTypes 下按逆变检查，
 *  Token[] ↔ MdToken[] 双向都不相容；never[] 与任何 token 数组双向可赋值，
 *  使 MarkdownIt 结构兼容 MdLike，实现侧经由 renderAttrs(token: MdToken)
 *  拿回强类型 token。idx 用 number、剩余参数用 never[] 以兼容五参 RenderRule。 */
interface MdRendererLike {
  rules: Record<
    string,
    ((tokens: never[], idx: number, ...rest: never[]) => string) | undefined
  >;
  renderAttrs(token: MdToken): string;
}

interface MdLike {
  renderInline(text: string): string;
  core: {
    ruler: {
      push(name: string, rule: (state: MdState) => void): void;
    };
  };
  block: MdBlockRuler;
  renderer: MdRendererLike;
}

export interface ContentPlugin {
  (md: MdLike, options?: ContentPluginOptions): void;
}

const XREF_TOKEN_RE = /〔(B[1-8])-(C\d{2})〕|【待核验(?:：([^】]+))?】/g;
/** 核验标记（D46）：无说明变体的默认 hover 提示文案。
 *  注意：识别口径只认"【待核验"前缀形态（与 check.ts 计数同源），站点渲染输出
 *  不含该字面文本——字面仅存在于 md 源与 L2 门禁内部。 */
const VERIFY_MARK_TITLE = '待核验：示意或未经核验的数字（详见核验表）';
const QUIZ_RE = /^\*\*题\s*\d+/;
const MISCONCEPTION_RE = /^\*\*误区/;
const NOTE_RE = /^\*?\*?(注|表注)[：:]/;
const CHEAT_TITLE_RE = /^\*\*[^*]+\*\*$/;
const FORMULA_TEST_RE = /[=＝]/;
const FRAME_COMPONENT_RE = /^<(SeriesHome|VolumeIntro)\s*\/>$/;
/** 容器类型白名单（契约 §5）；未知类型抛错，不得静默透传 */
const CONTAINER_TYPES = new Set([
  'interactive',
  'figure-spec',
  'qa-cards',
  'layer-map',
  'flow-steps',
]);
/** 延伸与链接选读提示条（契约 §6.3 选读层，D39）：构建期注入的 html token，
 *  仅对本节生效且每次解析各注入一次（幂等）；零 HTML 纪律约束 md 源文件，
 *  插件注入渲染标记属既有模式（figure-block 同例）。样式见 theme/custom.css .ext-note */
const EXT_NOTE_HTML =
  '<div class="ext-note">本节为选读内容——数据锚点与延伸辨析，不影响主线连贯。</div>';

/** qa-cards 结论行前缀（契约 §5.3 严格形态：全角冒号；与 check.ts 同口径） */
const QA_CONCLUSION_PREFIX = '结论：';
const COLON = 0x3a; // ':'

function envFile(state: MdState): string {
  return ((state.env?.path as string | undefined) ?? (state.env?.relativePath as string | undefined) ?? '未知文件').replace(/\\/g, '/');
}

function htmlToken(state: MdState, content: string): MdToken {
  const token = new state.Token('html_block', '', 0);
  token.content = content;
  return token;
}

function textToken(state: MdState, content: string): MdToken {
  const token = new state.Token('text', '', 0);
  token.content = content;
  return token;
}

/* ------------------------------------------------------------------ *
 * 块级容器规则：`::: <type> [args]` … `:::`
 * 与 markdown-it-container 同构：先把容器边界切成一对 token，
 * 体内交给常规 block 解析；lineMax 收口防止懒续行越过容器边界。
 * 类型与参数的合法性校验统一放在 transformContainers（可拿到文件名报错）。
 * ------------------------------------------------------------------ */
function containerRule(state: MdBlockState, startLine: number, endLine: number, silent: boolean): boolean {
  // 缩进超过 3 空格按代码块处理
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  const startPos = state.bMarks[startLine] + state.tShift[startLine];
  const maxPos = state.eMarks[startLine];
  if (startPos + 3 > maxPos) return false;
  let pos = startPos;
  while (pos < maxPos && state.src.charCodeAt(pos) === COLON) pos++;
  const markerLen = pos - startPos;
  if (markerLen < 3) return false;
  const params = state.src.slice(pos, maxPos).trim();
  // 裸 `:::` 只允许作闭合标记；作打开行时（如缺类型）交由 transformContainers 报错
  const isOpenWithParams = params.length > 0;
  if (!isOpenWithParams) return false;
  if (silent) return true;

  // 找闭合行：行首连续不短于打开标记的冒号，且其后只有空白
  let closeLine = startLine;
  let autoClosed = false;
  for (;;) {
    closeLine++;
    if (closeLine >= endLine) break;
    const lineStart = state.bMarks[closeLine] + state.tShift[closeLine];
    const lineEnd = state.eMarks[closeLine];
    // 负缩进的非空行终止容器（防止吞掉外层列表/引用的后续内容）
    if (lineStart < lineEnd && state.sCount[closeLine] < state.blkIndent) break;
    let p = lineStart;
    while (p < lineEnd && state.src.charCodeAt(p) === COLON) p++;
    if (p - lineStart >= markerLen && !state.src.slice(p, lineEnd).trim()) {
      autoClosed = true;
      break;
    }
  }

  const oldLineMax = state.lineMax;
  state.lineMax = closeLine;
  const open = new state.Token('thb_container_open', 'div', 1);
  open.info = params;
  state.tokens.push(open);
  state.md.block.tokenize(state, startLine + 1, closeLine);
  const close = new state.Token('thb_container_close', 'div', -1);
  state.tokens.push(close);
  state.lineMax = oldLineMax;
  state.line = autoClosed ? closeLine + 1 : endLine;
  return true;
}

/** 成品图内联上限：超过则不内联，退化为 <img>（防止构建产物膨胀） */
const FIGURE_INLINE_MAX_BYTES = 60 * 1024;
/**
 * 内联安全校验：命中任一即退化为 <img>（img 语境下脚本不执行、外链不被加载）。
 * - 结构缺失：无 `</svg>` 收尾视为截断/损坏文件；
 * - 危险内容：`<script`、href/src 指向绝对或协议相对地址、url() 外链、@import、
 *   javascript: 协议（成品图应为自包含手绘 SVG，全部由本角色产出）。
 */
const FIGURE_FORBIDDEN_RES: RegExp[] = [
  /<script[\s>]/i,
  /\b(?:href|src|xlink:href)\s*=\s*["']?\s*(?:https?:)?\/\//i,
  /url\(\s*["']?\s*(?:https?:)?\/\//i,
  /@import/i,
  /javascript\s*:/i,
];

/** 成品图探测：`<章id>-fig<n>.svg` 存在才注入（契约 §5.2"有图显图，无图只渲染折叠说明"）。
 *  默认构建期内联 SVG 标记（使 var(--fig-*) 随站点主题解析，见 theme/custom.css）；
 *  任一安全校验不过时不内联，退化为 <img src="/figures/…">（原注入通道）并告警。 */
function figureToken(
  state: MdState,
  figuresDir: string,
  chapterId: string,
  figNo: number,
  base: string
): MdToken | null {
  const key = `${chapterId}-fig${figNo}`;
  const file = path.join(figuresDir, `${key}.svg`);
  if (!fs.existsSync(file)) return null;
  const source = fs.readFileSync(file, 'utf8');
  const asImage = () =>
    // URL = <base>figures/<键>.svg：publicDir 指向 apps/web/public（见 config.mts）。
    // 此 <img> 是构建期注入的裸 html，Vite/VitePress 不会对 JS 字符串里的
    // URL 重写 base，因此由 config.mts 显式传入（base='/' 时即 /figures/…）
    htmlToken(state, `<img src="${base}figures/${key}.svg" alt="${escapeHtml(key)}" />`);
  const closeIndex = source.lastIndexOf('</svg>');
  if (closeIndex < 0) {
    console.warn(`[figures] ${key}.svg 缺少 </svg>，不内联，退化为 <img>`);
    return asImage();
  }
  if (Buffer.byteLength(source, 'utf8') > FIGURE_INLINE_MAX_BYTES) {
    console.warn(`[figures] ${key}.svg 超过 60KB，不内联，退化为 <img>`);
    return asImage();
  }
  if (FIGURE_FORBIDDEN_RES.some((re) => re.test(source))) {
    console.warn(`[figures] ${key}.svg 含脚本或外链引用，不内联，退化为 <img>`);
    return asImage();
  }
  // 截到 </svg> 为止，丢弃其后的任何残余内容后内联
  return htmlToken(state, source.slice(0, closeIndex + '</svg>'.length).trim());
}

interface FigureScan {
  figuresDir?: string;
  base: string;
  chapterId: string;
  counter: { value: number };
}

/**
 * 对答行加重切分（契约 §5.3"问句关键词册色加重"的确定性实现）：
 * - 行内含全角冒号（序词行）：序词＋冒号必在加重段内；其后文字到首个"？"（含）
 *   也在加重段内；无问号则加重到首个分句标点（，；、。与半角 , ;，含该标点）；
 *   再无则只加重"序词＋冒号"。
 * - 行内无全角冒号：加重到首个"？"（含）；无问号则整行不加重（返回 null）。
 * 边界约定：首个"？"位于冒号之前时按"冒号后无问号"处理（走分句标点兜底）；
 * 加重规则与 check.ts 的行级校验互不依赖。
 */
function splitQaAsk(line: string): { ask: string; rest: string } | null {
  const colon = line.indexOf('：');
  if (colon < 0) {
    const mark = line.indexOf('？');
    if (mark < 0) return null;
    return { ask: line.slice(0, mark + 1), rest: line.slice(mark + 1) };
  }
  const head = line.slice(0, colon + 1);
  const body = line.slice(colon + 1);
  const mark = body.indexOf('？');
  if (mark >= 0) return { ask: head + body.slice(0, mark + 1), rest: body.slice(mark + 1) };
  const clause = body.search(/[,，;；、。]/);
  if (clause >= 0) return { ask: head + body.slice(0, clause + 1), rest: body.slice(clause + 1) };
  return { ask: head, rest: body };
}

/**
 * qa-cards → 问答卡片组（契约 §5.3，视觉规格 content/editorial/mockup-qa-cards.html）：
 * .qa-group 内一张 .qa-card（衬线卡头 + 对答行 1.2em 缩进 + 问句段 accent 加重）
 * + 可选 .qa-verdict 结论卡（accent 淡底 + "结论"标签胶囊）。
 * 相邻多个 qa-cards 容器各输出一个 .qa-group，块级流自然连排（custom.css 收紧相邻间距）。
 * 全部文本经 escapeHtml；容器体不参与行内 markdown / 交叉引用转换（契约容器体为纯散文行）。
 */
function renderQaCards(head: string, answers: string[], verdict: string | null): string {
  const parts: string[] = ['<div class="qa-group">'];
  parts.push('<div class="qa-card">');
  parts.push(`<div class="qa-card-head">${escapeHtml(head)}</div>`);
  parts.push('<div class="qa-card-body">');
  for (const answer of answers) {
    const ask = splitQaAsk(answer);
    parts.push(
      ask
        ? `<div class="qa-pair"><b class="qa-ask">${escapeHtml(ask.ask)}</b>${escapeHtml(ask.rest)}</div>`
        : `<div class="qa-pair">${escapeHtml(answer)}</div>`
    );
  }
  parts.push('</div></div>');
  if (verdict !== null) {
    parts.push(
      `<div class="qa-verdict"><span class="qa-verdict-tag">结论</span>${escapeHtml(verdict)}</div>`
    );
  }
  parts.push('</div>');
  return parts.join('');
}

/* ------------------------------------------------------------------ *
 * layer-map（契约 §5.4，视觉规格 content/editorial/mockup-diagrams.html 组件一节）
 * 行式词汇与 tools/content/check.ts 的 checkLayerMapBody 同口径（容器体逐行
 * 分类执法在 check.ts 带行号，此处渲染前兜底同规则）。
 * ------------------------------------------------------------------ */
/** 层行：`层 {层名}（{层副名}）：{一句话}`——层副名可缺省 */
const LM_LAYER_RE = /^层\s+(.+?)(?:（(.+?)）)?：\s*(.+)$/;
/** 字段行：`{层名}·{字段名}：{内容}`——层名须已由层行声明 */
const LM_FIELD_RE = /^(.+?)·(.+?)：\s*(.+)$/;
/** 底座行前缀（至多 1 条，契约置于体末；渲染恒在图底，不依赖书写位置） */
const LM_BASE_PREFIX = '底座：';

interface LayerMapField {
  name: string;
  text: string;
}
interface LayerMapLayer {
  name: string;
  sub: string | null;
  line: string;
  fields: LayerMapField[];
}

/**
 * layer-map 容器体解析：层行 ≥2、字段行的层名须已由（先行的）层行声明、
 * 底座行 ≤1、其余一律未知行式抛错（与"未知容器类型必须报错"同级纪律，
 * 禁止静默透传）。层名重复不在契约校验清单内，但会使字段行挂接歧义，
 * 此处按渲染完整性兜底报错。
 */
function parseLayerMap(lines: string[], file: string): { layers: LayerMapLayer[]; base: string | null } {
  const layers: LayerMapLayer[] = [];
  const declared = new Map<string, LayerMapLayer>();
  let base: string | null = null;
  for (const line of lines) {
    if (line.startsWith(LM_BASE_PREFIX)) {
      if (base !== null) {
        throw new Error(`${file}：layer-map 底座行至多一条（契约 §5.4）：${line}`);
      }
      base = line.slice(LM_BASE_PREFIX.length).trim();
      if (!base) throw new Error(`${file}：layer-map 底座行内容为空（契约 §5.4）`);
      continue;
    }
    const layerMatch = line.match(LM_LAYER_RE);
    if (layerMatch) {
      const layer: LayerMapLayer = {
        name: layerMatch[1]!.trim(),
        sub: layerMatch[2]?.trim() || null,
        line: layerMatch[3]!.trim(),
        fields: [],
      };
      if (declared.has(layer.name)) {
        throw new Error(`${file}：layer-map 层名重复："${layer.name}"`);
      }
      layers.push(layer);
      declared.set(layer.name, layer);
      continue;
    }
    const fieldMatch = line.match(LM_FIELD_RE);
    if (fieldMatch) {
      const owner = declared.get(fieldMatch[1]!.trim());
      if (!owner) {
        throw new Error(
          `${file}：layer-map 字段行的层名"${fieldMatch[1]!.trim()}"未由层行声明（契约 §5.4）：${line}`
        );
      }
      owner.fields.push({ name: fieldMatch[2]!.trim(), text: fieldMatch[3]!.trim() });
      continue;
    }
    throw new Error(`${file}：layer-map 未知行式（契约 §5.4 仅允许 层行／字段行／底座行）：${line}`);
  }
  if (layers.length < 2) {
    throw new Error(`${file}：layer-map 层行至少 2 条，实际 ${layers} 条（契约 §5.4）`);
  }
  return { layers, base };
}

/**
 * layer-map → 堆叠层组件：默认收起只显层名＋一句话；字段详情随 SSR 全量
 * 输出（无 JS 时经 :hover／:focus-within 原生可达，键盘 Tab 即展开，交互
 * 钉住/重播为渐进增强，见 theme/diagramEnhance.ts——降噪不变隐藏）。
 * 层宽自下而上递增（--lm-i 为自底深度，0 = 最底层）；浮现动画由 SSR 直出
 * .play 触发（CSS 实现，不依赖 JS），.lm-replay 按钮经客户端委托重启，
 * prefers-reduced-motion 下由 CSS 关停。
 */
function renderLayerMap(title: string, layers: LayerMapLayer[], base: string | null): string {
  const parts: string[] = ['<div class="lm play">'];
  parts.push(`<div class="lm-title">${escapeHtml(title)}</div>`);
  parts.push('<div class="lm-stage">');
  const n = layers.length;
  for (let i = 0; i < n; i++) {
    const layer = layers[i]!;
    const depth = n - 1 - i; // 自底深度：最底层 0，层宽最大
    // 浮现次序对齐 mockup：最底层最先，底座随后，再逐层向上（0.05/0.17/0.29/…）
    const delay = depth === 0 ? '0.05' : (0.17 + depth * 0.12).toFixed(2);
    parts.push(
      `<div class="lm-layer" style="--lm-i:${depth};--lm-delay:${delay}s" tabindex="0" role="button" aria-expanded="false">`
    );
    parts.push('<div class="lm-bar">');
    parts.push(`<span class="lm-zi">${escapeHtml(layer.name)}</span>`);
    if (layer.sub) parts.push(`<span class="lm-sub">${escapeHtml(layer.sub)}</span>`);
    parts.push(`<span class="lm-line">${escapeHtml(layer.line)}</span>`);
    if (layer.fields.length) parts.push('<span class="lm-hint">展开</span>');
    parts.push('</div>');
    if (layer.fields.length) {
      parts.push('<div class="lm-detail"><div class="lm-detail-in"><div class="lm-dims">');
      for (const field of layer.fields) {
        parts.push(
          `<div class="dim"><span class="dim-k">${escapeHtml(field.name)}</span>` +
            `<span class="dim-v">${escapeHtml(field.text)}</span></div>`
        );
      }
      parts.push('</div></div></div>');
    }
    parts.push('</div>');
  }
  if (base !== null) {
    parts.push(
      `<div class="lm-base" style="--lm-delay:0.17s"><span class="bt">底座</span>${escapeHtml(base)}</div>`
    );
  }
  parts.push('</div>');
  parts.push(
    '<div class="lm-tools"><button class="lm-replay" type="button">重播浮现动画</button>' +
      '<span class="lm-tip">悬停或点击层条展开字段详情；点击可钉住，再点收起。</span></div>'
  );
  parts.push('</div>');
  return parts.join('');
}

/* ------------------------------------------------------------------ *
 * flow-steps（契约 §5.5，视觉规格 content/editorial/mockup-diagrams.html 组件二节）
 * 行式词汇与 tools/content/check.ts 的 checkFlowStepsBody 同口径。
 * ------------------------------------------------------------------ */
const FS_STEP_RE = /^步\s+(.+)$/;
const FS_EXIT_PREFIX = '出口：';
const FS_DIVIDER_PREFIX = '分界：';
const FS_DEMO_RE = /^演示\s+(.+)$/;
/** 序号字（①~⑳）与尾部全角括号注记（信息类别 chip） */
const FS_NO_RE = /^([\u{2460}-\u{2473}]+)/u;
const FS_TAG_RE = /\s*（([^（）]+)）\s*$/;
/** 演示路径名中的步引用（跳①②／倒③），派生错误模式角标与分界汇流注记 */
const FS_DEMO_REF_RE = /(跳|倒)([\u{2460}-\u{2473}]+)/gu;
/** 分界行子句：`{步范围}之间 {标签}` 或 `{步号}旁 {标签}`（`；`分隔） */
const FS_DIVIDER_CLAUSE_RE = /^(.+?)(?:之间|旁)\s*(.+)$/;
const CIRCLED_BASE = 0x2460; // '①'

interface FlowStep {
  no: string | null;
  name: string;
  tag: string | null;
  input: string | null;
  output: string | null;
  fail: string | null;
  /** 分界"旁"注记挂到该步的小章（如 ⑤旁 盘后） */
  chips: string[];
}
interface FlowDemo {
  path: string;
  cost: string;
  refs: number[];
}
interface FlowDivider {
  /** 界于该步与下一步之间（步序号，1 起） */
  after: number;
  label: string;
  /** 引用跨此分界两步的演示行代价（错误模式注记） */
  costs: string[];
}
interface FlowData {
  steps: FlowStep[];
  exit: string | null;
  demos: FlowDemo[];
  dividers: FlowDivider[];
  /** 无法定位的子句原文（整行兜底注记，保证分界内容不丢失） */
  fallbackDivider: string | null;
  /** 无分支线性形态：全部步行无 ｜不通过 段且无出口行（契约 §5.5） */
  linear: boolean;
}

/**
 * 步行冒号后段序列解析：按契约顺序 `输入 …` → `→ 输出 …` → `｜不通过 …`
 * 依次可选、至少一段，段内容非空；无法归段的残文即未知段式抛错。
 * `｜不通过` 为段尾形态（其后文字整段归不通过处置），不做再扫描。
 * 与 check.ts 的 checkStepSegments 同口径。
 */
function parseStepSegments(restRaw: string, file: string, line: string): {
  input: string | null;
  output: string | null;
  fail: string | null;
} {
  const segs: { input: string | null; output: string | null; fail: string | null } = {
    input: null,
    output: null,
    fail: null,
  };
  let rest = restRaw;
  // 输入段（可选）：至 `→`／`｜` 边界
  if (rest.startsWith('输入')) {
    rest = rest.slice('输入'.length);
    const boundary = rest.search(/→|｜/);
    segs.input = (boundary < 0 ? rest : rest.slice(0, boundary)).trim();
    rest = boundary < 0 ? '' : rest.slice(boundary);
    if (!segs.input) {
      throw new Error(`${file}：flow-steps 步行"输入"段内容为空（契约 §5.5）：${line}`);
    }
  }
  // → 输出段（可选）：至 `｜` 边界
  if (rest.startsWith('→')) {
    const head = rest.match(/^→\s*输出/);
    if (!head) {
      throw new Error(
        `${file}：flow-steps 步行未知段式，"→"后应为"输出"（契约 §5.5）：${line}`
      );
    }
    rest = rest.slice(head[0].length);
    const boundary = rest.search(/｜/);
    segs.output = (boundary < 0 ? rest : rest.slice(0, boundary)).trim();
    rest = boundary < 0 ? '' : rest.slice(boundary);
    if (!segs.output) {
      throw new Error(`${file}：flow-steps 步行"输出"段内容为空（契约 §5.5）：${line}`);
    }
  }
  // ｜不通过段（可选，段尾即行尾）
  if (rest.startsWith('｜')) {
    const head = rest.match(/^｜\s*不通过/);
    if (!head) {
      throw new Error(
        `${file}：flow-steps 步行未知段式，"｜"后应为"不通过"（契约 §5.5）：${line}`
      );
    }
    rest = rest.slice(head[0].length);
    segs.fail = rest.trim();
    rest = '';
    if (!segs.fail) {
      throw new Error(`${file}：flow-steps 步行"不通过"段内容为空（契约 §5.5）：${line}`);
    }
  }
  if (rest.trim()) {
    throw new Error(
      `${file}：flow-steps 步行未知段式（仅允许 输入／→ 输出／｜不通过，按此顺序）：${rest.trim()}`
    );
  }
  if (segs.input === null && segs.output === null && segs.fail === null) {
    throw new Error(
      `${file}：flow-steps 步行冒号后至少一段（输入／→ 输出／｜不通过）（契约 §5.5）：${line}`
    );
  }
  return segs;
}

function demoStepRefs(path: string): number[] {
  const refs: number[] = [];
  for (const match of path.matchAll(FS_DEMO_REF_RE)) {
    for (const ch of match[2]!) {
      refs.push(ch.charCodeAt(0) - CIRCLED_BASE + 1);
    }
  }
  return refs;
}

/**
 * flow-steps 容器体解析：步行 ≥2、含 ｜不通过 段时出口行必填且恰 1 条、
 * 出口行／分界行各 ≤1、其余未知行式抛错（与 check.ts 同口径）。
 * 分界行子句 `③④之间 盘前｜盘中` 定位分界章、`⑤旁 盘后` 挂步骤小章；
 * 无法定位的子句整行保留为兜底注记（内容不丢失）。
 */
function parseFlowSteps(lines: string[], file: string): FlowData {
  const steps: FlowStep[] = [];
  const demos: FlowDemo[] = [];
  let exit: string | null = null;
  let dividerText: string | null = null;
  let hasFail = false;
  for (const line of lines) {
    if (line.startsWith(FS_EXIT_PREFIX)) {
      if (exit !== null) {
        throw new Error(`${file}：flow-steps 出口行至多一条（契约 §5.5）：${line}`);
      }
      exit = line.slice(FS_EXIT_PREFIX.length).trim();
      if (!exit) throw new Error(`${file}：flow-steps 出口行内容为空（契约 §5.5）`);
      continue;
    }
    if (line.startsWith(FS_DIVIDER_PREFIX)) {
      if (dividerText !== null) {
        throw new Error(`${file}：flow-steps 分界行至多一条（契约 §5.5）：${line}`);
      }
      dividerText = line.slice(FS_DIVIDER_PREFIX.length).trim();
      if (!dividerText) throw new Error(`${file}：flow-steps 分界行内容为空（契约 §5.5）`);
      continue;
    }
    const demoMatch = line.match(FS_DEMO_RE);
    if (demoMatch) {
      const colon = demoMatch[1]!.indexOf('：');
      if (colon < 0) {
        throw new Error(`${file}：flow-steps 演示行缺"路径名：代价"形态（契约 §5.5）：${line}`);
      }
      const path = demoMatch[1]!.slice(0, colon).trim();
      const cost = demoMatch[1]!.slice(colon + 1).trim();
      if (!path || !cost) {
        throw new Error(`${file}：flow-steps 演示行路径名与代价均不可为空（契约 §5.5）：${line}`);
      }
      demos.push({ path, cost, refs: demoStepRefs(path) });
      continue;
    }
    const stepMatch = line.match(FS_STEP_RE);
    if (stepMatch) {
      const colon = stepMatch[1]!.indexOf('：');
      if (colon < 0) {
        throw new Error(
          `${file}：flow-steps 步行缺冒号段（冒号后至少 输入／→ 输出／｜不通过 一段）（契约 §5.5）：${line}`
        );
      }
      let name = stepMatch[1]!.slice(0, colon).trim();
      if (!name) {
        throw new Error(`${file}：flow-steps 步行缺步名（契约 §5.5）：${line}`);
      }
      // 步名拆解：尾部（…）注记 → chip；前缀序号字 → 步号
      let tag: string | null = null;
      const tagMatch = name.match(FS_TAG_RE);
      if (tagMatch) {
        tag = tagMatch[1]!.trim();
        name = name.slice(0, tagMatch.index).trim();
      }
      let no: string | null = null;
      const noMatch = name.match(FS_NO_RE);
      if (noMatch) {
        no = noMatch[1]!;
        name = name.slice(noMatch[0].length).trim();
      }
      const segs = parseStepSegments(stepMatch[1]!.slice(colon + 1), file, line);
      if (segs.fail !== null) hasFail = true;
      steps.push({ no, name, tag, input: segs.input, output: segs.output, fail: segs.fail, chips: [] });
      continue;
    }
    throw new Error(
      `${file}：flow-steps 未知行式（契约 §5.5 仅允许 步行／出口行／分界行／演示行）：${line}`
    );
  }
  if (steps.length < 2) {
    throw new Error(`${file}：flow-steps 步行至少 2 条，实际 ${steps.length} 条（契约 §5.5）`);
  }
  if (hasFail && exit === null) {
    throw new Error(
      `${file}：flow-steps 含"｜不通过"段时出口行必填且恰 1 条，实际 0 条（契约 §5.5）`
    );
  }

  // 分界子句定位（在步行齐备后解析，便于按步序挂接与汇流注记）
  const dividers: FlowDivider[] = [];
  const fallback: string[] = [];
  if (dividerText !== null) {
    for (const rawClause of dividerText.split('；')) {
      const clause = rawClause.trim();
      if (!clause) continue;
      const clauseMatch = clause.match(FS_DIVIDER_CLAUSE_RE);
      const nums = (clause.match(/[\u{2460}-\u{2473}]/gu) ?? [])
        .map((ch) => ch.charCodeAt(0) - CIRCLED_BASE + 1)
        .filter((no) => no >= 1 && no <= steps.length);
      if (!clauseMatch || nums.length === 0) {
        fallback.push(clause);
        continue;
      }
      if (clauseMatch[0].includes('之间')) {
        if (nums.length < 2) {
          fallback.push(clause);
          continue;
        }
        const after = nums[0]!;
        const label = clauseMatch[2]!.trim();
        const costs = demos
          .filter((demo) => nums.every((no) => demo.refs.includes(no)))
          .map((demo) => `${demo.path}：${demo.cost}`);
        const existing = dividers.find((divider) => divider.after === after);
        if (existing) existing.label += `；${label}`;
        else dividers.push({ after, label, costs });
      } else {
        // `N旁 {标签}`：挂为该步小章 chip
        steps[nums[0]! - 1]!.chips.push(clauseMatch[2]!.trim());
      }
    }
  }

  return {
    steps,
    exit,
    demos,
    dividers,
    fallbackDivider: fallback.length ? fallback.join('；') : null,
    linear: !hasFail && exit === null,
  };
}

/** 步盒公共片段：步号＋步名＋（类别注记）＋分界旁注 chips */
function flowStepHead(step: FlowStep): string {
  const parts: string[] = [];
  if (step.no) parts.push(`<span class="no">${escapeHtml(step.no)}</span>`);
  parts.push(`<span class="nm">${escapeHtml(step.name)}</span>`);
  if (step.tag) parts.push(`<span class="chip acc">${escapeHtml(step.tag)}</span>`);
  for (const chip of step.chips) parts.push(`<span class="chip">${escapeHtml(chip)}</span>`);
  return `<div class="b-top">${parts.join('')}</div>`;
}

/** 步行"输入→输出"小字（右侧栏与线性形态共用） */
function flowStepIo(step: FlowStep): string {
  const segs: string[] = [];
  if (step.input) segs.push(`<span class="k">输入</span>${escapeHtml(step.input)}`);
  if (step.output) segs.push(`<span class="k">输出</span>${escapeHtml(step.output)}`);
  return segs.join('<br>');
}

/**
 * flow-steps → 竖向流程组件：分支形态为三列栅格（左轨"不通过"红线汇流
 * 统一出口框／中列步骤流／右列输入输出）；线性形态（全部步行无 ｜不通过
 * 段且无出口行）为简洁纵向步骤流。演示行经原生 <details> 开合（无 JS 亦可
 * 展开，内容不隐藏）；步骤盒点击高亮汇流路径与演示模式切换为渐进增强，
 * 见 theme/diagramEnhance.ts。全部文本经 escapeHtml。
 */
function renderFlowSteps(title: string, data: FlowData): string {
  const { steps, exit, demos, dividers, fallbackDivider, linear } = data;
  const n = steps.length;
  const firstFail = steps.findIndex((step) => step.fail !== null);
  const hasFail = firstFail >= 0;

  // 演示行派生错误模式角标：跳N → "跳过"、倒N → "倒置"
  const flags = new Map<number, Set<string>>();
  for (const demo of demos) {
    for (const match of demo.path.matchAll(FS_DEMO_REF_RE)) {
      const flag = match[1] === '跳' ? '跳过' : '倒置';
      for (const ch of match[2]!) {
        const no = ch.charCodeAt(0) - CIRCLED_BASE + 1;
        if (no >= 1 && no <= n) {
          if (!flags.has(no)) flags.set(no, new Set());
          flags.get(no)!.add(flag);
        }
      }
    }
  }

  // 左轨连线状态：首条不通过轨之前的格子无红线，其后（含分界/连接行）红线贯穿
  const railClass = (ord: number, extra = ''): string => {
    if (!hasFail || ord < firstFail + 1) return 'rail-off';
    const classes = ['rail'];
    if (ord === firstFail + 1) classes.push('r-first');
    if (extra) classes.push(extra);
    return classes.join(' ');
  };
  const railCell = (ord: number, step: FlowStep | null, extra = ''): string => {
    const cls = railClass(ord, extra);
    const inner =
      step && step.fail
        ? `<span class="dm"></span><span class="dm-t">不通过</span><span class="dm-x">${escapeHtml(step.fail)}</span>`
        : '';
    return `<div class="fcell ${cls}" data-ord="${ord}">${inner}</div>`;
  };

  const parts: string[] = [`<div class="fw${linear ? ' fw-linear' : ''}">`];
  parts.push(`<div class="flow-head"><div class="flow-title">${escapeHtml(title)}</div></div>`);

  if (linear) {
    // 无分支线性形态：纵向步骤流＋墨线下行箭头
    parts.push('<div class="lw-flow">');
    for (let i = 0; i < n; i++) {
      const step = steps[i]!;
      parts.push('<div class="lw-step">');
      parts.push(flowStepHead(step));
      if (step.input || step.output) {
        parts.push(`<div class="lw-io">${flowStepIo(step)}</div>`);
      }
      parts.push('</div>');
      const divider = dividers.find((candidate) => candidate.after === i + 1);
      if (divider) parts.push(`<div class="lw-div">${escapeHtml(divider.label)}</div>`);
    }
    if (fallbackDivider) parts.push(`<div class="lw-div">${escapeHtml(fallbackDivider)}</div>`);
    parts.push('</div>');
    parts.push('</div>');
    return parts.join('');
  }

  parts.push('<div class="flow-grid">');
  for (let i = 0; i < n; i++) {
    const step = steps[i]!;
    const ord = i + 1;
    const extra = ord === n ? 'r-last' : '';
    parts.push(railCell(ord, step, extra));
    const flagSet = flags.get(ord);
    const flagAttr = flagSet ? ` data-flag="${escapeHtml(Array.from(flagSet).join('·'))}"` : '';
    parts.push(
      `<div class="fcell box" data-s="${ord}"${flagAttr} tabindex="0" role="button" aria-pressed="false">`
    );
    parts.push(flowStepHead(step));
    parts.push('</div>');
    if (step.input || step.output) {
      parts.push(`<div class="fcell io"><span class="io-normal">${flowStepIo(step)}</span></div>`);
    } else {
      parts.push('<div class="fcell io"></div>');
    }
    // 步间隙：分界行在该位置取代下行连接箭头
    const divider = dividers.find((candidate) => candidate.after === ord);
    if (divider && ord < n) {
      parts.push(railCell(ord + 0.5, null));
      parts.push(
        `<div class="fcell divider"><span class="dv-line"></span>` +
          `<span class="dv-label">${escapeHtml(divider.label)}</span></div>`
      );
      const errNote = divider.costs.length
        ? `<span class="dv-err"><span class="bk"></span>` +
          `<span class="t">${divider.costs.map((cost) => escapeHtml(cost)).join('<br>')}</span></span>`
        : '';
      parts.push(`<div class="fcell io io-d">${errNote}</div>`);
    } else if (ord < n) {
      parts.push(railCell(ord + 0.5, null));
      parts.push('<div class="fcell conn"><span class="down"></span></div>');
      parts.push('<div class="fcell io io-c"></div>');
    }
  }
  if (fallbackDivider) {
    parts.push(`<div class="fcell fw-div-note">${escapeHtml(fallbackDivider)}</div>`);
  }
  if (exit !== null) {
    parts.push(
      `<div class="fcell exit"><div class="t">${escapeHtml(exit)}</div></div><div class="fcell io io-e"></div>`
    );
  }
  parts.push('</div>'); // .flow-grid

  if (demos.length) {
    parts.push('<details class="fw-demo"><summary>演示错误顺序</summary><div class="fw-demo-body">');
    for (const demo of demos) {
      parts.push(
        `<div class="fw-demo-item"><span class="eb">${escapeHtml(demo.path)}</span>${escapeHtml(demo.cost)}</div>`
      );
    }
    parts.push('</div></details>');
  }
  if (hasFail) {
    parts.push(
      '<div class="flow-foot">点击任一步：高亮该步及其"不通过"汇流路径（再点一次取消）；"演示错误顺序"切换错误走法注记。</div>'
    );
  }
  parts.push('</div>');
  return parts.join('');
}

/** 容器体行收集：容器体内只允许普通段落行（qa-cards 先例），出现列表/
 *  标题/围栏等块结构即未知内容抛错（不得静默丢弃后当行式漏检）。 */
function collectContainerLines(inner: MdToken[], file: string, type: string): string[] {
  const rows: string[] = [];
  for (const token of inner) {
    if (token.type === 'inline') rows.push(...token.content.split('\n'));
    else if (token.type !== 'paragraph_open' && token.type !== 'paragraph_close') {
      throw new Error(`${file}：${type} 容器体内出现非行式内容（契约 §5.4/§5.5）：${token.type}`);
    }
  }
  return rows.map((row) => row.replace(/\r/g, '').trim()).filter(Boolean);
}

/** 容器 token → 呈现标记；未知类型 / 未知槽位 / 非法形态抛错（构建期失败） */
function transformContainers(state: MdState, tokens: MdToken[], figures: FigureScan): MdToken[] {
  const result: MdToken[] = [];
  const opens: Array<{ info: string; inner: MdToken[] }> = [];
  for (const token of tokens) {
    if (token.type === 'thb_container_open') {
      opens.push({ info: token.info, inner: [] });
      continue;
    }
    if (token.type === 'thb_container_close') {
      const open = opens.pop();
      if (!open) {
        throw new Error(`${envFile(state)}：容器闭合 ::: 缺少打开行`);
      }
      const parts = open.info.trim().split(/\s+/);
      const [type, ...args] = parts;
      if (!CONTAINER_TYPES.has(type!)) {
        throw new Error(
          `${envFile(state)}：未知容器类型 "${type}"（仅允许 ${Array.from(CONTAINER_TYPES).join(' / ')}）`
        );
      }
      if (type === 'interactive') {
        const slotId = args[0];
        if (args.length !== 1 || !(SLOT_IDS as readonly string[]).includes(slotId!)) {
          throw new Error(
            `${envFile(state)}：interactive 槽位 id 非法 "${open.info.trim()}"（冻结清单：${SLOT_IDS.join(' / ')}）`
          );
        }
        if (open.inner.length) {
          throw new Error(`${envFile(state)}：interactive 容器体内必须为空（契约 §5.1）`);
        }
        // 组件标签由槽位注册表（theme/index.ts）按同一 id 注册后解析
        result.push(htmlToken(state, `<${slotId} />`));
        continue;
      }
      // qa-cards（契约 §5.3）：参数行 = 卡头题句（冒号后参数原样拼接）；
      // 容器体逐行解析为对答行（`序词：内容`）+ 至多一条结论行（`结论：` 开头，
      // 严格全角冒号形态，与 check.ts 同口径）。内容是读者可见正文（不参与
      // 字数剔除）；行级校验此处仅兜底（带行号的执法在 check.ts checkContainers）。
      if (type === 'qa-cards') {
        const rows: string[] = [];
        for (const token of open.inner) {
          if (token.type === 'inline') rows.push(...token.content.split('\n'));
        }
        const bodyLines = rows.map((row) => row.replace(/\r/g, '').trim()).filter(Boolean);
        const answers: string[] = [];
        let verdict: string | null = null;
        for (const line of bodyLines) {
          if (!line.startsWith(QA_CONCLUSION_PREFIX)) {
            answers.push(line);
            continue;
          }
          if (verdict !== null) {
            throw new Error(`${envFile(state)}：qa-cards 结论行至多一条（契约 §5.3）`);
          }
          verdict = line.slice(QA_CONCLUSION_PREFIX.length).trim();
        }
        if (!answers.length) {
          throw new Error(`${envFile(state)}：qa-cards 容器体至少需要一条对答行（契约 §5.3）`);
        }
        result.push(htmlToken(state, renderQaCards(args.join(' ').trim(), answers, verdict)));
        continue;
      }
      // layer-map（契约 §5.4）：参数行 = 图题；容器体逐行为层行/字段行/底座行，
      // 行级校验在此兜底（带行号的执法在 check.ts checkContainers）。
      // 内容是读者可见正文（不参与字数剔除）。
      if (type === 'layer-map') {
        const file = envFile(state);
        const bodyLines = collectContainerLines(open.inner, file, type);
        if (!bodyLines.length) {
          throw new Error(`${file}：layer-map 容器体不能为空（契约 §5.4）`);
        }
        const data = parseLayerMap(bodyLines, file);
        result.push(htmlToken(state, renderLayerMap(args.join(' ').trim(), data.layers, data.base)));
        continue;
      }
      // flow-steps（契约 §5.5）：参数行 = 图题；容器体逐行为步行/出口行/
      // 分界行/演示行。演示行数据按正文对照表口径（B3-C03 §三对照表）原样
      // 进组件，不在此再加工。
      if (type === 'flow-steps') {
        const file = envFile(state);
        const bodyLines = collectContainerLines(open.inner, file, type);
        if (!bodyLines.length) {
          throw new Error(`${file}：flow-steps 容器体不能为空（契约 §5.5）`);
        }
        const data = parseFlowSteps(bodyLines, file);
        result.push(htmlToken(state, renderFlowSteps(args.join(' ').trim(), data)));
        continue;
      }
      // figure-spec（D12 裁决）：成品图默认可见（不再置于折叠块内）；
      // 容器体内的制图说明原文是制图规格，撤出读者视野——渲染输出只保留图本身。
      // md 源与 L2 校验语义不变（说明文字仍是契约 §5.2 的输入，仅供制图与校验）。
      if (args.length) {
        throw new Error(`${envFile(state)}：figure-spec 容器不接受参数`);
      }
      // 编号按章内容器出现顺序从 1 起（契约 §5.2 查找键 <章id>-fig<n>）
      const figNo = ++figures.counter.value;
      if (figures.figuresDir) {
        const image = figureToken(state, figures.figuresDir, figures.chapterId, figNo, figures.base);
        if (image) {
          result.push(htmlToken(state, '<figure class="figure-block">'));
          result.push(image);
          result.push(htmlToken(state, '</figure>'));
          continue;
        }
      }
      // 无成品图：不渲染任何块（说明文字全文是制图规格提示词，对读者无阅读价值；
      // 有图注数据需求时再按契约 §9 立项）
      continue;
    }
    if (opens.length) {
      opens[opens.length - 1]!.inner.push(token);
    } else {
      result.push(token);
    }
  }
  if (opens.length) {
    throw new Error(`${envFile(state)}：容器 "${opens[0]!.info}" 未闭合`);
  }
  return result;
}

/** 站点框架页组件：`html:false` 下是普通文本段落，这里转回组件标签 */
function transformFrameComponents(state: MdState, tokens: MdToken[]): MdToken[] {
  const result: MdToken[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (isTopParagraph(tokens, i)) {
      const text = paragraphText(tokens, i);
      const match = text.match(FRAME_COMPONENT_RE);
      if (match) {
        result.push(htmlToken(state, `<${match[1]} />`));
        i += 2;
        continue;
      }
    }
    result.push(token);
  }
  return result;
}

/** 跳过 code_inline，防止代码示例里的示例语法被误转换 */
function transformInline(state: MdState, children: MdToken[]): MdToken[] {
  const result: MdToken[] = [];
  for (const token of children) {
    if (token.type !== 'text') {
      result.push(token);
      continue;
    }
    const content = token.content;
    // 快速路径按"【待核验"前缀判断（同时覆盖无说明与带说明两种变体）
    if (!/〔B[1-8]-C\d{2}〕|【待核验/.test(content)) {
      result.push(token);
      continue;
    }
    XREF_TOKEN_RE.lastIndex = 0;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = XREF_TOKEN_RE.exec(content)) !== null) {
      if (match.index > last) {
        result.push(textToken(state, content.slice(last, match.index)));
      }
      if (match[1] && match[2]) {
        // 契约目标路由：/b{n}/c{nn}.html（rewrite 后真实存在，死链检查通过）
        const volumeSlug = match[1].toLowerCase();
        const chapterNo = match[2].slice(1).toLowerCase();
        const open = new state.Token('link_open', 'a', 1);
        open.attrSet('href', `/${volumeSlug}/c${chapterNo}.html`);
        open.attrSet('class', 'xref');
        result.push(open, textToken(state, match[0]), new state.Token('link_close', 'a', -1));
      } else {
        // D46 核验标记去字面化：上标 ※（册色、小号），hover title 提示。
        // 无说明形态用统一默认文案；变体【待核验：说明】的说明文字是语义内容，
        // 完整进入 title（escapeHtml 转义引号等属性字符）。
        const note = (match[3] ?? '').trim();
        const title = note ? `待核验：${note}` : VERIFY_MARK_TITLE;
        const badge = new state.Token('html_inline', '', 0);
        badge.content = `<sup class="verify-mark" title="${escapeHtml(title)}">※</sup>`;
        result.push(badge);
      }
      last = XREF_TOKEN_RE.lastIndex;
    }
    if (last < content.length) {
      result.push(textToken(state, content.slice(last)));
    }
  }
  return result;
}

function paragraphText(tokens: MdToken[], openIndex: number): string {
  const inline = tokens[openIndex + 1];
  return inline && inline.type === 'inline' ? inline.content : '';
}

function isTopParagraph(tokens: MdToken[], index: number): boolean {
  return tokens[index]!.type === 'paragraph_open' && tokens[index]!.level === 0;
}

function findClose(tokens: MdToken[], start: number, closeType: string): number {
  const openType = closeType.replace(/_close$/, '_open');
  let depth = 0;
  for (let i = start + 1; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (token.type === closeType) {
      if (depth === 0) return i;
      depth--;
    } else if (token.type === openType) {
      depth++;
    }
  }
  throw new Error(`未闭合的 token：${closeType}`);
}

/** 速查卡内纯加粗段落 → 卡片小标题；`注：` 段落 → 表注 */
function classifyParagraphs(tokens: MdToken[]): void {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (!isTopParagraph(tokens, i)) continue;
    const text = paragraphText(tokens, i);
    if (CHEAT_TITLE_RE.test(text)) {
      token.attrSet('class', 'cc-title');
    } else if (NOTE_RE.test(text)) {
      token.attrSet('class', 'table-note');
    }
  }
}

/** 自测题组：题面进 summary，答案进折叠体 */
function transformQuizzes(state: MdState, tokens: MdToken[]): MdToken[] {
  const groupStarts: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (isTopParagraph(tokens, i) && QUIZ_RE.test(paragraphText(tokens, i))) {
      groupStarts.push(i);
    }
  }
  if (!groupStarts.length) return tokens;

  const result: MdToken[] = [];
  let cursor = 0;
  for (let g = 0; g < groupStarts.length; g++) {
    const start = groupStarts[g]!;
    const end = g + 1 < groupStarts.length ? groupStarts[g + 1]! : tokens.length;
    result.push(...tokens.slice(cursor, start));
    result.push(htmlToken(state, '<details class="quiz"><summary><div class="quiz-question">'));
    result.push(tokens[start]!, tokens[start + 1]!, tokens[start + 2]!);
    result.push(htmlToken(state, '</div></summary><div class="quiz-body">'));
    result.push(...tokens.slice(start + 3, end));
    result.push(htmlToken(state, '</div></details>'));
    cursor = end;
  }
  result.push(...tokens.slice(cursor));
  return result;
}

/** 误区组：`**误区…**` 段落变成标注标题，其余内容包进 warn callout */
function transformMisconceptions(md: MdLike, state: MdState, tokens: MdToken[]): MdToken[] {
  const groupStarts: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (isTopParagraph(tokens, i) && MISCONCEPTION_RE.test(paragraphText(tokens, i))) {
      groupStarts.push(i);
    }
  }
  if (!groupStarts.length) return tokens;

  const result: MdToken[] = [];
  let cursor = 0;
  for (let g = 0; g < groupStarts.length; g++) {
    const start = groupStarts[g]!;
    const end = g + 1 < groupStarts.length ? groupStarts[g + 1]! : tokens.length;
    result.push(...tokens.slice(cursor, start));
    const head = paragraphText(tokens, start)
      .replace(/^\*\*/, '')
      .replace(/\*\*$/, '')
      .trim();
    result.push(
      htmlToken(state, `<div class="callout callout-warn"><div class="callout-title">${md.renderInline(head)}</div>`)
    );
    result.push(...tokens.slice(start + 3, end));
    result.push(htmlToken(state, '</div>'));
    cursor = end;
  }
  result.push(...tokens.slice(cursor));
  return result;
}

/** 公式引用块与表格的 class / 滚动容器 */
function transformBlocks(state: MdState, tokens: MdToken[]): MdToken[] {
  const result: MdToken[] = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i]!;
    if (token.type === 'blockquote_open' && token.level === 0) {
      const close = findClose(tokens, i, 'blockquote_close');
      const text = tokens
        .slice(i, close)
        .filter((t) => t.type === 'inline')
        .map((t) => t.content)
        .join(' ');
      if (text.length < 220 && FORMULA_TEST_RE.test(text)) {
        token.attrSet('class', 'formula-block');
      }
    }
    if (token.type === 'table_open') {
      token.attrSet('class', 'data-table');
      if (token.level === 0) {
        const close = findClose(tokens, i, 'table_close');
        result.push(htmlToken(state, '<div class="table-scroll">'));
        result.push(...tokens.slice(i, close + 1));
        result.push(htmlToken(state, '</div>'));
        i = close + 1;
        continue;
      }
    }
    result.push(token);
    i++;
  }
  return result;
}

interface Section {
  title: string;
  headingFrom: number;
  bodyFrom: number;
  to: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const contentPlugin: ContentPlugin = (md, options = {}) => {
  const figuresDir = options.figuresDir;
  const base = options.base ?? '/';
  md.block.ruler.before('fence', 'thb_container', containerRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
  md.core.ruler.push('thb_handbook_content', (state) => {
    let tokens = state.tokens;

    // 1. 行内转换：交叉引用 → 链接；【待核验】/【待核验：说明】→ 上标 ※ 核验标记
    for (const token of tokens) {
      if (token.type === 'inline' && token.children) {
        token.children = transformInline(state, token.children);
      }
    }

    // 2. 容器与站点框架组件 → 呈现标记（未知容器类型 / 槽位在此抛错）
    //    成品图编号按本章文档顺序从 1 起（契约 §5.2 查找键 <章id>-fig<n>）
    const fm = state.env?.frontmatter as Record<string, unknown> | undefined;
    const chapterId = typeof fm?.chapter_id === 'string' ? fm.chapter_id : '';
    tokens = transformContainers(state, tokens, {
      figuresDir,
      base,
      chapterId,
      counter: { value: 0 },
    });
    tokens = transformFrameComponents(state, tokens);

    // 3. 全局块级 class：h3/h4 小节标题
    for (const token of tokens) {
      if (token.type !== 'heading_open') continue;
      if (token.tag === 'h3') token.attrSet('class', 'sub-title');
      if (token.tag === 'h4') token.attrSet('class', 'sub-sub-title');
    }

    // 4. 切分 h2 小节
    const sections: Section[] = [];
    let current: Section | null = null;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]!;
      if (token.type === 'heading_open' && token.tag === 'h2') {
        if (current) {
          current.to = i;
          sections.push(current);
        }
        const title = tokens[i + 1]?.content.trim() ?? '';
        current = { title, headingFrom: i, bodyFrom: i + 3, to: tokens.length };
        i += 2;
      }
    }
    if (current) sections.push(current);

    const result: MdToken[] = [];

    // 5. 章节页头（frontmatter 驱动，不进 outline）
    const envPath = ((state.env?.path as string | undefined) ?? '').replace(/\\/g, '/');
    const title = typeof fm?.title === 'string' ? fm.title : '';
    // env.path 可能是绝对源文件路径或 rewrite 后的相对路径，统一按路径段匹配 Bn/
    if (/(?:^|\/)b\d\//i.test(envPath) && title) {
      const metaParts = [`对应 ${chapterId}`];
      if (Array.isArray(fm?.new_terms) && fm.new_terms.length) {
        metaParts.push(`新术语 ${(fm.new_terms as string[]).length} 个`);
      }
      result.push(
        htmlToken(
          state,
          `<header class="chapter-head"><h1 class="chapter-title">${escapeHtml(title)}</h1>` +
            `<p class="chapter-meta">${escapeHtml(metaParts.join(' · '))}</p></header>`
        )
      );
    }

    // 注入章头的 token 数（0 或 1）：决定末尾前导内容的回插位置（见步骤 7）
    const headerCount = result.length;

    // 6. 逐节应用语义转换并包上 data-section 容器
    for (const section of sections) {
      let body = tokens.slice(section.bodyFrom, section.to);
      classifyParagraphs(body);
      if (section.title === '自测题') body = transformQuizzes(state, body);
      if (section.title === '常见误区') body = transformMisconceptions(md, state, body);
      body = transformBlocks(state, body);
      result.push(tokens[section.headingFrom]!, tokens[section.headingFrom + 1]!, tokens[section.headingFrom + 2]!);
      // 选读提示条（契约 §6.3 选读层）：仅 延伸与链接 节注入，置于节标题与本节容器之间
      if (section.title === '延伸与链接') {
        result.push(htmlToken(state, EXT_NOTE_HTML));
      }
      result.push(htmlToken(state, `<div class="sec" data-section="${escapeHtml(section.title)}">`));
      result.push(...body);
      result.push(htmlToken(state, '</div>'));
    }

    // 7. 前导内容（章节应有 frontmatter；框架页无 h2 小节，全部原样保留）。
    //    F-015①′：回插点在注入章头（h1）之后——章首截稿块等前导内容属于
    //    章标题与正文之间的过渡带，不得出现在章标题之上。仅改插入位置；
    //    figure 注入与其他前导 token 的内容与相对顺序不变（框架页无章头时
    //    headerCount = 0，行为与旧 unshift 完全一致）。
    const firstSectionFrom = sections[0]?.headingFrom ?? tokens.length;
    if (firstSectionFrom > 0) {
      result.splice(headerCount, 0, ...tokens.slice(0, firstSectionFrom));
    }

    state.tokens = result;
  });

  // table_open 覆写（F-024 侧一，D48）：VitePress 在其内部 markdown 配置里
  // 硬编码了 table_open 渲染器（固定输出 `<table tabindex="0">`，完全无视
  // token 属性），transformBlocks 给 table_open 设的 class="data-table" 因此
  // 从未落进产物。本插件经 config.mts 的 markdown.config 回调注册，晚于
  // VitePress 自身的规则赋值，此处覆盖使其尊重 token attrs；tabindex="0"
  // （表格窄屏键盘滚动无障碍）按 VitePress 原行为保留。
  md.renderer.rules.table_open = (tokens, idx) =>
    `<table${md.renderer.renderAttrs(tokens[idx]!)} tabindex="0">\n`;
};

export default contentPlugin;
