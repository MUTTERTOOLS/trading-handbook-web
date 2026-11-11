<script setup lang="ts">
import Callout from '@/shared/components/Callout.vue';
import ChapterHead from '@/shared/components/ChapterHead.vue';
import GoalsCard from '@/shared/components/GoalsCard.vue';
import OpeningBox from '@/shared/components/OpeningBox.vue';
import QuizItem from '@/shared/components/QuizItem.vue';
import GapConstraint from '@/widgets/.vue';

const planActualTable = [
  { item: '卖出价', plan: '9.50 元', actual: '8.00 元附近' },
  { item: '亏损金额', plan: '1,000 元', actual: '4,000 元' },
  { item: '占本金', plan: '1%', actual: '4%' },
  { item: '实际 ÷ 计划', plan: '—', actual: '4 倍' },
];
const gapPosTable = [
  { pos: '5%', gap: '−20%', loss: '1%' },
  { pos: '20%', gap: '−20%', loss: '4%' },
  { pos: '50%', gap: '−20%', loss: '10%' },
  { pos: '100%', gap: '−20%', loss: '20%' },
];
const gapEstTable = [
  { type: '宽基 ETF', est: '5%', cap: '1% ÷ 5% = 20%' },
  { type: '大盘、成交活跃个股', est: '10%', cap: '1% ÷ 10% = 10%' },
  { type: '小盘或临近事件个股', est: '25%', cap: '1% ÷ 25% = 4%' },
];
const fourGatesTable = [
  { gate: '仓位公式（〔B3-C04〕）', manages: '正常成交下的亏损 ≤ 1R', ref: '单笔风险 0.5%~1%，上限 2%' },
  { gate: '最坏跳空约束（本章）', manages: '止损失效下的亏损 ≤ 1R', ref: '按标的估计' },
  { gate: '单票上限', manages: '单只标的的集中度', ref: '20%（宽基 ETF 除外）' },
  { gate: '在途总风险（〔B3-C07〕）', manages: '全部持仓同时触发的总亏损', ref: '5%' },
];
</script>

