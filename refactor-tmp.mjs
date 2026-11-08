import fs from 'node:fs';

const comp = 'src/pages/risk-math/components';

/* ---------- A. 图表组件：强调色改为运行时读取主题变量 ---------- */
const charts = ['RecoverCurve.vue', 'ExpectancyExplorer.vue', 'DrawdownStreak.vue'];
for (const f of charts) {
  const p = `${comp}/${f}`;
  let t = fs.readFileSync(p, 'utf8');
  t = t.replace(
    "import { chartTheme, darkTooltip } from '@/shared/lib/theme';",
    "import { chartTheme, darkTooltip, getChartTheme } from '@/shared/lib/theme';"
  );
  t = t.replace(/(function buildOption\(\): ChartOption \{\n)/, '$1  const t = getChartTheme();\n');
  t = t.split('chartTheme.accent').join('t.accent');
  fs.writeFileSync(p, t);
  console.log(`${f}: accent→theme ✓`);
}

/* ---------- B. 章节组件：抽取共享组件 ---------- */
const chapters = Array.from({ length: 12 }, (_, i) => `Chapter${['One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve'][i]}.vue`);

const IMPORTS = [
  "import ChapterHead from '@/shared/components/ChapterHead.vue';",
  "import GoalsCard from '@/shared/components/GoalsCard.vue';",
  "import OpeningBox from '@/shared/components/OpeningBox.vue';",
  "import QuizItem from '@/shared/components/QuizItem.vue';",
].join('\n');

for (const f of chapters) {
  const p = `${comp}/${f}`;
  let t = fs.readFileSync(p, 'utf8');
  const before = t.length;
  let sectionHead = 0, opening = 0, goals = 0, quiz = 0;

  // 1. 章节头
  t = t.replace(
    /<div class="section-head">\s*<div class="section-tag">([^<]+)<\/div>\s*<h2>([\s\S]*?)<\/h2>\s*<div class="section-src">([^<]+)<\/div>\s*<\/div>/,
    (_, tag, h2, src) => {
      sectionHead++;
      return `<ChapterHead tag="${tag}" src="${src}">\n        <h2>${h2}</h2>\n      </ChapterHead>`;
    }
  );

  // 2. 开场问题框（后随"一句话结论" Callout）
  t = t.replace(
    /<div class="opening">\s*<div class="op-label">开场问题<\/div>([\s\S]*?)<\/div>\n\n(\s*<Callout variant="key")/,
    (_, body, callout) => {
      opening++;
      return `<OpeningBox>${body}</OpeningBox>\n\n${callout}`;
    }
  );

  // 3. 学习目标卡
  t = t.replace(
    /<div class="cheat-card" style="margin-top: 20px;">\s*<div class="cc-title">本章学习目标<\/div>\s*(<ol class="goals-list">[\s\S]*?<\/ol>)\s*<\/div>/,
    (_, ol) => {
      goals++;
      return `<GoalsCard>\n        ${ol}\n      </GoalsCard>`;
    }
  );

  // 4. 自测题折叠卡（全局）
  t = t.replace(/<details class="quiz">\n      <summary>/g, () => {
    quiz++;
    return '<QuizItem>\n      <template #q>';
  });
  t = t.split('</summary>\n      <div class="quiz-body">').join('</template>\n      <template #a>');
  t = t.split('</div>\n    </details>').join('</template>\n    </QuizItem>');

  // 5. 注入 import（紧跟 Callout import 之后）
  t = t.replace(
    /(import Callout from '@\/shared\/components\/Callout\.vue';\n)/,
    `$1${IMPORTS}\n`
  );

  fs.writeFileSync(p, t);
  console.log(`${f}: head=${sectionHead} opening=${opening} goals=${goals} quiz=${quiz} (${before}→${t.length})`);
}
