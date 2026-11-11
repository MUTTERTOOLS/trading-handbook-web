<script setup lang="ts">
import Callout from '@/shared/components/Callout.vue';
import ChapterHead from '@/shared/components/ChapterHead.vue';
import GoalsCard from '@/shared/components/GoalsCard.vue';
import OpeningBox from '@/shared/components/OpeningBox.vue';
import QuizItem from '@/shared/components/QuizItem.vue';

const volumesTable = [
  { v: '册一（本书）', n: '交易入门地图', d: '建预期、给框架' },
  { v: '册二', n: '市场规则与下单实务', d: '认识品种、开户下单、费用与防骗' },
  { v: '册三', n: '风控与资金管理', d: '算出买多少、亏多少、何时停' },
  { v: '册四', n: '读盘入门：价量与技术结构', d: '价量与工具的客观标注' },
  { v: '册五', n: '基本面与估值入门', d: '财报初读、估值与排雷' },
  { v: '册六', n: '策略验证与统计常识', d: '判断一个方法有效还是运气' },
  { v: '册七', n: '执行纪律与交易复盘', d: '把规则执行到位、按账复盘' },
  { v: '册八', n: '实战门派图鉴与选择', d: '拆解流派、选定门派' },
];
const path1 = [
  '〔B1-C01〕〔B1-C02〕〔B1-C03〕〔B1-C06〕〔B1-C07〕——本书框架；〔B1-C04〕〔B1-C05〕可回补',
  '〔B2-C01〕认识 ETF →〔B2-C02〕开户与第一笔下单 →〔B2-C05〕费用 →〔B2-C08〕防骗',
  '〔B3-C01〕亏不起的数学 →〔B3-C11〕闲钱与资金期限 →〔B3-C12〕风控速查卡',
  '〔B8-C03〕宽基指数定投的门派拆解',
];
</script>

