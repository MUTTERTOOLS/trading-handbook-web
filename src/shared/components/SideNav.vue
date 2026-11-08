<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { NavGroup } from './nav';

const props = defineProps<{
  brand: string;
  brandSub: string;
  groups: NavGroup[];
}>();

const open = ref(false);
const close = () => { open.value = false; };

/** 整个侧栏的收纳（桌面端），记忆在 localStorage */
const collapsed = ref(readStored());
function readStored(): boolean {
  try {
    return localStorage.getItem('thw-sidebar-collapsed') === '1';
  } catch {
    return false;
  }
}
function toggleCollapsed() {
  collapsed.value = !collapsed.value;
  try {
    localStorage.setItem('thw-sidebar-collapsed', collapsed.value ? '1' : '0');
  } catch {
    /* 隐私模式等场景下忽略 */
  }
}
watch(
  collapsed,
  (v) => document.body.classList.toggle('sb-collapsed', v),
  { immediate: true }
);

/** 折叠状态：按条目 label 记录展开的章节 */
const expanded = ref<Set<string>>(new Set());
const isExpanded = (label: string) => expanded.value.has(label);
function toggle(label: string) {
  const next = new Set(expanded.value);
  if (next.has(label)) next.delete(label);
  else next.add(label);
  expanded.value = next;
}
function expand(label: string) {
  if (!expanded.value.has(label)) {
    const next = new Set(expanded.value);
    next.add(label);
    expanded.value = next;
  }
}
/** 点击章节名：已展开 → 收纳（不跳转）；未展开 → 展开并跳转 */
function onChapterClick(e: MouseEvent, label: string) {
  if (isExpanded(label)) {
    e.preventDefault();
    toggle(label);
    return;
  }
  expand(label);
  close();
}

// 高亮变化时：自动展开当前所在章节；侧栏滚动到高亮项
watch(
  () => props.groups,
  (groups) => {
    const withChildren = groups.flatMap((g) => g.items).filter((i) => i.children?.length);
    for (const item of withChildren) {
      const selfActive = item.active;
      const childActive = item.children?.some((c) => c.active);
      if ((selfActive || childActive) && !expanded.value.has(item.label)) {
        expand(item.label);
      }
    }
    nextTick(() => {
      document
        .querySelector('#sidebar nav a.active')
        ?.scrollIntoView({ block: 'nearest' });
    });
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <button
    id="mobile-toggle"
    type="button"
    aria-label="打开目录"
    :aria-expanded="open"
    @click="open = !open"
  >
    ☰
  </button>
  <!-- 侧栏收起后的恢复浮标（桌面端） -->
  <button
    id="sidebar-pin"
    type="button"
    aria-label="展开目录栏"
    @click="toggleCollapsed"
  >
    »
  </button>
  <div
    id="sidebar-backdrop"
    :class="{ show: open }"
    @click="close"
  ></div>
  <aside id="sidebar" :class="{ open }" aria-label="页面目录">
    <button
      id="sidebar-collapse-btn"
      type="button"
      aria-label="收纳目录栏"
      data-tooltip="收纳目录栏"
      @click="toggleCollapsed"
    >
      «
    </button>
    <a class="logo" href="./index.html">
      {{ brand }}
      <span>{{ brandSub }}</span>
    </a>
    <nav>
      <template v-for="group in groups" :key="group.label">
        <div class="part-label" :class="{ alt: group.alt }">{{ group.label }}</div>
        <div :class="{ indent: group.indent }">
          <template v-for="item in group.items" :key="item.label">
            <span
              v-if="item.disabled"
              class="nav-disabled"
              :class="{ indent: item.indent }"
              aria-disabled="true"
            >{{ item.label }}</span>

            <!-- 可折叠章节 -->
            <template v-else-if="item.children?.length">
              <div class="nav-chapter" :class="{ active: item.active }">
                <button
                  type="button"
                  class="nav-caret"
                  :class="{ open: isExpanded(item.label) }"
                  :aria-expanded="isExpanded(item.label)"
                  :aria-label="`展开或折叠：${item.label}`"
                  @click="toggle(item.label)"
                >▸</button>
                <a
                  :href="item.href"
                  :class="{ active: item.active }"
                  :title="isExpanded(item.label) ? '点击收纳本章目录' : undefined"
                  @click="onChapterClick($event, item.label)"
                >{{ item.label }}</a>
              </div>
              <div v-show="isExpanded(item.label)" class="nav-children">
                <a
                  v-for="child in item.children"
                  :key="child.label"
                  :href="child.href"
                  :class="{ active: child.active }"
                  :aria-current="child.active ? 'location' : undefined"
                  @click="close"
                >{{ child.label }}</a>
              </div>
            </template>

            <!-- 普通条目 -->
            <a
              v-else
              :href="item.href"
              :class="{ active: item.active, indent: item.indent }"
              :aria-current="item.active ? 'page' : undefined"
              @click="close"
            >{{ item.label }}</a>
          </template>
        </div>
      </template>
    </nav>
  </aside>
</template>
