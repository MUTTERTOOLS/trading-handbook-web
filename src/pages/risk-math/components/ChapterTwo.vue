<script setup lang="ts">
import Callout from '@/shared/components/Callout.vue';
import ChapterHead from '@/shared/components/ChapterHead.vue';
import GoalsCard from '@/shared/components/GoalsCard.vue';
import OpeningBox from '@/shared/components/OpeningBox.vue';
import QuizItem from '@/shared/components/QuizItem.vue';
import PositionCalculator from './PositionCalculator.vue';

const compareTable = [
  { who: '小红', shares: '2,000 股', money: '20,000 元', loss: '2,000 × 0.50 = 1,000 元', pct: '1%' },
  { who: '小刚', shares: '10,000 股', money: '100,000 元', loss: '10,000 × 0.50 = 5,000 元', pct: '5%' },
];
const streakTable = [
  { risk: '0.5%', dd: '3.4%', calc: '1 − 0.995⁷' },
  { risk: '1%', dd: '6.8%', calc: '1 − 0.99⁷ ≈ 1 − 0.932' },
  { risk: '2%', dd: '13.2%', calc: '1 − 0.98⁷' },
  { risk: '5%', dd: '30.2%', calc: '1 − 0.95⁷' },
];
const sixStepTable = [
  { step: '1', do: '定 1R', result: '1,000 元' },
  { step: '2', do: '定止损', result: '9.50 元，每股风险 0.50 元' },
  { step: '3', do: '算股数', result: '不含滑点 2,000 股；含滑点约 1,818 股' },
  { step: '4', do: '取整', result: '1,800 股，18,000 元，实际最大计划亏损 990 元' },
  { step: '5', do: '单票上限', result: '18% ≤ 20%，通过' },
  { step: '6', do: '在途总风险', result: '3.99% ≤ 5%，通过' },
];
const minUnitTable = [
  { case: '情形一', stop: '190', buf: '0', risk: '10 元', formula: '100 股', actual: '1,000 元（1R）', verdict: '刚好通过' },
  { case: '情形二', stop: '190', buf: '1 元', risk: '11 元', formula: '约 90 股', actual: '100 × 11 = 1,100 元', verdict: '超预算，不开' },
  { case: '情形三', stop: '180', buf: '0', risk: '20 元', formula: '50 股', actual: '100 × 20 = 2,000 元', verdict: '超预算一倍，不开' },
];
const stopDistTable = [
  { dist: '5%', loss: '1,000 元', pct: '1%' },
  { dist: '10%', loss: '2,000 元', pct: '2%' },
  { dist: '15%', loss: '3,000 元', pct: '3%' },
];
</script>

