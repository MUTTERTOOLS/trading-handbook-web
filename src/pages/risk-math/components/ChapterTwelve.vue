<script setup lang="ts">
import Callout from '@/shared/components/Callout.vue';
import ChapterHead from '@/shared/components/ChapterHead.vue';
import GoalsCard from '@/shared/components/GoalsCard.vue';
import OpeningBox from '@/shared/components/OpeningBox.vue';
import QuizItem from '@/shared/components/QuizItem.vue';

const formulaTable = [
  { f: '单笔期望 E = 胜率 × 平均盈利 − 败率 × 平均亏损 − 摩擦成本', eg: 'EX-F：40%×6% − 60%×2% − 0.2% = +1.0%/笔', see: '〔B1-C03〕' },
  { f: '盈亏平衡胜率 p = 1 ÷ (1 + 盈亏比)（不计成本）', eg: '盈亏比 2 → 1÷3 ≈ 33.3%', see: '〔B3-C08〕' },
  { f: '买入股数 = 本金 × 单笔风险比例 ÷（入场价 − 止损价 + 预估滑点/跳空缓冲），向下取整到最小交易单位', eg: 'EX-B：100,000×1%÷0.55 ≈ 1,818 → 1,800 股', see: '〔B3-C04〕' },
  { f: '最坏跳空约束：单笔仓位占比 ≤ 单笔风险比例 ÷ 最坏跳空亏损幅度', eg: 'EX-C：1%÷20% = 5%（5,000 元）', see: '〔B3-C06〕' },
  { f: '盈亏比（比）= (目标价 − 入场价) ÷ (入场价 − 止损价)，与仓位无关', eg: '(11.00−10.00) ÷ (10.00−9.50) = 2', see: '〔B3-C08〕' },
  { f: '胜率标准误 SE = √[p(1−p) ÷ n]。95% 区间约 ±2SE。', eg: 'EX-L：n=100，p=50% → SE = 5.0 个百分点', see: '〔B6-C03〕' },
  { f: '熔断线 = min（高分位最大回撤 × 1.5，H）', eg: 'EX-K：min（9%，15%）= 9%', see: '〔B3-C10〕' },
  { f: '仓位反推条件：高分位预期最大回撤 × 1.5 ≤ H，否则按比例降低单笔风险（回撤近似与风险比例成正比）', eg: 'EX-K：12%×1.5 = 18% > 15% → 1% 降到 0.5%', see: '〔B3-C10〕' },
];
const refTable = [
  { item: '单笔风险', ref: '0.5%~1%，上限 2%' },
  { item: '单票持仓上限', ref: '15%~20%（统一写 20%；门派 D 建议 ≤15%；宽基 ETF 除外）' },
  { item: '在途总风险上限', ref: '4%~6%（统一写 5%）' },
  { item: '账户硬上限 H', ref: '15%（可取 12%~15%）' },
  { item: '熔断倍数', ref: '1.5' },
  { item: '杠杆', ref: '零' },
  { item: '回测数据长度', ref: '10 年以上，覆盖牛熊震荡' },
  { item: '样本外占比', ref: '≥30%，且只用一次' },
  { item: '前向实盘', ref: '30~50 笔；低频策略按周期数（6~12 个月）' },
  { item: '价值派分散度', ref: '5~8 只、跨行业' },
  { item: '门派拆解时间盒', ref: '深度拆解 2~3 个，4~6 周内必须选定一个' },
  { item: '重大违规 / 整体违规率目标', ref: '重大 0 次；整体 ≤5%~10%' },
  { item: '回测滑点假设', ref: '单边 0.05%~0.2%（视流动性）' },
  { item: '资金期限（定投）', ref: '5~10 年内不用' },
];
const calibTable = [
  { item: '我的 1R', std: '本金 × 单笔风险比例（0.5%~1%，上限 2%）', mine: '______ 元' },
  { item: '我的单票上限', std: '20%（门派 D ≤15%，宽基 ETF 除外）', mine: '______ %' },
  { item: '我的总风险上限（在途总风险）', std: '5%，同板块合并计算', mine: '______ %' },
  { item: '我的 H', std: '15%（可取 12%~15%）', mine: '______ %' },
  { item: '我的熔断线', std: 'min（回测高分位最大回撤 × 1.5，H）', mine: '______ %' },
];
const checklist = [
  { no: 1, item: '环境', std: '符合事先写明的环境过滤规则；临时想加条件算不通过' },
  { no: 2, item: '结构', std: '用已选定门派的书面规则（待验证假设）；临时起意不开' },
  { no: 3, item: '1R', std: '本笔 1R = 本金 × 单笔风险比例（0.5%~1%，上限 2%）已算出' },
  { no: 4, item: '止损位', std: '止损价落在买入逻辑失效的位置；"我想亏到这里"不算数' },
  { no: 5, item: '股数取整', std: '按公式反推，向下取整到最小交易单位' },
  { no: 6, item: '实际计划亏损 ≤ 1R', std: '取整后 ≤ 1R；大于 1R 一律不开仓（缩小到最小可行单位、改用 ETF 或放弃）' },
  { no: 7, item: '单票上限', std: '加上本笔 ≤ 20%（门派 D ≤15%，宽基 ETF 除外）' },
  { no: 8, item: '在途总风险', std: '加上本笔 ≤ 5%；同板块持仓合并计算' },
  { no: 9, item: '退出条件写好', std: '止损、时间止损等触发语句已写进盘前快照（〔B7-C03〕）' },
];
</script>

