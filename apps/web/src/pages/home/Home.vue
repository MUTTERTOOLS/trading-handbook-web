<script setup lang="ts">
import RiskNotice from '@/shared/components/RiskNotice.vue';
import { series } from '@/content';

const volumes = series.volumes.map((volume) => ({
  id: volume.id,
  name: volume.title,
  chapters: volume.chapters.length,
  href: `./${volume.slug}.html`,
  vol: `v-${volume.theme}`,
}));

const totalWan = (series.totals.chars / 10000).toFixed(1);

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
            全书 {{ series.totals.volumes }} 册 {{ series.totals.chapters }} 章的网页化阅读工程 ·
            全部 {{ series.totals.volumes }} 册已上线
          </p>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="label">分册</div>
              <div class="value tabular">{{ series.totals.volumes }} 册</div>
            </div>
            <div class="meta-card">
              <div class="label">章节</div>
              <div class="value tabular">{{ series.totals.chapters }} 章</div>
            </div>
            <div class="meta-card">
              <div class="label">正文规模</div>
              <div class="value tabular">约 {{ totalWan }} 万字</div>
            </div>
          </div>

          <div class="chart-box">
            <div class="chart-title">丛书地图（点击进入各册主题页）</div>
            <div class="map-path" role="list">
              <template v-for="(volume, index) in volumes" :key="volume.id">
                <a
                  class="map-node current"
                  :class="volume.vol"
                  role="listitem"
                  :href="volume.href"
                  :title="`${volume.id} · ${volume.name} · ${volume.chapters} 章`"
                >{{ volume.id }} {{ volume.name }}</a>
                <span v-if="index < volumes.length - 1" class="map-arrow" aria-hidden="true">→</span>
              </template>
            </div>
          </div>

          <div class="reading-path chart-box">
            <div class="chart-title">读完这套书应具备的能力链</div>
            <div v-for="(step, index) in abilityChain" :key="step.text" class="path-step">
              <span class="step-num">{{ index + 1 }}</span>
              <span class="step-text"><strong>{{ step.text }}</strong>（{{ step.src }}）</span>
            </div>
          </div>

          <div class="callout callout-tip">
            <div class="callout-title">关于网页版</div>
            <p>
              本站是纸稿丛书的交互阅读版：<strong>收录全书 {{ series.totals.volumes }} 册
              {{ series.totals.chapters }} 章全文</strong>，交互图表与计算器是对原文统一算例
              （EX-A ~ EX-R）和"绘图说明"的实现。网页版不替代原书，全部"起步参考值"
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
