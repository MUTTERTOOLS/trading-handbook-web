# -*- coding: utf-8 -*-
"""章节机械验收：章节齐全性/模板小节/字数/禁用词/引用/交付说明存在性。"""
import io, os, re, sys

ROOT = r"D:\Desktop\workspace\trading-series"
EXPECTED = {"B1": 7, "B2": 8, "B3": 12, "B4": 10, "B5": 8, "B6": 12, "B7": 9, "B8": 11}
REQUIRED = ["## 开场问题", "## 一句话结论", "## 本章学习目标", "## 正文",
            "## 常见误区", "## 本章小结", "## 自测题", "## 延伸与链接", "风险提示"]
FORBIDDEN = ["稳赚", "必涨", "圣杯", "保本", "无风险", "跟我买", "六元", "门派一", "门派二",
             "门派三", "门派四", "悟道", "出神入化", "一眼看穿"]
REF = re.compile(r"〔B(\d)-C(\d{2})〕")

def terms_count(s):
    m = re.search(r"new_terms:\s*\[(.*?)\]", s, re.S)
    if not m:
        return -1
    return len([x for x in re.split(r"[,，]", m.group(1)) if x.strip()])

def main():
    vols = sys.argv[1:] or list(EXPECTED)
    total_bad = 0
    for v in vols:
        d = os.path.join(ROOT, v)
        if not os.path.isdir(d):
            print("[%s] 目录不存在" % v)
            total_bad += 1
            continue
        files = sorted(os.listdir(d))
        chap = [f for f in files if re.match(r"^%s-C\d{2}\.md$" % v, f)]
        missing = ["%s-C%02d" % (v, i) for i in range(1, EXPECTED[v] + 1)
                   if "%s-C%02d.md" % (v, i) not in chap]
        if missing:
            print("[%s] 缺章: %s" % (v, ", ".join(missing)))
            total_bad += 1
        for fn in chap:
            s = io.open(os.path.join(d, fn), encoding="utf-8").read()
            issues = []
            for r in REQUIRED:
                if r not in s:
                    issues.append("缺小节:" + r)
            n = len(re.sub(r"\s", "", s))
            if n < 2400:
                issues.append("字数少:%d" % n)
            if n > 8000:
                issues.append("字数多:%d" % n)
            for wd in FORBIDDEN:
                idx = s.find(wd)
                if idx >= 0:
                    ctx = s[max(0, idx - 20):idx + len(wd) + 20].replace("\n", " ")
                    issues.append("词[%s]…%s…" % (wd, ctx))
            m = re.search(r"chapter_id:\s*(B\d-C\d{2})", s)
            if not m or m.group(1) != fn[:-3]:
                issues.append("chapter_id缺失或不符")
            nt = terms_count(s)
            if nt > 8:
                issues.append("新术语%d个>8" % nt)
            bang = s.count("！")
            if bang:
                issues.append("感叹号x%d" % bang)
            refs = sorted(set("B%s-C%s" % (a, b) for a, b in REF.findall(s)))
            exs = sorted(set(re.findall(r"EX-([A-Z])", s)))
            dv = s.count("【待核验】")
            dl = os.path.join(d, fn[:-3] + "_delivery.md")
            print("[%s] %s chars=%d terms=%d 待核验=%d EX=%s REF=%s delivery=%s" % (
                v, fn, n, nt, dv, "".join(exs) or "-",
                ",".join(refs) or "-", "Y" if os.path.isfile(dl) else "MISSING!"))
            for it in issues:
                print("    !! " + it)
                total_bad += 1
    print("TOTAL_ISSUES:", total_bad)

main()
