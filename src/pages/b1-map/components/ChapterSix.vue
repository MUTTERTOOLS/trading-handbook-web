<script setup lang="ts">
import Callout from '@/shared/components/Callout.vue';
import ChapterHead from '@/shared/components/ChapterHead.vue';
import GoalsCard from '@/shared/components/GoalsCard.vue';
import OpeningBox from '@/shared/components/OpeningBox.vue';
import QuizItem from '@/shared/components/QuizItem.vue';

const sevenQ = [
  { n: 1, q: '收益来源？', check: '赚谁的钱，凭什么轮到你赚', see: '〔B1-C02〕' },
  { n: 2, q: '止损？', check: '错了在哪儿认错', see: '〔B3-C05〕' },
  { n: 3, q: '仓位？', check: '买多少，怎么算出来的', see: '〔B3-C04〕' },
  { n: 4, q: '退出？', check: '对了怎么走；不止损的退出有哪些', see: '〔B3-C09〕' },
  { n: 5, q: '样本外？', check: '换一批新数据还成立吗', see: '〔B6-C06〕' },
  { n: 6, q: '成本？', check: '佣金、印花税、滑点算过没有', see: '〔B2-C05〕' },
  { n: 7, q: '失效条件？', check: '出现什么情况说明方法坏了', see: '〔B6-C11〕' },
];
const caseTable = [
  { n: 1, q: '收益来源？', ans: '没答。赚谁的钱、凭什么比市场强，一个字没有', s: 0 },
  { n: 2, q: '止损？', ans: '没提', s: 0 },
  { n: 3, q: '仓位？', ans: '没提，"照点位做"没说买多少', s: 0 },
  { n: 4, q: '退出？', ans: '只有买点卖点，没有止损与时间退出', s: 0 },
  { n: 5, q: '样本外？', ans: '"上月命中三个涨停"是个案自述，无样本外', s: 0 },
  { n: 6, q: '成本？', ans: '费率与滑点没算；年费 2,999 元本身先亏一笔', s: 0 },
  { n: 7, q: '失效条件？', ans: '没有提供', s: 0 },
];
</script>