<template>
  <section id="c12" class="section">
    <ChapterHead tag="§12 · 对应 B3-C12" src="全章约 3,300 字（速查类）· 把册三压成一页纸">
        <h2>风控速查卡</h2>
      </ChapterHead>

    <OpeningBox>
      <p>
        周一开盘前二十分钟，小明想复查下周要开的那笔仓：先看什么、再算什么、哪个数字不能越过哪条线，一时想不全。
        他找出一张纸，写下流程的顺序、公式的样子、几个关键数字、九个勾。<strong>本章就是这张纸。</strong>
      </p>
    </OpeningBox>

    <Callout variant="key" title="一句话结论">
      <p>风控能压成一页纸：五个步骤、八个公式、一组参考值、九项检查；数字先经个人校准，再进场使用。</p>
    </Callout>

    <GoalsCard>
        <ol class="goals-list">
        <li>能默写五步决策顺序、七种合法退出的名称与 8 条公式，并说出这些数字均为起步参考值，需个人校准。</li>
        <li>能用开仓前 9 项检查表核对一笔准备开的仓，判断通过、缩小还是放弃。</li>
        <li>能算出自己的 1R、单票上限、总风险上限、H 与熔断线，填完个人校准表。</li>
      </ol>
      </GoalsCard>

    <h3 id="c12-s1" class="sub-title" data-spy>一、先顺序，后数字</h3>
    <p>本章没有新概念，只把册三的结论按使用顺序排好。顺序先于数字：顺序错了，数字再准也拦不住亏损。</p>
    <p><strong>五步决策顺序</strong>（每步不通过，不进入下一步）：看环境（时/风）→ 选结构（工具）→ 算止损与仓位（仓）→ 等触发（价/量）→ 盘后对账（心）。</p>
    <p>
      <strong>七种合法退出</strong>（退出规则在买入前写好）：
      ①开仓逻辑被证伪（止损/跟踪止盈）②边际赔率恶化（目标止盈）③时间止损④机会成本换仓⑤组合再平衡⑥熔断强制减仓/平仓⑦账户外现金需求。
    </p>
    <p class="table-note">两张名单来自〔B3-C03〕与〔B3-C09〕，是全丛书统一写法，含义回原章看。</p>

    <h3 id="c12-s2" class="sub-title" data-spy>二、公式总表：8 条</h3>
    <p>下表与全丛书常量表逐字一致；每条附一行算例，完整推导见"详见"列。</p>
    <table class="data-table">
      <thead><tr><th>公式（与常量表逐字一致）</th><th>一行算例</th><th>详见</th></tr></thead>
      <tbody>
        <tr v-for="row in formulaTable" :key="row.f">
          <td>{{ row.f }}</td>
          <td class="mono">{{ row.eg }}</td>
          <td class="mono">{{ row.see }}</td>
        </tr>
      </tbody>
    </table>
    <p class="table-note">
      两条边界：公式只限制正常成交下的亏损，跳空、跌停、停牌不在其内（〔B3-C06〕）；E &gt; 0 只是必要条件，还须与基准比较（〔B6-C10〕）。
    </p>

    <h3 id="c12-s3" class="sub-title" data-spy>三、起步参考值总表</h3>
    <p>下表全部为起步参考值，需个人校准；不是标准，不是行业规定。</p>
    <table class="data-table">
      <thead><tr><th>项目</th><th>参考值</th></tr></thead>
      <tbody>
        <tr v-for="row in refTable" :key="row.item">
          <td>{{ row.item }}</td>
          <td class="mono highlight">{{ row.ref }}</td>
        </tr>
      </tbody>
    </table>
    <p class="table-note">
      两个口径在此分开：<strong>滑点缓冲</strong>是仓位公式里每股风险的余量（EX-B 的 0.05 元），
      <strong>滑点假设</strong>是回测成本参数（单边 0.05%~0.2%），两者不能互相替代。
    </p>

    <h3 id="c12-s4" class="sub-title" data-spy>四、熔断流程：四步走</h3>
    <p>
      熔断线由回撤定义，不由连亏笔数定义——连亏是常态（EX-R），拿连亏次数当停手标准，会在正常回撤里反复停开。
    </p>
    <ol>
      <li><strong>触发。</strong>回撤从净值历史高点算起，触及熔断线 = min（回测高分位最大回撤 × 1.5，H）。</li>
      <li><strong>停手。</strong>停止开新仓，按写好的规则执行熔断强制减仓或平仓（七种退出的第 6 种）。</li>
      <li><strong>排查。</strong>顺序固定：心（执行偏差）→ 时（行情切换磨损）→ 策略（逻辑前提被破坏）；亏损按方差 / 执行偏差 / 策略失效三类归因。</li>
      <li><strong>复工。</strong>复工条件全部通过再复工，缺一项继续停。</li>
    </ol>
    <p>
      分布内不缩仓、不换策略；环境过滤器是事前写进规则的条件（〔B7-C05〕），回撤后临时缩仓不是。
      EX-K 反推：99 分位回撤 12%（单笔 1%）→ ×1.5 = 18% &gt; 15% → 风险降到 0.5%，熔断线 = min（9%，15%）= 9%。
    </p>

    <h3 id="c12-s5" class="sub-title" data-spy>五、个人校准表与开仓前 9 项检查表</h3>
    <p><strong>个人校准表</strong>（本金 = 下单当天盘前账户总权益，即现金加持仓市值）：</p>
    <table class="data-table">
      <thead><tr><th>项目</th><th>参考口径</th><th>我的数字（填空）</th></tr></thead>
      <tbody>
        <tr v-for="row in calibTable" :key="row.item">
          <td>{{ row.item }}</td>
          <td>{{ row.std }}</td>
          <td class="mono highlight">{{ row.mine }}</td>
        </tr>
      </tbody>
    </table>
    <p>
      五个格子填完，这张卡才是你的；改动口径要回熔断反推与验证流程找支持（〔B3-C10〕、〔B6-C12〕）。
    </p>
    <p><strong>开仓前 9 项检查表</strong>（对应第 3 步，九项全部打勾才进入"等触发"）：</p>
    <table class="data-table">
      <thead><tr><th>#</th><th>检查项</th><th>合格标准</th><th>通过</th></tr></thead>
      <tbody>
        <tr v-for="row in checklist" :key="row.no">
          <td class="mono">{{ row.no }}</td>
          <td>{{ row.item }}</td>
          <td>{{ row.std }}</td>
          <td class="mono">□</td>
        </tr>
      </tbody>
    </table>
    <div class="callout callout-key">
      <div class="callout-title">任何一项空着</div>
      <p><strong>只有三个选择：等、缩、放弃。</strong></p>
    </div>

    <h3 id="c12-m" class="sub-title" data-spy>常见误区</h3>
    <Callout variant="warn" title="误区一：“数字是现成的，照抄就能用。”">
      <p>
        <strong>为什么错：</strong>起步参考值是默认起点，不是为你校准的结果。
        本金与承受力不同，同样的 1% 意义完全不同；未校准就实盘，等于用别人的预算花自己的钱。
      </p>
      <p><strong>正确做法：</strong>先填个人校准表，再实盘。</p>
    </Callout>
    <Callout variant="warn" title="误区二：“检查表是走形式，行情好可以省几项。”">
      <p>
        <strong>为什么错：</strong>检查表的作用是在你最想开仓时拦住你；省略的那一项，常是亏损时缺的那一项。
        跳过检查即使盈利也记违规（〔B7-C09〕）。
      </p>
      <p><strong>正确做法：</strong>九项全过才开仓。想省时间，提前写好触发语句，而不是少查几项。</p>
    </Callout>
    <Callout variant="warn" title="误区三：“熔断是认输，停手后要尽快赚回来。”">
      <p>
        <strong>为什么错：</strong>熔断是流程的一环。触发后急于回本，容易滑向报复交易和盘中改规则；
        亏损先按三类归因排查。
      </p>
      <p><strong>正确做法：</strong>走完四步：触发 → 停手 → 排查（心→时→策略）→ 复工条件全部通过再复工。</p>
    </Callout>

    <h3 id="c12-z" class="sub-title" data-spy>自测题</h3>
    <QuizItem>
      <template #q>题 1：本金 100,000 元，单笔风险 1%。入场 10.00 元，止损 9.50 元，缓冲 0.05 元；最坏跳空估计 25%；已有在途计划亏损 3,000 元。按 9 项检查，最多开多少股？</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>每股风险 0.55 元，1,000÷0.55 ≈ 1,818 → 1,800 股（EX-B）。但最坏跳空约束：仓位 ≤ 1%÷25% = 4%，即 400 股。按 400 股：计划亏损 220 元 ≤ 1R；在途 3,220 元（3.22%）≤ 5%；单票 4% ≤ 20%。最多 400 股；想开满 1,800 股只能换标的或放弃。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 2：某策略单笔风险 1%，回测 99 分位最大回撤 8%，H 取 15%。①熔断线是多少？②回撤 4.9%（连亏 5 笔）时该停手、该临时缩仓吗？</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>① min（8%×1.5，15%）= 12%。② 4.9% &lt; 12%，未触发。连亏在分布之内（EX-R：胜率 50% 时 100 笔期望最长连亏约 6 笔），不停手、不临时缩仓；对照记账与影子账户查执行偏差（〔B7-C04〕），继续按规则执行。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 3：各违反 9 项检查中的哪一项（或没有违反）？a. "止损还没想好，先买 100 股试试，破位再补。" b. "实际计划亏损 1,050 元，比 1R 多 50 元，差不多，开吧。" c. "规则写明指数低于 60 日线不开新仓；今天指数在 60 日线上方。"</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>a. 违反第 4 项与第 9 项；"破位再补"还是亏损加仓结构（〔B3-C02〕）。b. 违反第 6 项：大于 1R 一律不开仓，缩小到最小可行单位、改用 ETF 或放弃。c. 没有违反，第 1 项通过；标准是"符合事先写明的规则"，不是"我感觉行情不错"。</p>
      </template>
    </QuizItem>

    <h3 id="c12-c" class="sub-title" data-spy>速查卡</h3>
    <div class="cheat-card">
      <p><strong>五步</strong>：看环境（时/风）→ 选结构（工具）→ 算止损与仓位（仓）→ 等触发（价/量）→ 盘后对账（心）</p>
      <p><strong>公式 8 条</strong>：全文与常量表逐字一致，见上文公式总表。</p>
      <p>
        <strong>数字速记</strong>（起步参考值）：单笔 0.5%~1%（上限 2%）｜单票 20%（门派 D ≤15%，宽基 ETF 除外）｜
        在途总风险 5%｜H = 15%｜熔断倍数 1.5｜杠杆零——验证类参考值见上文总表。
      </p>
      <p>
        <strong>九项检查</strong>：环境｜结构｜1R｜止损位｜股数取整｜实际计划亏损 ≤1R（大于 1R 一律不开仓）｜单票上限｜在途总风险｜退出条件写好——九项全过才开仓。
      </p>
      <p><strong>EX-B 参考答案</strong>：本金 100,000 → 1R = 1,000 → 入场 10.00、止损 9.50、缓冲 0.05 → 1,800 股，18,000 元（18%），实际最大计划亏损 990 元。</p>
      <p><strong>以上数值均为起步参考值，需个人校准。</strong></p>
    </div>
    <p class="table-note">
      章源：〔B3-C01〕回本表｜〔B3-C02〕破产结构｜〔B3-C03〕五步顺序｜〔B3-C04〕1R 与六步走｜〔B3-C05〕止损三法｜〔B3-C06〕跳空仓位｜〔B3-C07〕在途风险｜〔B3-C08〕配平｜〔B3-C09〕退出语句｜〔B3-C10〕熔断复工｜〔B3-C11〕零杠杆与资金分层。
      跨册：〔B2-C04〕〔B2-C05〕〔B6-C03〕〔B6-C09〕〔B7-C03〕〔B7-C04〕〔B7-C05〕〔B7-C09〕
    </p>
  </section>
</template>