<template>
  <section id="c04" class="section">
    <ChapterHead tag="§2 · 对应 B3-C04" src="全章约 4,300 字 · 统一算例 EX-A / EX-B / EX-I">
        <h2>单笔风险与仓位公式</h2>
      </ChapterHead>

    <OpeningBox>
      <p>
        小明有 100,000 元本金。他看中了甲股份，现价 10.00 元，打算买。他问两位朋友"该买多少"：
      </p>
      <p>朋友一说："买两成仓吧，稳一点。"朋友二说："你看好就多买点，满仓才赚得多。"</p>
      <p>
        两个答案听起来都有道理，但它们有一个共同问题：<strong>都没有回答"如果看错了，我会亏多少钱"。</strong>
        本章要给小明一个不同的算法：先决定这笔交易最多亏多少，再算出能买多少股。
      </p>
    </OpeningBox>

    <Callout variant="key" title="一句话结论">
      <p><strong>先定这笔最多亏多少钱（1R），再用止损距离反推买入股数，而不是先决定买多少。</strong></p>
    </Callout>

    <GoalsCard>
        <ol class="goals-list">
        <li>能说出 1R 的含义，并算出自己账户的 1R。</li>
        <li>能按"六步走"算出一笔交易的买入股数，包括滑点缓冲和取整。</li>
        <li>能判断一笔交易是否通过单票上限和在途总风险两道校验，必要时放弃或缩小。</li>
      </ol>
      </GoalsCard>

    <h3 id="c04-s1" class="sub-title" data-spy>一、先定"最多亏多少"：1R</h3>
    <p>
      先看一个对比。小红和小刚都在 10.00 元买入甲股份，都把止损设在 9.50 元。两人的判断完全一样，只有股数不同。
    </p>
    <table class="data-table">
      <thead>
        <tr><th></th><th>买入股数</th><th>买入金额</th><th>跌到 9.50 的亏损</th><th>占本金</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in compareTable" :key="row.who">
          <td>{{ row.who }}</td>
          <td class="mono">{{ row.shares }}</td>
          <td class="mono">{{ row.money }}</td>
          <td class="mono">{{ row.loss }}</td>
          <td class="mono highlight">{{ row.pct }}</td>
        </tr>
      </tbody>
    </table>
    <p>
      同样看错一次，小刚亏的是小红的 5 倍。判断对错不由你控制，<strong>股数由你控制</strong>。
      风险管理就是通过控制股数，把"看错的代价"提前锁在一个自己能接受的范围内。
    </p>
    <p><strong>打个比方。</strong>出门旅行时，聪明的做法是先定"这趟最多花 1 万元"，再去挑住几星的酒店，而不是先订最贵的酒店，回头看钱够不够。</p>
    <p class="table-note">*类比的局限：*旅行花多少由你说了算。市场里价格可能跳空，亏损有时会超过你定的预算。这一点留到〔B3-C06〕。</p>
    <p>现在给这个"预算"起个名字。<strong>单笔风险比例</strong>是一笔交易最多允许亏掉的钱占账户本金的比例。本书新手起步参考值是 <strong>0.5%~1%，上限 2%</strong>（需个人校准）。</p>
    <p><strong>1R</strong> 是这笔交易计划亏掉的金额，计算方式是：</p>
    <div class="formula-block">1R = 本金 × 单笔风险比例</div>
    <p><em>算例（EX-A）：</em>小明本金 100,000 元，单笔风险比例取 1%。</p>
    <p class="mono">1R = 100,000 × 1% = 1,000 元</p>
    <p>
      意思是：这一笔如果按计划止损，最多亏 1,000 元。以后赚了 2,000 元，就说成"赚了 2R"；亏了 500 元，就是"亏了 0.5R"。
      这种记账方式在〔B1-C03〕已经出现过，后面〔B3-C08〕和〔B7-C07〕会反复用到。
    </p>
    <p><strong>本金按什么算？</strong>本书统一用<strong>下单当天盘前的账户总权益</strong>，也就是现金加持仓市值。</p>
    <p><strong>为什么起步参考值这么小？</strong>因为连续亏损是常态（〔B3-C10〕会专门讲）。下表假设每笔都恰好亏 1R，并且每次都用剩余本金重新计算：</p>
    <table class="data-table">
      <thead>
        <tr><th>单笔风险比例</th><th>连亏 7 笔后账户回撤（约）</th><th>算法</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in streakTable" :key="row.risk">
          <td class="mono">{{ row.risk }}</td>
          <td class="mono highlight">{{ row.dd }}</td>
          <td class="mono">{{ row.calc }}</td>
        </tr>
      </tbody>
    </table>
    <p>
      单笔 5% 的人，连亏 7 笔就亏掉近三成，要涨回约 43% 才能回本（〔B3-C01〕的回本表）。
      单笔 1% 的人，同样的连亏只让账户回撤约 7%，还能继续交易。
    </p>

    <h3 id="c04-s2" class="sub-title" data-spy>二、由止损距离反推股数</h3>
    <p>1R 定下来之后，只剩一个问题：买多少股，才能让"触发止损时刚好亏 1R"？</p>
    <p>触发止损时的总亏损等于"股数 × 每股亏的钱"，所以：</p>
    <div class="formula-block">
      每股风险 = 入场价 − 止损价 + 滑点缓冲<br />
      买入股数 = 1R ÷ 每股风险（向下取整到最小交易单位）
    </div>
    <p>三个新词逐个说明：</p>
    <ul>
      <li><strong>每股风险</strong>：每买一股，到止损为止会亏多少钱。</li>
      <li>
        <strong>滑点缓冲</strong>：为"实际成交价比计划差"预留的余量。止损触发后，成交价常常比止损价更差，缓冲就是提前把这部分算进去。
        缓冲没有统一标准，它是起步参考值，需个人校准。
      </li>
      <li>
        <strong>最小交易单位</strong>：买入只能以固定数量为单位。A 股主板一般以 100 股（1 手）为单位【待核验】，
        科创板等板块规则不同【待核验】，见〔B2-C04〕。
      </li>
    </ul>
    <p><strong>为什么要向下取整？</strong>因为向上取整会让实际亏损超过 1R。预算是上限，不能超。</p>
    <p>
      本书新手阶段只讲"做多"，也就是先买后卖，所以每股风险是入场价减止损价。
      佣金和印花税金额较小，本章不单列，可以并入缓冲，完整费用见〔B2-C05〕。
    </p>

    <h3 id="c04-s3" class="sub-title" data-spy>三、完整走一遍：六步走（EX-B）</h3>
    <p>
      小明要买甲股份。入场价 10.00 元，他的买入逻辑是"价格站在前期低点 9.50 元之上"，
      所以一旦跌破 9.50 元，逻辑就被推翻，止损价定为 9.50 元。（止损位怎么定，见〔B3-C05〕。）
    </p>
    <p><strong>步骤 1：定 1R。</strong>1R = 100,000 × 1% = 1,000 元。</p>
    <p><strong>步骤 2：定止损，算每股风险。</strong>入场 10.00，止损 9.50，每股风险 = 10.00 − 9.50 = 0.50 元。</p>
    <p>
      <strong>步骤 3：算股数。先不含滑点，再含滑点。</strong>
      不含滑点：1,000 ÷ 0.50 = 2,000 股，买入金额 20,000 元，占本金 20%。
      含滑点：小明预留 0.05 元缓冲（教学取整数，约为股价的 0.5%，不是推荐值），
      每股风险 = 0.50 + 0.05 = 0.55 元，股数 = 1,000 ÷ 0.55 ≈ 1,818.18 股。
    </p>
    <p>
      <strong>步骤 4：取整。</strong>按 100 股为单位向下取整：1,818 股 → <strong>1,800 股</strong>。
      买入金额 = 1,800 × 10.00 = 18,000 元，占本金 18%。实际最大计划亏损 = 1,800 × 0.55 = 990 元，略低于 1,000 元，没有超预算。
    </p>
    <p><strong>步骤 5：校验单票上限。</strong>单票上限是单只股票的最高持仓占比，起步参考值 <strong>20%</strong>（宽基 ETF 除外）。18% ≤ 20%，通过。</p>
    <p>
      <strong>步骤 6：校验在途总风险。</strong><strong>在途总风险</strong>是所有持仓若同时触发止损的总计划亏损占本金的比例，
      起步参考值上限 <strong>5%</strong>（含义和同板块合并算法见〔B3-C07〕）。
      假设小明手里已有 3 笔持仓，计划亏损合计 3,000 元（3%）：3,000 + 990 = 3,990 元，占本金 3.99% ≤ 5%，通过。
    </p>
    <p>
      如果他已有 5 笔、计划亏损合计 5,000 元，加上这笔就是 5,990 元（5.99%），超过 5%。
      这时只有三条路：<strong>不开这笔、等某笔离场后再开、把这笔缩小</strong>。不能因为"这笔机会太好"就破例。
    </p>
    <table class="data-table">
      <thead>
        <tr><th>步骤</th><th>做什么</th><th>小明的结果</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in sixStepTable" :key="row.step">
          <td class="mono">{{ row.step }}</td>
          <td>{{ row.do }}</td>
          <td class="mono">{{ row.result }}</td>
        </tr>
      </tbody>
    </table>

    <p>把六个数字改成你自己的，在下面跑一遍（默认值即 EX-B）：</p>
    <PositionCalculator />

    <p><strong>为什么要加滑点缓冲？</strong>看看不加会怎样。小明按 2,000 股买入，价格跳到 9.45 才成交止损，实际每股亏 10.00 − 9.45 = 0.55 元：</p>
    <p class="mono">2,000 × 0.55 = 1,100 元，超过 1R 的 10%。</p>
    <p>如果加了缓冲，买 1,800 股，同样的成交价下亏 1,800 × 0.55 = 990 元，仍在预算内。缓冲买的是一点余量，不是保险。</p>
    <p>这一章对应〔B3-C03〕五步流程的第 3 步（算止损与仓位）。步骤 1~6 都通过之后，才进入第 4 步"等触发信号"。</p>

    <h3 id="c04-s4" class="sub-title" data-spy>四、买不起怎么办：最小交易单位与小账户</h3>
    <p>
      公式算出来的股数，有时连 100 股都不到。看一个独立示意的例子（本金 100,000 元，1R = 1,000 元，其余数字为示意）。
      乙股份价格 200 元，100 股就是 20,000 元，已经占本金 20%，正好顶到单票上限。
    </p>
    <table class="data-table">
      <thead>
        <tr><th>情形</th><th>止损价</th><th>缓冲</th><th>每股风险</th><th>公式股数</th><th>买最小单位 100 股的实际风险</th><th>结论</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in minUnitTable" :key="row.case">
          <td>{{ row.case }}</td>
          <td class="mono">{{ row.stop }}</td>
          <td class="mono">{{ row.buf }}</td>
          <td class="mono">{{ row.risk }}</td>
          <td class="mono">{{ row.formula }}</td>
          <td class="mono">{{ row.actual }}</td>
          <td>{{ row.verdict }}</td>
        </tr>
      </tbody>
    </table>
    <p>情形二的公式股数是 90 股，向下取整到 100 股的倍数就是 0 股。想买就得买 100 股，实际风险是 1,100 元，比预算多 10%。</p>
    <p><strong>规则：实际风险超过 1R，就不开仓。</strong>不要用"差得不多"说服自己，那是预算被一点点放松的开始。</p>
    <p>遇到这种情况，常见的处理方式有三种：</p>
    <ol>
      <li><strong>放弃这个标的。</strong>最简单，也最常见。</li>
      <li><strong>换同类的低价标的，或改用 ETF。</strong>ETF 的单价往往较低，100 份的金额较小，仓位更容易精细调整。</li>
      <li><strong>等本金增长。</strong>不要为了凑够股数去借钱，也不要临时把单笔风险比例改大。</li>
    </ol>
    <p>还有一种做法是把止损收得更紧，但这是常见的陷阱，见下文误区三。</p>

    <h3 id="c04-s5" class="sub-title" data-spy>五、公式的边界：它不能保证什么</h3>
    <p>这套算法做到了一件事：<strong>在正常成交的情况下，把单笔亏损限制在 1R 附近。</strong>它没有做到的有三件事：</p>
    <ol>
      <li>
        <strong>它不保证实际亏损等于 1R。</strong>遇到跳空低开、一字跌停、停牌，止损价可能根本成交不了，实际亏损可能是 1R 的几倍。怎么应对见〔B3-C06〕。
      </li>
      <li><strong>它不判断这笔该不该做。</strong>公式只管"做的话买多少"，不管买入逻辑对不对。</li>
      <li>
        <strong>它不预测输赢。</strong>1R 是你愿意承担的代价，不是对结果的预判。长期来看，实际平均亏损往往略大于计划亏损，
        需要在记账中统计"实际平均亏损 ÷ 计划亏损"（〔B3-C08〕、〔B7-C07〕）。
      </li>
    </ol>
    <div class="callout callout-warn" style="margin-top: 20px;">
      <div class="callout-title">⚠️ 提醒</div>
      <p>本章所有数字（1%、20%、5%、0.05 元缓冲）都是起步参考值，用来演示算法，需要结合你自己的本金、策略和承受能力校准。</p>
    </div>

    <h3 id="c04-m" class="sub-title" data-spy>常见误区</h3>
    <Callout variant="warn" title="误区一：“我每次都买两成仓，这样就是控制风险了。”">
      <p><strong>为什么错：</strong>仓位比例只决定"买多少钱"，亏多少取决于止损距离。同样买 20,000 元：</p>
      <table class="data-table" style="margin: 10px 0;">
        <thead><tr><th>止损距离</th><th>亏损</th><th>占本金</th></tr></thead>
        <tbody>
          <tr v-for="row in stopDistTable" :key="row.dist">
            <td class="mono">{{ row.dist }}</td>
            <td class="mono">{{ row.loss }}</td>
            <td class="mono highlight">{{ row.pct }}</td>
          </tr>
        </tbody>
      </table>
      <p>股票换了，止损距离变了，同样"两成仓"的风险可以差好几倍。</p>
      <p><strong>正确做法：</strong>先定 1R，再根据止损距离算股数。仓位比例是结果，不是起点。</p>
    </Callout>
    <Callout variant="warn" title="误区二：“满仓一只，赚得更多。”">
      <p>
        <strong>为什么错：</strong>赚得多的前提是看对，而看错的概率一直存在。满仓 100,000 元、止损 5%，一笔就亏 5,000 元（5%）。
        按前面的表，单笔 5% 的人连亏 6 笔，回撤约 26.5%（EX-I）。仓位大不改变你判断的准确率，只放大了错的代价。
      </p>
      <p>
        <strong>正确做法：</strong>用 1R 和单票上限同时约束仓位。想让赚的多，应通过提高盈亏比和验证策略（〔B3-C08〕、〔B6-C12〕）来实现，而不是放大单笔风险。
      </p>
    </Callout>
    <Callout variant="warn" title="误区三：“止损设近一点，就能多买一点。”">
      <p>
        <strong>为什么错：</strong>公式里每股风险越小，股数越大，这很容易让人倒过来：先想买多少，再把止损往近处挪。
        可止损位应该来自"买入逻辑失效的位置"，不是来自"我想买多少"。止损放在正常波动范围内，很容易被噪音触发，亏掉 1R 之后价格又涨回去。
      </p>
      <p><strong>正确做法：</strong>止损位先由买入逻辑决定，然后由止损距离决定股数。顺序不能反（详见〔B3-C05〕）。</p>
    </Callout>

    <h3 id="c04-z" class="sub-title" data-spy>自测题</h3>
    <QuizItem>
      <template #q>题 1：本金 200,000 元，单笔风险比例 0.5%，入场 25.00 元，止损 23.00 元，缓冲 0.10 元。算买入股数、金额、占比、实际最大计划亏损。</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>1R = 200,000 × 0.5% = 1,000 元；每股风险 = 25.00 − 23.00 + 0.10 = 2.10 元。</p>
        <p>1,000 ÷ 2.10 ≈ 476.19 → 向下取整为 <strong>400 股</strong>；买入金额 = 400 × 25.00 = <strong>10,000 元</strong>，占本金 <strong>5%</strong>；实际最大计划亏损 = 400 × 2.10 = <strong>840 元</strong>（0.42%）。</p>
        <p>取整后实际风险比预算少，是向下取整的正常结果。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 2：本金 100,000 元，单笔风险比例 1%，入场 5.00 元，止损 4.80 元，缓冲 0。先按公式算股数，再检查单票上限。</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>1R = 1,000 元；每股风险 = 0.20 元。公式股数 = 5,000 股，金额 25,000 元，占 25%，<strong>超过 20% 单票上限</strong>。</p>
        <p>按上限压缩：20,000 ÷ 5.00 = <strong>4,000 股</strong>，此时实际计划亏损 = 4,000 × 0.20 = <strong>800 元</strong>（0.8%）。</p>
        <p>启示：止损距离很近的标的，常被单票上限压住，而不是被 1R 压住。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 3：本金 50,000 元，单笔风险比例 1%，入场 30.00 元，止损 28.00 元，缓冲 0。算股数。</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>1R = 500 元；每股风险 = 2.00 元。500 ÷ 2.00 = 250 股 → 向下取整为 <strong>200 股</strong>。</p>
        <p>金额 = 6,000 元，占 <strong>12%</strong>；实际计划亏损 = 200 × 2.00 = <strong>400 元</strong>。小账户取整的影响更明显：这笔实际只用掉了 80% 的预算。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 4（判断）："只要我按公式算股数，这笔交易亏损就一定不会超过 1R。"</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span><strong>错误。</strong>公式在"止损价或缓冲范围内成交"的前提下限制亏损。若遇跳空低开、一字跌停或停牌，实际成交价可能远低于止损价，亏损会超过 1R（见〔B3-C06〕）。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 5：已有 4 笔在途持仓，计划亏损 1,100、900、1,000、1,200 元。新机会计划亏损 990 元（每股风险 0.55 元）。这笔能开吗？最多买多少股？</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>现有在途总风险 = 4,200 元（4.2%）。加上新笔：4,200 + 990 = 5,190 元（5.19%），<strong>超过 5% 上限，原计划不能开</strong>。</p>
        <p>剩余额度 = 5,000 − 4,200 = 800 元。缩小后股数 = 800 ÷ 0.55 ≈ 1,454.5 → 向下取整为 <strong>1,400 股</strong>，实际计划亏损 770 元。</p>
        <p>也可以选择不开，等某笔离场腾出额度。同板块的在途持仓需合并计算（〔B3-C07〕）。</p>
      </template>
    </QuizItem>

    <h3 id="c04-c" class="sub-title" data-spy>速查卡</h3>
    <div class="cheat-card">
      <div class="cc-title">六步走</div>
      <ol style="padding-left: 20px;">
        <li>1R = 本金 × 单笔风险比例（起步参考值 0.5%~1%，上限 2%）</li>
        <li>每股风险 = 入场价 − 止损价 + 滑点缓冲</li>
        <li>股数 = 1R ÷ 每股风险</li>
        <li>向下取整到最小交易单位；实际风险 &gt; 1R 则放弃</li>
        <li>单票占比 ≤ 20%（宽基 ETF 除外，起步参考值）</li>
        <li>加上本笔后，在途总风险 ≤ 5%（起步参考值）</li>
      </ol>
    </div>
    <div class="cheat-card">
      <p><strong>EX-B 参考答案：</strong>本金 100,000 → 1R = 1,000 → 入场 10.00、止损 9.50、缓冲 0.05 → 1,800 股，18,000 元（18%），最大计划亏损 990 元。</p>
      <p><strong>以上数值均为起步参考值，需个人校准。</strong></p>
    </div>
    <p class="table-note">
      延伸：止损位怎么定〔B3-C05〕· 止损失效时仓位怎么再收紧〔B3-C06〕· 在途总风险、同板块合并〔B3-C07〕· 实际亏损与计划亏损的比值〔B3-C08〕· 把仓位写进盘前快照〔B7-C03〕· A 股最小交易单位、涨跌停规则〔B2-C04〕· 回撤与连亏、熔断线〔B3-C10〕
    </p>
  </section>
</template>