<template>
  <section id="c06" class="section">
    <ChapterHead tag="§6 · 对应 B1-C06" src="全章约 4,100 字 · 统一算例 EX-A / EX-E">
      <h2>这套框架能做什么、不能做什么</h2>
    </ChapterHead>

    <OpeningBox>
      <p>
        表哥给小明转来一篇文章《三步稳赚法》，还附了句"群里都在晒单"。小明盯着标题心里打鼓：
        前五章的东西他都懂了，可这套框架到底能帮他干什么？能告诉他买什么吗？能判定这篇文章是真是假吗？要是框架也判不了，那学它图什么？
      </p>
      <p>
        本章回答这三个问题：这套框架能做什么、不能做什么，以及拿到一段方法描述时，怎么一步一步用它。
        文中那篇文章是为练习而写的虚构案例，不是真实推荐，后面会逐条拆它。
      </p>
    </OpeningBox>

    <Callout variant="key" title="一句话结论">
      <p>框架是照妖镜加安全带：帮你查方法、控风险；它不产生收益，七问答不上就不碰。</p>
    </Callout>

    <GoalsCard>
      <ol class="goals-list">
        <li>能说出框架的两个作用（查方法、控风险），并解释为什么它本身不产生收益。</li>
        <li>能用"可证伪"标准识别"怎么都对"的说法。</li>
        <li>能对一段方法描述逐条回答体检七问并打出分数。</li>
      </ol>
    </GoalsCard>

    <h3 id="c06-s1" class="sub-title" data-spy>一、两个作用：照妖镜与安全带</h3>
    <p><strong>作用一：照妖镜——检查方法。</strong>前几章攒下的尺子现在能用了：这个方法赚谁的钱，用来源三问（〔B1-C02〕）；它值不值，用期望收益（〔B1-C03〕）；它的交代全不全，用 5+1 信息分类（〔B1-C04〕）。照完只出两种结论：说得清的，送去验证；说不清的，不采信。</p>
    <p>
      <strong>作用二：安全带——锁定亏损。</strong>就算方法说得清，看错依然会常态发生。
      安全带是规则层那套东西：先定一笔最多亏多少，再定买多少（算法在后文〔B3-C04〕详述）。
      它不防止事故发生，它防止一次事故变成致命伤。
    </p>
    <p class="table-note">*类比的局限：*照妖镜在故事里一照就现原形，框架的判断没有这种确定性——"说不清"不等于"一定是骗局"，只等于"不值得投入"；安全带也应付不了所有极端情形，跳空与跌停时止损可能失效（后文〔B3-C06〕详述）。</p>

    <h3 id="c06-s2" class="sub-title" data-spy>二、框架不产生收益</h3>
    <p>
      <strong>Alpha</strong> 指超出市场平均的那部分收益。它只能来自〔B1-C02〕的五类收益来源，
      而其中最靠本事的"分析优势"，还要求你说得清"凭什么比市场强"。
    </p>
    <p>
      <strong>框架不产 Alpha。它的输出是"通过、不通过、缺哪格"，不是买卖信号，也不提高胜率。</strong>
      就像裁判不进球、体检不代替训练：框架帮你分辨谁有资格上场，成绩单要靠一个收益来源说得清、并且经过验证的方法去挣（验证流程在后文〔B6-C12〕详述）。
    </p>
    <p class="table-note">*类比的局限：*裁判吹哨有明文规则可依，框架的"不通过"只是提醒你去问更多问题，并不等于宣判一个方法死刑。</p>

    <h3 id="c06-s3" class="sub-title" data-spy>三、警惕"怎么都对"：可证伪</h3>
    <p>先看一段虚构的"老师"解说：</p>
    <div class="callout callout-tip">
      <div class="callout-title">虚构话术（练习用）</div>
      <p>"今天涨了，说明主力在拉升；跌了也不怕，是主力在洗盘；横盘呢，是主力在吸筹。跟着主力走就行。"</p>
    </div>
    <p>
      涨、跌、横，三种走势全有解释。听起来句句在理，其实什么都没说——无论明天怎么走，这套话都对，它不可能错。
    </p>
    <p>
      <strong>可证伪</strong>指的是：一个说法必须能讲出"出现什么情况就算我错了"，才有资格被检验。
      "收盘跌破 9.50 元我就认错离场"是可证伪的；"跌是洗盘"不可证伪。
      不可证伪的说法无法复盘、无法改进，亏损了也无从归因（三类归因见〔B7-C01〕）。
    </p>
    <p>
      定义宽泛的方法还有个共同的隐患：它必然"覆盖"一切行情，而覆盖得越全，信息量越小。
      就像"明天可能下雨也可能不下"这句预报，永远正确，永远没用。
      判断一个方法有没有内容，先看它敢不敢说出自己怎么算错。
    </p>
    <p class="table-note">*类比的局限：*天气预报至少还给出概率，市面上不少方法连概率都不给；在交易里，"永远正确"恰恰是负分项。</p>

    <h3 id="c06-s4" class="sub-title" data-spy>四、体检七问：给方法做体检</h3>
    <p>拿到任何一段方法描述，按顺序问七个问题。本章把这套问题称为<strong>体检七问</strong>：</p>
    <table class="data-table">
      <thead><tr><th>序</th><th>问题</th><th>它在查什么</th><th>深讲在哪</th></tr></thead>
      <tbody>
        <tr v-for="row in sevenQ" :key="row.n">
          <td class="mono">{{ row.n }}</td>
          <td>{{ row.q }}</td>
          <td>{{ row.check }}</td>
          <td class="mono">{{ row.see }}</td>
        </tr>
      </tbody>
    </table>
    <p>
      第 5 问里的<strong>样本外</strong>，指用没参与制定规则的新数据去检验方法，防止"规则是为历史数据量身定做的"，
      详见〔B6-C06〕，本章不展开。
    </p>
    <p>
      打分规则：每问 0~2 分——0 分完全没提；1 分提了但含糊（"看着办""放在心里"）；2 分明确可执行。满分 14 分。两个提醒：
    </p>
    <ol>
      <li>分数只衡量"说得清不清"，不代表"有效"。有效性要靠后文〔B6-C12〕的验证流程；完整回答七问，只是拿到了参赛资格。</li>
      <li>到了〔B8-C02〕，这七问会扩成九个字段的拆解卡，用来逐个流派细拆。你现在练的是它的雏形。</li>
    </ol>

    <h3 id="c06-s5" class="sub-title" data-spy>五、案例：逐条拆解《三步稳赚法》</h3>
    <p>下面是虚构文章的全文，专为练习拆解而写，人名、群、战绩均为编造。标题中的"稳赚"二字，正是本书要拆的第一面红旗——引用它只为驳斥：</p>
    <div class="callout callout-danger">
      <div class="callout-title">虚构案例全文（仅供拆解练习）</div>
      <p>
        《三步稳赚法》——第一步，看大盘：大盘红盘就做多，绿盘就等。第二步，选强股：涨得最猛的就是龙头，强者恒强。
        第三步，跟点位：老师每天早盘在群里发买卖点位，照做就行。上月老师带学员命中三个涨停，胜率八成。年费 2,999 元，本周报名享优惠。
      </p>
    </div>
    <p>用体检七问逐条照：</p>
    <table class="data-table">
      <thead><tr><th>序</th><th>问题</th><th>文章怎么答的</th><th>得分</th></tr></thead>
      <tbody>
        <tr v-for="row in caseTable" :key="row.n">
          <td class="mono">{{ row.n }}</td>
          <td>{{ row.q }}</td>
          <td>{{ row.ans }}</td>
          <td class="mono highlight">{{ row.s }}</td>
        </tr>
      </tbody>
    </table>
    <p>总分 0 ÷ 14。按〔B1-C02〕的规则：说不清，就不采信。</p>
    <p>再看三面附加红旗：</p>
    <ol>
      <li>
        <strong>承诺结果本身就是不合格特征。</strong>按〔B1-C01〕的三问，一个方法若先向你保证结果，规则与风险就没法谈。
        常见话术清单与举报渠道见〔B2-C08〕。
      </li>
      <li>
        <strong>就算相信它"胜率八成"，也救不回来。</strong>文章没给平均盈亏，我们补上两个示意数字，按 EX-E 的结构算一遍：
        胜率 80%，平均盈利 2%，平均亏损 10%，不计成本：E = 1.6% − 2.0% = <strong>−0.4%/笔</strong>。高胜率照样可以是负期望（〔B1-C03〕的跷跷板）。
      </li>
      <li><strong>"跟老师"把决策外包了。</strong>外包出去的不只是判断，还有复盘的可能：错了，你连原因都找不到。</li>
    </ol>

    <h3 id="c06-m" class="sub-title" data-spy>常见误区</h3>
    <Callout variant="warn" title="误区一：“框架完整就等于策略有效。”">
      <p>
        <strong>为什么错：</strong>七问全过只说明这个方法可评估、可复盘，是一张入场券；
        有效与否要靠样本外检验等一整套流程（后文〔B6-C12〕）。一个答全七问、但收益来源是幻觉的方法，照样亏。
      </p>
      <p><strong>正确做法：</strong>把体检当资格赛，把验证当正赛，两关分开过。</p>
    </Callout>
    <Callout variant="warn" title="误区二：“框架学好了，它就会告诉我买什么。”">
      <p>
        <strong>为什么错：</strong>框架不产 Alpha（本章第二节），它给的是检查结论，不是信号；
        买什么、用什么术，是你自己的选择（门派怎么选见〔B8-C08〕）。
      </p>
      <p><strong>正确做法：</strong>用框架筛方法，用规则做决定，两层各干各的活。</p>
    </Callout>
    <Callout variant="warn" title="误区三：“七问答不上的方法一定亏钱，答上的就安全。”">
      <p>
        <strong>为什么错：</strong>前半句无法断定——说不清的方法也可能碰上好行情；后半句更不对，答上七问离有效还差一整个验证流程。
        真正的问题是：答不上的方法亏了之后无法归因，你也无力改进它。
      </p>
      <p><strong>正确做法：</strong>按〔B1-C02〕的口径执行"说不清就不采信"，把无法评估的方法挡在门外，而不是预测它的输赢。</p>
    </Callout>

    <h3 id="c06-z" class="sub-title" data-spy>自测题</h3>
    <QuizItem>
      <template #q>题 1：不看正文，写出体检七问。</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>收益来源？止损？仓位？退出？样本外？成本？失效条件？可用口诀记：谁赚、错哪、多少、怎么走、凭啥信、花多少、啥时候坏。写不全，说明照妖镜还没装好，回到第四节把表抄一遍。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 2：给这段虚构描述打体检分："乙 ETF 均线法：收盘跌破 5 日均线就买入，涨回 10 日均线就卖出，账户资金一次全上。作者自述用了一年，感觉不错。"</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>收益来源 0：没提赚谁的钱；止损 0：没有任何认错点；仓位 2："一次全上"明确，但这个写法本身危险，得分只代表"说了"，安全性另议（〔B3-C04〕的单票上限会拦住它）；退出 2：涨回 10 日均线卖出，规则明确；样本外 0："自述一年"既无数据也无新数据检验；成本 0：未提；失效条件 0：未提。</p>
        <p>合计 4/14。注意：那 4 分全部来自"说清楚了"，而说清楚不等于安全——仓位那一项就是反例。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 3：下列哪个说法可证伪？A："这股票迟早会涨。" B："收盘跌破 20 日均线我就离场。" C："跌是主力洗盘，是好事。"</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>只有 B。B 能说出"什么情况算我错"——离场之后走势证明判断错了，可以复盘追责。A 与 C 把所有后续走势都提前解释掉了，不可能错，因此也无法被检验或改进。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 4："我朋友按某方法三个月赚了 30%，体检分肯定高。"这句话有什么问题？</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>两处混淆。其一，体检分衡量"描述说得清不清"，与盈亏无关；其二，三个月、一个人的结果是极小样本，说明不了方法有效（样本量问题见〔B6-C03〕）。赚钱与否不能代替七问。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 5：某方法自称胜率 75%、平均每笔盈利 1.5%、平均每笔亏损 6%（独立示意）。不计成本算 E，并给一句话结论。</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>E = 75% × 1.5% − 25% × 6% = 1.125% − 1.5% = <strong>−0.375%/笔</strong>。结论：又是一个高胜率负期望（与 EX-E 同构）。遇到宣传胜率的说法，先要平均盈亏，再算 E。</p>
      </template>
    </QuizItem>

    <h3 id="c06-c" class="sub-title" data-spy>速查卡</h3>
    <div class="cheat-card">
      <div class="cc-title">体检七问（每问 0~2 分，满分 14；分数=说得清程度，不等于有效性）</div>
      <ol style="padding-left: 20px;">
        <li>收益来源——赚谁的钱？〔B1-C02〕</li>
        <li>止损——错了在哪认错？〔B3-C05〕</li>
        <li>仓位——买多少？〔B3-C04〕</li>
        <li>退出——对了怎么走？〔B3-C09〕</li>
        <li>样本外——新数据上成立吗？〔B6-C06〕</li>
        <li>成本——费率滑点算了吗？〔B2-C05〕</li>
        <li>失效条件——什么情况算坏了？〔B6-C11〕</li>
      </ol>
      <p style="margin-top: 10px;"><strong>三句话带走</strong>：框架不产收益；"怎么都对"等于没用；说不清就不采信。</p>
    </div>
    <p class="table-note">
      延伸：来源三问〔B1-C02〕· 期望收益与高胜率陷阱〔B1-C03〕· 安全带完整算法〔B3-C04 / C05〕· 样本外与验证〔B6-C06 / C12〕· 常见骗局〔B2-C08〕· 拆解卡九字段〔B8-C02〕· 亏损三类归因〔B7-C01〕
    </p>
  </section>
</template>
