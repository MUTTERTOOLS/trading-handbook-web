# -*- coding: utf-8 -*-
"""从用户粘贴稿中抽取 Bible/样章/规格表，搭建丛书工作区并冻结 v1.1。"""
import io, os, sys

SRC = r"C:\Users\Lenovo\.zcode\tmp\paste-attachments\2026-11-07\pasted-text-20261107-025700-319fb54f.txt"
ROOT = r"D:\Desktop\workspace\trading-series"

with io.open(SRC, "r", encoding="utf-8-sig") as f:
    lines = f.read().replace("\r\n", "\n").split("\n")

def first(pred, start=0):
    for i in range(start, len(lines)):
        if pred(lines[i].strip()):
            return i
    raise ValueError("anchor not found: %r" % pred)

def last(pred, end=None):
    e = len(lines) if end is None else end
    for i in range(e - 1, -1, -1):
        if pred(lines[i].strip()):
            return i
    raise ValueError("anchor not found: %r" % pred)

i_title = first(lambda s: s.startswith("# 《新手交易系统化入门丛书》编写总方案"))
i_shen  = first(lambda s: s.startswith("3. **审校包：**"))
i_yaml  = first(lambda s: s == "```yaml", i_title)
i_deliv = first(lambda s: s.startswith("# `B3-C04_delivery"))
i_fx    = last(lambda s: s.startswith("本章内容不预测价格"), i_deliv)
i_c15   = first(lambda s: s.startswith("| 15 | 算术二次复算"))
i_15 = first(lambda s: s.startswith("## 1.5 "))
i_16 = first(lambda s: s.startswith("## 1.6 "))
i_17 = first(lambda s: s.startswith("## 1.7 "))
i_p2 = first(lambda s: s.startswith("# 第二部分"))
i_p3 = first(lambda s: s.startswith("# 第三部分"))

HEADER = """> **v1.1 生产冻结版 · 总编裁决（本块优先于正文任何条款）**
>
> 本环境为离线全自动生产：写作与审校 agent 一律不得提问、不得等待人工确认。原 v1.0 的"变更请求(CR)"流程调整为：agent 按下方优先级自行裁决并记入交付说明"偏离说明"，验收阶段由总编（主代理）统一复核。
>
> 1.【采纳】"滑点缓冲"（仓位公式内每股风险的余量，如 EX-B 的 0.05 元）与"滑点假设"（回测成本参数，单边 0.05%~0.2%）是两个口径，不得混用，各处标注清楚。
> 2.【采纳】新增风控规则：向下取整后若"实际计划亏损 > 1R"，一律不开仓（缩小到最小可行单位、改用 ETF 或放弃）。写入 B3-C04 正文与 B3-C12 速查卡。
> 3.【采纳】"本金"统一口径 = 下单当天盘前账户总权益（现金 + 持仓市值）。
> 4.【归属裁决】"前视偏差"方法论归 B6-C05 深讲；B5-C07 只讲披露时滞与"当时可得"原则并举例，回测语境 ≤2 句 + 〔B6-C05〕链接。
> 5.【红线检查口径】红线 1 与 1.10 禁用词限于"向读者承诺/暗示收益"的语境；金融学术语（如"无风险利率"）与防骗章节为驳斥而引用的骗局话术（如所谓"保本高收益"）不违规，但必须处于明确驳斥或定义语境。
> 6.【波次1引用】册三对 B2/B4/B6/B7 的引用按 2.1 前向提及规则处理：只写"详见〔B2-C0x〕"，不依赖其内容即可读懂。
> 7.【文件命名】章节文件名 `B{X}-C{YY}.md`、交付说明 `B{X}-C{YY}_delivery.md`（章题在 yaml title 字段）；成品汇编阶段恢复中文书名。其余遵循附录 D。
> 8.【冲突优先级】红线(1.2) > 总编裁决(本块) > 常量表(1.6) > 术语表(1.5) > 归属表(第二部分) > 册规格 > 章规格 > agent 自行判断。

"""

VERIFY = """# 06 待核验清单（全丛书汇总）

> 截稿日期：2026-11-07。凡交易规则、费率、税、时间、板块规则、准入门槛类数值，以交易所与券商最新规定为准。
> 汇总方式：验收阶段扫描全部 *_delivery.md 的待核验清单自动汇总；发布前须逐项核验或改为定性表述。

| 编号 | 来源章节 | 事项 | 建议处理 | 状态 |
|---|---|---|---|---|
"""

def section(a, b):
    seg = lines[a:b]
    while seg and not seg[-1].strip():
        seg.pop()
    return "\n".join(seg).strip() + "\n"

def w(rel, content):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with io.open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    return p

bible_lines = lines[i_title:i_shen + 1]
bible_lines[0] = "# 《新手交易系统化入门丛书》编写总方案（生产冻结版 v1.1）"
bible = HEADER + "\n".join(bible_lines).strip() + "\n"

sample   = "\n".join(lines[i_yaml:i_fx + 1]).strip() + "\n"
delivery = "\n".join(lines[i_deliv:i_c15 + 1]).strip() + "\n"

written = []
written.append(w("00_Bible_v1.1.md", bible))
written.append(w(r"B3\B3-C04.md", sample))
written.append(w(r"B3\B3-C04_delivery.md", delivery))
written.append(w(r"_meta\01_Glossary.md", "# 01 统一术语表（提取自总方案 1.5）\n\n" + section(i_15, i_16)))
written.append(w(r"_meta\02_Constants.md", "# 02 核心公式与常量表（提取自总方案 1.6）\n\n" + section(i_16, i_17)))
written.append(w(r"_meta\05_Template.md", "# 05 章节标准模板（提取自总方案 1.7）\n\n" + section(i_17, i_p2)))
written.append(w(r"_meta\03_Ownership.md", "# 03 依赖关系与概念归属表（提取自总方案第二部分）\n\n" + section(i_p2, i_p3)))
written.append(w(r"_meta\06_Verify.md", VERIFY))

for v in ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "compiled"]:
    os.makedirs(os.path.join(ROOT, v), exist_ok=True)

print("python:", sys.version.split()[0])
for p in written:
    with io.open(p, encoding="utf-8") as f:
        t = f.read()
    ls = [x for x in t.split("\n") if x.strip()]
    print("-" * 60)
    print(p)
    print("  lines:", t.count("\n") + 1, " chars:", len(t.replace(" ", "").replace("\n", "")))
    print("  head:", ls[0][:46])
    print("  tail:", ls[-1][:46])