<template>
  <section id="c06" class="section">
    <ChapterHead tag="§6 · 对应 B3-C06" src="全章约 4,600 字 · 统一算例 EX-A / EX-B / EX-C / EX-H">
        <h2>止损的局限：跳空与流动性缺失</h2>
      </ChapterHead>

    <OpeningBox>
      <p>
        小明按〔B3-C04〕的六步走买入了甲股份：1R 定为 1,000 元，买 2,000 股，止损价 9.50 元，还在软件里挂好了条件单（一种自动止损委托）。
        当晚，公司发布一条意外的坏消息（虚构情景）。第二天开盘，价格直接开在 8.00 元，比止损价低了一大截。
        条件单触发了，但成交价在 8.00 元附近，不是 9.50 元。卖出后他一算：<strong>亏 4,000 元，是计划 1,000 元的 4 倍。</strong>
      </p>
      <p>
        小明想不通：止损不是限制亏损的吗。本章讲两件事：止损什么时候会失效，以及怎么在买入前就把"最坏的那天"算进仓位。
      </p>
    </OpeningBox>

    <Callout variant="key" title="一句话结论">
      <p><strong>止损只在正常成交时有效。把最坏跳空亏损算进仓位，失效那天才不至于击穿预算。</strong></p>
    </Callout>

    <GoalsCard>
        <ol class="goals-list">
        <li>能说出止损失效的四种情形（跳空、一字跌停、停牌、流动性缺失），并说明条件单为什么不是兜底工具。</li>
        <li>能对同一笔交易分别算出计划亏损与实际亏损，并复算本章 1% 与 4% 的对比。</li>
        <li>能用最坏跳空约束公式算出仓位占比上限，并与〔B3-C04〕的其他约束一起取最严。</li>
      </ol>
      </GoalsCard>

    <h3 id="c06-s1" class="sub-title" data-spy>一、止损什么时候会失效：三个情景与同一个原因</h3>
    <p>〔B3-C04〕的仓位公式有一个前提：止损触发后，能在止损价附近成交。这个前提在三种情景下会破。</p>
    <p>
      <strong>情景一：开盘价直接低于止损价。</strong>夜里出了消息（虚构），开盘 8.00 元，止损价 9.50 元被整体跳过。
      卖出委托只能按开盘价附近成交。从 9.50 到 8.00 这段损失，在下单那一刻起就不受你控制。
    </p>
    <p>
      <strong>情景二：一字跌停。</strong>全天价格被压在跌停位置，几乎只有卖单、没有买单。
      卖出委托排在长队里，可能一整天都无法成交。各板块的具体幅度与规则条文见〔B2-C04〕，本章只讲风险应对。
    </p>
    <p><strong>情景三：停牌。</strong>标的暂停交易，期间无法买卖，复牌时间与复牌后的价格都难以预判（规则本身见〔B2-C04〕）。</p>
    <p>
      三种情景背后是同一个原因：<strong>想卖的时候，对面没有足够的买盘。</strong>
      成交清淡的小市值标的更明显；利空集中出现时，买盘撤得快，卖单越积越多。
    </p>
    <p>
      <strong>打个比方。</strong>止损像汽车的安全气囊：绝大多数碰撞中会弹出，但某些角度和工况下可能不弹出。
      所以安全带才是每一步都要系上的底线，仓位就是这里的安全带。
    </p>
    <p class="table-note"><em>类比的局限：</em>汽车行业对气囊有统一的测试工况，失效属于小概率的工程事件。市场的极端低开没有这样的统一标准，个股在事件前后大幅低开并不少见，只能靠自己预留余量。</p>
    <p>现在给情景里的词命名。</p>
    <ul>
      <li><strong>跳空</strong>：开盘价明显脱离前一交易日的收盘价区间，两段价格之间留下一段没有任何成交的位置。向下跳空意味着止损价可能被整体跳过。</li>
      <li><strong>一字跌停</strong>：全天价格被压在跌停位置、几乎只有卖单没有买单的状态，卖出委托可能全天无法成交。</li>
      <li><strong>停牌</strong>：标的暂停交易，期间无法买入或卖出。</li>
      <li><strong>流动性缺失</strong>：想以合理价格成交时缺乏足够的对手盘，卖出要么大幅让价，要么卖不出去。</li>
    </ul>
    <p>还有一个工具要提一句：可以用券商的条件单自动止损（其局限详见〔B2-C03〕）。</p>

    <h3 id="c06-s2" class="sub-title" data-spy>二、计划亏损与实际亏损：把那笔账算清楚</h3>
    <p>
      接着算开场的例子。本金 100,000 元（EX-A）。按 EX-B 不含滑点的口径：买甲股份 2,000 股，入场 10.00 元，
      仓位 20,000 元，占本金 20%。止损 9.50 元，止损距离 = 5%。
    </p>
    <p>
      <strong>计划亏损</strong>是这笔交易按预设规则退出时的亏损，即〔B3-C01〕"计划内亏损"的上限，也就是〔B3-C04〕里的 1R。
    </p>
    <div class="formula-block">
      计划亏损 = 仓位 × 止损距离 = 20,000 × 5% = 1,000 元<br />
      占本金 = 1%　（复算：2,000 × 0.50 = 1,000 元，两种算法一致）
    </div>
    <p>
      <strong>实际亏损</strong>是这笔交易真实发生的亏损，包含止损失效、滑点与费用。
      次日开盘 8.00 元（−20%，独立示意的虚构情景），条件单触发后按 8.00 元附近成交：
    </p>
    <div class="formula-block">
      实际亏损 = 20,000 × 20% = 4,000 元<br />
      占本金 = 4%　（复算：2,000 × 2.00 = 4,000 元）
    </div>
    <table class="data-table">
      <thead><tr><th>项目</th><th>计划</th><th>实际（本例）</th></tr></thead>
      <tbody>
        <tr v-for="row in planActualTable" :key="row.item">
          <td>{{ row.item }}</td>
          <td class="mono">{{ row.plan }}</td>
          <td class="mono highlight">{{ row.actual }}</td>
        </tr>
      </tbody>
    </table>
    <p>4,000 元还没算佣金与印花税，实际只会更多（〔B2-C05〕）。</p>
    <p>同一次跳空，代价由什么决定？由仓位决定：</p>
    <table class="data-table">
      <thead><tr><th>仓位占比</th><th>跳空幅度</th><th>本金亏损</th></tr></thead>
      <tbody>
        <tr v-for="row in gapPosTable" :key="row.pos">
          <td class="mono">{{ row.pos }}</td>
          <td class="mono">{{ row.gap }}</td>
          <td class="mono highlight">{{ row.loss }}</td>
        </tr>
      </tbody>
    </table>
    <p>跳空幅度你控制不了，仓位你控制得了。亏 10% 要涨 11.1% 才回本，亏 20% 要涨 25%（EX-H，〔B3-C01〕）。</p>

    <h3 id="c06-s3" class="sub-title" data-spy>三、最坏跳空约束：把"最坏的那天"写进公式</h3>
    <p>
      <strong>最坏跳空亏损</strong>：该标的在止损失效情形下的最坏单笔亏损幅度估计。注意"估计"二字。
      它来自历史跳空记录、波动大小、事件临近程度与流动性状况的综合判断。它不是精确值，也因标的而异。
    </p>
    <p>
      <strong>打个比方。</strong>货车过限重的桥，司机按"满载加路面颠簸"的最坏重量来估，而不是按平时的平均载货量。
      仓位就是过桥的货车，最坏跳空亏损就是那笔最坏重量。
    </p>
    <p class="table-note"><em>类比的局限：</em>桥的限重是一块写好的牌子。最坏跳空亏损只能估计，不同标的的"限重"还不一样，需要逐个标的重新判断。</p>
    <p>推导只有两步。最坏那天的本金亏损比例 = 仓位占比 × 最坏跳空亏损幅度。要求它不超过单笔风险比例，就得到全丛书统一的公式：</p>
    <div class="formula-block">最坏跳空约束：单笔仓位占比 ≤ 单笔风险比例 ÷ 最坏跳空亏损幅度</div>
    <p><em>算例（EX-C）：</em>某标的最坏亏损估计 20%，单笔风险比例取 1%（起步参考值，需个人校准）。</p>
    <div class="formula-block">
      仓位占比 ≤ 1% ÷ 20% = 5%<br />
      本金 100,000 元 → 仓位最多 5,000 元<br />
      复算：5,000 × 20% = 1,000 元 = 1R。即使最坏那天发生，亏损仍在预算内。
    </div>
    <p>把两个滑块换成你自己的数字：</p>
    <GapConstraint />
    <p>
      <strong>两道闸门要一起过。</strong>〔B3-C04〕的仓位公式管"正常成交"，本章的约束管"止损失效"。两个结果都算出来，取更小的。
      以 EX-B 的甲股份为例：正常成交口径算出 1,800 股（18%）；若按最坏跳空 20% 估计，上限只有 5%，取 5%，即 500 股。
      此时正常成交下的计划亏损只有 500 × 0.55 = 275 元，远小于 1,000 元。
      看起来"预算没用完"，但没用完的部分买的正是"最坏那天的承受力"，不能挪去加仓。
    </p>
    <p>估计从哪里来？三个观察：一看历史最大单日跌幅与向下跳空的记录；二看是否临近事件窗口（下一节）；三看成交活跃程度（读法见〔B4-C07〕）。估不出，就不重仓。下表只用来说明算法，数字为独立示意，不是统计结论，也不是起步标准：</p>
    <table class="data-table">
      <thead><tr><th>标的状态</th><th>最坏跳空亏损估计（独立示意）</th><th>仓位上限（单笔风险 1%）</th></tr></thead>
      <tbody>
        <tr v-for="row in gapEstTable" :key="row.type">
          <td>{{ row.type }}</td>
          <td class="mono">{{ row.est }}</td>
          <td class="mono highlight">{{ row.cap }}</td>
        </tr>
      </tbody>
    </table>
    <p>若与其他约束冲突，取最小。单票上限 20%、在途总风险上限 5% 均为起步参考值（需个人校准）；在途总风险的算法见〔B3-C07〕。</p>

    <h3 id="c06-s4" class="sub-title" data-spy>四、谁最需要这条约束：适用清单与事件窗口</h3>
    <p>同样 1% 的单笔风险，不同标的的最坏代价不同。以下清单里的标的，要按更严的口径执行：</p>
    <ol>
      <li>
        <strong>个股，尤其 T+1 之下。</strong>当天买入的股票当天无法卖出（规则细节见〔B2-C04〕）。
        买入当天遇到突发利空，只能等次日处理，最坏情形要按"隔夜"估计。
      </li>
      <li><strong>小市值、成交清淡的个股。</strong>流动性缺失与跳空叠加，卖出更难，实际亏损更容易偏离计划。</li>
      <li>
        <strong>临近事件窗口的标的。</strong>财报、重大公告、停牌复牌前后。<strong>事件窗口</strong>指重大信息披露或重大事项决定前后、
        结果不可控的时间段。财报披露的时间安排以交易所规定为准【待核验】。
      </li>
    </ol>
    <p>事件窗口内的做法，原则是事前规则化，而不是预测事件结果：</p>
    <ul>
      <li>买入前查日历：是否临近财报或已公告的重大事项；</li>
      <li>临近事件窗口，不加新仓，或把仓位压到"事件后最坏幅度"对应的约束水平；</li>
      <li>停牌无法预知，唯一能在买入前控制的是仓位，把"可能停牌"并入最坏估计；</li>
      <li>把这类条件事先写进规则，属于环境过滤器的思路，详见〔B7-C05〕。</li>
    </ul>
    <p>
      宽基 ETF 的对照：它分散了单只个股的财报与停牌风险，成交一般更活跃，但指数级的利空仍会整体跳空。
      约束不是零，只是估计幅度可能小一些。这是定性判断，仍需按标的自行估计。
    </p>

    <h3 id="c06-s5" class="sub-title" data-spy>五、下单前的三个"最坏"之问</h3>
    <p>把本章并入〔B3-C04〕的六步走，下单前再问三个问题：</p>
    <ol>
      <li>这个标的若明天开盘就出现最坏跳空，我亏多少占本金？（仓位占比 × 最坏跳空亏损幅度）</li>
      <li>它是否临近事件窗口，或带有小盘、易停牌的特征？</li>
      <li>我的止损靠什么成交？失效时靠什么兜底？（答案应当是仓位，而不是条件单。）</li>
    </ol>
    <p>汇总成一张表。一笔仓位要同时通过四道约束，取最严：</p>
    <table class="data-table">
      <thead><tr><th>约束</th><th>管什么</th><th>参考值</th></tr></thead>
      <tbody>
        <tr v-for="row in fourGatesTable" :key="row.gate">
          <td>{{ row.gate }}</td>
          <td>{{ row.manages }}</td>
          <td class="mono">{{ row.ref }}</td>
        </tr>
      </tbody>
    </table>
    <p class="table-note">均为起步参考值，需个人校准。</p>
    <div class="callout callout-warn">
      <div class="callout-title">⚠️ 提醒</div>
      <p>"最坏"是对可估计范围的估计，不覆盖极端市场状态。约束降低的是止损失效时的代价，不能消除亏损本身。</p>
    </div>

    <h3 id="c06-m" class="sub-title" data-spy>常见误区</h3>
    <Callout variant="warn" title="误区一：“有止损就安全，亏损最多就是 1R。”">
      <p>
        <strong>为什么错：</strong>止损在正常成交下限制亏损，跳空与跌停时可能失效。本章算例里计划亏 1%、实际亏 4%；
        一字跌停与停牌甚至可能让你暂时卖不出去；条件单也依赖券商系统与网络（〔B2-C03〕）。
      </p>
      <p><strong>正确做法：</strong>把止损当"正常情况下的退出工具"，把仓位当"失效那天的兜底"。买入前用最坏跳空约束再过一遍仓位。</p>
    </Callout>
    <Callout variant="warn" title="误区二：“条件单挂好了，仓位就可以随便放。”">
      <p>
        <strong>为什么错：</strong>条件单解决的是"谁来执行"，不解决"亏多少"。
        跳空越过触发价时按更差的价格成交，系统或网络异常时可能不触发（〔B2-C03〕）。
      </p>
      <p><strong>正确做法：</strong>先按公式与约束定仓位，再把条件单作为执行工具。两者是分工，不是替代。</p>
    </Callout>
    <Callout variant="warn" title="误区三：“宽基 ETF 也可能跳空，这条约束就没有意义。”">
      <p>
        <strong>为什么错：</strong>约束的目的不是消除跳空，而是让最坏那天的亏损仍留在预算内。
        ETF 分散了个股事件风险，估计幅度可能更小，但不是零。
      </p>
      <p><strong>正确做法：</strong>分标的估计最坏亏损，按约束执行；估不出就不重仓。接受较小的仓位，是为"万一"支付的成本。</p>
    </Callout>

    <h3 id="c06-z" class="sub-title" data-spy>自测题</h3>
    <QuizItem>
      <template #q>题 1：最坏跳空亏损估计 25%，单笔风险比例 1%，本金 100,000 元。仓位占比上限是多少？最多买多少钱？</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>仓位占比 ≤ 1% ÷ 25% = 4%；金额 = 4,000 元。复算：4,000 × 25% = 1,000 元，恰好等于 1R。最坏那天发生，亏损仍在预算内。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 2：买了 30,000 元（仓位 30%），止损距离 5%，次日跳空 −20% 成交。计划与实际亏损各占本金多少？按约束他应该买多少？</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>计划亏损 = 30,000 × 5% = 1,500 元，占 1.5%——已超 1R，说明开仓时就没按〔B3-C04〕算。</p>
        <p>实际亏损 = 30,000 × 20% = 6,000 元，占 6%，是计划的 4 倍。</p>
        <p>按约束：仓位 ≤ 1% ÷ 20% = 5%，即 5,000 元。同样一次跳空，仓位超标使代价从 1,000 元变成 6,000 元。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 3（判断）："只要在券商软件里挂好条件单，止损就一定会在设定价格附近成交。"</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>不对。原因有三：一，向下跳空会整体越过触发价，按更差的价格成交；二，一字跌停时卖出委托排队，可能全天不成交；三，条件单的触发与成交依赖券商系统与网络，异常时可能不触发（〔B2-C03〕）。条件单是执行工具，兜底要靠买入前定好的仓位。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 4：单笔风险 1%。对三个虚构标的先自行估计最坏跳空，再算仓位上限：① 宽基 ETF；② 大盘活跃个股；③ 两周后披露财报的小盘个股。</template>
      <template #a>
        <p><span class="ans-label">答案与解析（参考）：</span>① 估 5% → 20%，即 20,000 元（宽基 ETF 不受 20% 单票上限约束）。② 估 10% → 10%，即 10,000 元。③ 临近财报，估 25% → 4%，即 4,000 元。</p>
        <p>重点不是三个数字本身，而是方法：先估最坏，再反推仓位。同一笔 1% 风险，仓位上限可以差 5 倍。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 5：最坏跳空估计 25%，〔B3-C04〕公式算出的仓位为 12%，单票上限 20%。这笔最终最多买多少（本金 100,000 元）？</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>跳空约束：1% ÷ 25% = 4%。三道约束取最小：min（12%，20%，4%）= 4%，即 4,000 元。复算：4,000 × 25% = 1,000 元 = 1R。最坏情形约束常常是最紧的一道，这正是它的作用。</p>
      </template>
    </QuizItem>

    <h3 id="c06-c" class="sub-title" data-spy>速查卡</h3>
    <div class="cheat-card">
      <ul style="padding-left: 20px;">
        <li><strong>止损失效四情形：</strong>跳空、一字跌停、停牌、流动性缺失。</li>
        <li><strong>计划 vs 实际（本例口径）：</strong>仓位 20% × 止损距离 5% → 计划亏 1%；实际 −20% → 亏 4%（独立示意情景）。</li>
        <li><strong>最坏跳空约束：</strong>仓位占比 ≤ 单笔风险比例 ÷ 最坏跳空亏损幅度。EX-C：1% ÷ 20% = 5%（→ 5,000 元）。</li>
        <li><strong>四道约束取最严：</strong>仓位公式／最坏跳空约束／单票上限 20%／在途总风险 5%。</li>
        <li><strong>格外收紧的清单：</strong>个股（尤其 T+1）、小盘、临近事件窗口；宽基 ETF 也非零风险。</li>
        <li><strong>事件前三步：</strong>查财报日历；临近不加仓；把可能停牌并入最坏估计。</li>
        <li>以上数值均为起步参考值，需个人校准。</li>
      </ul>
    </div>
    <p class="table-note">
      延伸：条件单与委托规则〔B2-C03〕· T+1、涨跌停、停牌〔B2-C04〕· 1R 与六步走〔B3-C04〕· 止损三法〔B3-C05〕· 在途总风险〔B3-C07〕· 实际/计划亏损比〔B3-C08〕· 熔断〔B3-C10〕· 环境过滤器〔B7-C05〕· 成交活跃度读法〔B4-C07〕
    </p>
  </section>
</template>