<template>
  <section id="c07" class="section">
    <ChapterHead tag="§7 · 对应 B1-C07" src="全章约 2,600 字（导航章）· 不教新内容，只负责指路">
      <h2>全丛书使用说明</h2>
    </ChapterHead>

    <OpeningBox>
      <p>
        小明读完第一册，心里踏实了些，可一看书单就发怵：全套八册、七十七章。
        三个问题马上冒出来：我全都得读吗？只有周末有空，得学到什么时候？同事说他只想做点定投，是不是可以少读一半？
      </p>
      <p>本章是全丛书的导航页：三条路线、三条使用声明，以及速查卡和术语表的用法。它不教新内容，只负责指路。</p>
    </OpeningBox>

    <Callout variant="key" title="一句话结论">
      <p>按起点选路径，只用闲钱，参考值当起点；按建议节奏学完，再谈上手。</p>
    </Callout>

    <GoalsCard>
      <ol class="goals-list">
        <li>能对照自己的基础与目标，从三条阅读路径中选出一条，并说出它经过哪些章。</li>
        <li>能复述三条使用声明：参考值需个人校准、只用闲钱、学习节奏是建议而非承诺。</li>
        <li>会用每章末的速查卡与术语表快速定位知识点。</li>
      </ol>
    </GoalsCard>

    <h3 id="c07-s1" class="sub-title" data-spy>一、八册各管什么</h3>
    <p>全书八册是一条能力链：看懂规则 → 算清风险 → 判断有效 → 执行复盘 → 选定门派。</p>
    <table class="data-table">
      <thead><tr><th>册</th><th>书名</th><th>一句话分工</th></tr></thead>
      <tbody>
        <tr v-for="row in volumesTable" :key="row.v">
          <td>{{ row.v }}</td>
          <td>{{ row.n }}</td>
          <td>{{ row.d }}</td>
        </tr>
      </tbody>
    </table>

    <h3 id="c07-s2" class="sub-title" data-spy>二、三条阅读路径</h3>
    <p><strong>路径一：零基础顺读。</strong>适合没开过户、没买过股票的读者。从〔B1-C01〕按册序一路读到〔B8-C11〕，一章不跳；册二读完紧接着读册三。</p>
    <p>
      <strong>路径二：有基础跳读。</strong>适合交易过一段但没系统学过的读者。
      路线：〔B1〕全读（重点第 1、3、6 章）→〔B2-C01〕〔B2-C03〕〔B2-C04〕〔B2-C05〕查规则漏洞 →〔B3〕全读（重点册，一章别跳）
      →〔B4〕〔B5〕按方向选读：想学看盘先读册四，想做基本面先读册五 →〔B6〕全读 →〔B7〕全读 →〔B8〕全读。
      跳过的章不强制补读，遇到看不懂的概念再回头查。
    </p>
    <p><strong>路径三：只想定投的直达路径。</strong>适合现阶段只想做宽基指数定投（门派 A）的读者，经过的章如下：</p>
    <ol>
      <li v-for="(s, i) in path1" :key="i">{{ s }}</li>
    </ol>
    <p class="table-note">这条路径绕开了看盘与验证的深水区，代价是遇到新问题时缺工具。建议一年内补读册三其余章节与册六。</p>

    <h3 id="c07-s3" class="sub-title" data-spy>三、三条使用声明</h3>
    <p>
      <strong>声明一：所有参考值都是起点，不是标准。</strong>书里带数字的参数都标注"起步参考值，需个人校准"，
      作用是给一个能动手的默认值；校准方法在册三，做完你会有自己的数字。
    </p>
    <p>
      <strong>声明二：只用闲钱。</strong><strong>闲钱</strong>的初步定义：全部亏损也不影响正常生活、且一年内确定用不到的钱。
      这只是及格线，定投对期限要求更严；资金分层与借钱投资的禁令详见〔B3-C11〕。
    </p>
    <p><strong>声明三：学习节奏是建议，不是承诺。</strong>每册安排 2~3 周，全书约 4~6 个月走完，可快可慢；风控与声明的章不跳读，宁可慢。</p>

    <h3 id="c07-s4" class="sub-title" data-spy>四、速查卡与术语表怎么用</h3>
    <ul>
      <li><strong>速查卡</strong>在每章末尾，是操作时的对照表，用法是"用时看"，不是"背下来"。最重要的一张在〔B3-C12〕：开仓前逐项勾选。</li>
      <li><strong>术语表</strong>：每个术语在全书首次出现时加粗并给一句话定义，每册结尾汇总本册新术语。读到陌生词，先查当册汇总，再回它首次出现的章。</li>
      <li>本章速查卡附有第一册全部新术语的索引，可当全书词汇的起点。</li>
    </ul>

    <h3 id="c07-s5" class="sub-title" data-spy>五、免责声明</h3>
    <p>以下文字是全书共用的风险提示，翻开任何一册都会先看到：</p>
    <div class="callout callout-danger">
      <div class="callout-title">全书共用风险提示</div>
      <p>
        本书内容仅为教育与方法讨论，不构成任何投资建议或证券推荐。市场有风险，投资可能导致本金亏损。
        书中示例均为虚构或说明性案例，书中数字为"起步参考值"，需结合个人情况校准。交易规则与费率以交易所及券商最新规定为准。
      </p>
    </div>
    <p>把它放在这里是想说清楚：读完八册，也不会改变这段话的任何一个字。</p>

    <h3 id="c07-m" class="sub-title" data-spy>常见误区</h3>
    <Callout variant="warn" title="误区一：“我先收藏全套书，等有空一次读完。”">
      <p><strong>为什么错：</strong>收藏不产生理解。这套书按"边读边练"设计，攒着跳过会越读越空。</p>
      <p><strong>正确做法：</strong>选定一条路径，按周推进；哪怕每周只读一章，也比囤着强。</p>
    </Callout>
    <Callout variant="warn" title="误区二：“参考值就是行业标准，照抄就行。”">
      <p><strong>为什么错：</strong>你的本金、期限、承受力都与示例不同，照抄等于替别人做校准。</p>
      <p><strong>正确做法：</strong>把参考值当第一版草稿，读完册三后用个人校准表换成自己的数字。</p>
    </Callout>
    <Callout variant="warn" title="误区三：“读完八册就能开始赚钱了。”">
      <p>
        <strong>为什么错：</strong>丛书教的是流程与判断，不承诺任何收益；结果取决于方法、验证与执行，也取决于方差（后文〔B6-C02〕）。
      </p>
      <p><strong>正确做法：</strong>学完先做模拟盘与最小单位演练（〔B2-C02〕），验证过的方法配小资金起步。</p>
    </Callout>

    <h3 id="c07-z" class="sub-title" data-spy>自测题</h3>
    <QuizItem>
      <template #q>题 1：小李没开过户，想系统学习；小张定投两年，想补理论。给两人各推荐一条路径并说明理由。</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>小李走路径一，按册序全读；小张已有定投实践，缺口在风险与验证，走路径二的变体：〔B3〕与〔B6〕全读优先，其余按需选读。路径跟随基础与目标，没有唯一答案。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 2："起步参考值"四个字意味着什么？它与"标准答案"差在哪？</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>意味着它是新手可用的默认起点，必须结合个人本金、期限与承受力校准；不是行业规定，也不是最优解。用法是先照着跑，再换成自己的数字。</p>
      </template>
    </QuizItem>
    <QuizItem>
      <template #q>题 3（判断）："只要我用的是闲钱，亏了也不影响生活，就可以借钱加仓放大收益。"</template>
      <template #a>
        <p><span class="ans-label">答案与解析：</span>错误。闲钱是入场资格，不是放大仓位的理由；借钱投资被全书禁止，细则见〔B3-C11〕。它只回答"能不能进来"，不回答"要不要放大"。</p>
      </template>
    </QuizItem>

    <h3 id="c07-c" class="sub-title" data-spy>速查卡</h3>
    <div class="cheat-card">
      <div class="cc-title">三条路径</div>
      <ul style="padding-left: 20px;">
        <li>零基础：B1→B2→B3→B4→B5→B6→B7→B8（全读）</li>
        <li>有基础：B1 全读；B2-C01/C03/C04/C05；B3 全读；B4 或 B5 选读；B6、B7、B8 全读</li>
        <li>定投直达：B1-C01/02/03/06/07 → B2-C01/02/05/08 → B3-C01/11/12 → B8-C03</li>
      </ul>
      <p style="margin-top: 10px;"><strong>三条声明</strong>：参考值需个人校准；只用闲钱（详见〔B3-C11〕）；每册 2~3 周，建议非承诺。</p>
      <p>
        <strong>第一册新术语索引</strong>：〔B1-C01〕期望值、对手盘、零和、正和、负和、书面规则、宽基 ETF；
        〔B1-C02〕二级市场、五类收益来源、风险溢价、行为偏差、制度与结构约束、流动性提供、分析优势、来源三问；
        〔B1-C03〕1R、R 倍数、期望收益、胜率、平均盈利、平均亏损、摩擦成本、盈亏比、盈亏平衡胜率；
        〔B1-C04〕5+1 信息分类、风、时、价、量、仓、心、成本 C；
        〔B1-C05〕道（认知层）、法（规则层）、术（工具层）、九个衍生工具；
        〔B1-C06〕Alpha、可证伪、样本外、体检七问；〔B1-C07〕闲钱。
      </p>
    </div>
    <p class="table-note">
      延伸：开户与第一笔下单〔B2-C02〕· 资金分层与个人校准〔B3-C11 / C12〕· 宽基指数定投完整拆解〔B8-C03〕· 从拆解到上线的全书工作流〔B8-C09〕
    </p>
  </section>
</template>
