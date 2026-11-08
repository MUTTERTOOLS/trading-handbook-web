<script setup lang="ts">
import RiskNotice from '@/shared/components/RiskNotice.vue';

const volumes = [
  { id: 'B1', name: '交易入门地图', chapters: 7, live: true, href: './b1-map.html', vol: 'v-b1' },
  { id: 'B2', name: '市场规则与下单实务', chapters: 8, vol: 'v-b2' },
  { id: 'B3', name: '风控与资金管理', chapters: 12, live: true, href: './risk-math.html', vol: 'v-b3' },
  { id: 'B4', name: '读盘入门：价量与技术结构', chapters: 10, vol: 'v-b4' },
  { id: 'B5', name: '基本面与估值入门', chapters: 8, vol: 'v-b5' },
  { id: 'B6', name: '策略验证与统计常识', chapters: 12, vol: 'v-b6' },
  { id: 'B7', name: '执行纪律与交易复盘', chapters: 9, vol: 'v-b7' },
  { id: 'B8', name: '实战门派图鉴与选择', chapters: 11, vol: 'v-b8' },
];

const abilityChain = [
  { text: '能看懂市场规则', src: '册二' },
  { text: '能算出每笔最多亏多少、买多少', src: '册三' },
  { text: '能判断一个方法是有效还是运气', src: '册六' },
  { text: '能按规则执行并复盘', src: '册七' },
  { text: '能拆解和选择一个门派', src: '册八' },
];
</script>

<template>
  <main id="main" class="no-sidebar">
    <div class="container">
      <div class="cover">
        <div class="cover-inner">
          <div class="badge">新手交易系统化入门丛书 · 交互阅读版</div>
          <h1 class="accent-gradient-text">风险，先于方法</h1>
          <p class="subtitle">
            全书 8 册 77 章的网页化阅读工程 · 册一《交易入门地图》与册三《风控与资金管理》全册已上线
          </p>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="label">分册</div>
              <div class="value tabular">8 册</div>
            </div>
            <div class="meta-card">
              <div class="label">章节</div>
              <div class="value tabular">77 章</div>
            </div>
            <div class="meta-card">
              <div class="label">正文规模</div>
              <div class="value tabular">约 54 万字</div>
            </div>
          </div>

          <div class="chart-box">
            <div class="chart-title">丛书地图（点击进入已上线主题页）</div>
            <div class="map-path" role="list">
              <template v-for="(v, i) in volumes" :key="v.id">
                <a
                  v-if="v.live"
                  class="map-node current"
                  :class="v.vol"
                  role="listitem"
                  :href="v.href"
                  :title="`${v.id} · ${v.name} · ${v.chapters} 章（已上线）`"
                >{{ v.id }} {{ v.name }}</a>
                <span
                  v-else
                  class="map-node todo"
                  :class="v.vol"
                  role="listitem"
                  :title="`${v.id} 《${v.name}》· ${v.chapters} 章 · 待网页化`"
                >{{ v.id }} {{ v.name }}</span>
                <span v-if="i < volumes.length - 1" class="map-arrow" aria-hidden="true">→</span>
              </template>
            </div>
          </div>

          <div class="reading-path chart-box">
            <div class="chart-title">读完这套书应具备的能力链</div>
            <div v-for="(step, i) in abilityChain" :key="step.text" class="path-step">
              <span class="step-num">{{ i + 1 }}</span>
              <span class="step-text"><strong>{{ step.text }}</strong>（{{ step.src }}）</span>
            </div>
          </div>

          <div class="callout callout-tip">
            <div class="callout-title">关于网页版</div>
            <p>
              本站是纸稿丛书的交互阅读版：<strong>摘编重点章节</strong>，把书中的统一算例
              （EX-A ~ EX-R）做成可调参数的图表与计算器。网页版不替代原书，全部"起步参考值"
              均需个人校准；涉及交易规则、费率、税款的数字在原书中以【待核验】标注，发布前须经官方来源核验。
            </p>
          </div>

          <RiskNotice />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.reading-path {
  text-align: left;
}
</style>
