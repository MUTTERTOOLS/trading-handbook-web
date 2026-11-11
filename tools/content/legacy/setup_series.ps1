$ErrorActionPreference = 'Stop'
$SRC  = 'C:\Users\Lenovo\.zcode\tmp\paste-attachments\2026-11-07\pasted-text-20261107-025700-319fb54f.txt'
$ROOT = 'D:\Desktop\workspace\trading-series'

function Read-Lines([string]$path, [System.Text.Encoding]$enc) {
    $t = [IO.File]::ReadAllText($path, $enc)
    @( ($t -replace "`r`n", "`n") -split "`n" )
}

$lines = Read-Lines $SRC ([Text.Encoding]::UTF8)
function Find-Line([scriptblock]$p, [int]$start = 0) {
    for ($i = $start; $i -lt $lines.Count; $i++) { if (& $p $lines[$i]) { return $i } }
    throw "anchor not found (fwd) start=$start"
}
function Find-Line-Rev([scriptblock]$p, [int]$end) {
    for ($i = $end - 1; $i -ge 0; $i--) { if (& $p $lines[$i]) { return $i } }
    throw 'anchor not found (rev)'
}

try {
    $i_title = Find-Line { param($s) $s.StartsWith('# 《新手交易系统化入门丛书》编写总方案') }
} catch {
    $script:lines = Read-Lines $SRC ([Text.Encoding]::GetEncoding(936))
    $i_title = Find-Line { param($s) $s.StartsWith('# 《新手交易系统化入门丛书》编写总方案') }
}
$i_shen  = Find-Line { param($s) $s.StartsWith('3. **审校包：**') }
$i_yaml  = Find-Line { param($s) $s -eq '```yaml' } $i_title
$i_deliv = Find-Line { param($s) $s.StartsWith('# `B3-C04_delivery') }
$i_fx    = Find-Line-Rev { param($s) $s.StartsWith('本章内容不预测价格') } $i_deliv
$i_c15   = Find-Line { param($s) $s.StartsWith('| 15 | 算术二次复算') }
$i_15 = Find-Line { param($s) $s.StartsWith('## 1.5 ') }
$i_16 = Find-Line { param($s) $s.StartsWith('## 1.6 ') }
$i_17 = Find-Line { param($s) $s.StartsWith('## 1.7 ') }
$i_p2 = Find-Line { param($s) $s.StartsWith('# 第二部分') }
$i_p3 = Find-Line { param($s) $s.StartsWith('# 第三部分') }

$HEADER = @'
> **v1.1 生产冻结版 · 总编裁决（本块优先于正文任何条款）**
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

'@

$VERIFY = @'
# 06 待核验清单（全丛书汇总）

> 截稿日期：2026-11-07。凡交易规则、费率、税、时间、板块规则、准入门槛类数值，以交易所与券商最新规定为准。
> 汇总方式：验收阶段扫描全部 *_delivery.md 的待核验清单自动汇总；发布前须逐项核验或改为定性表述。

| 编号 | 来源章节 | 事项 | 建议处理 | 状态 |
|---|---|---|---|---|
'@

function Section([int]$a, [int]$b) {
    $seg = @($lines[$a..($b - 1)])
    while ($seg.Count -gt 0 -and -not ($seg[-1].Trim())) {
        if ($seg.Count -eq 1) { $seg = @() } else { $seg = @($seg[0..($seg.Count - 2)]) }
    }
    return (($seg -join "`n").Trim() + "`n")
}

$enc = New-Object Text.UTF8Encoding($false)
function Save([string]$rel, [string]$content) {
    $p = Join-Path $ROOT $rel
    $d = Split-Path $p -Parent
    if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
    [IO.File]::WriteAllText($p, $content, $enc)
    return $p
}

$bibleLines = @($lines[$i_title..$i_shen])
$bibleLines[0] = '# 《新手交易系统化入门丛书》编写总方案（生产冻结版 v1.1）'
$bible = $HEADER + (($bibleLines -join "`n").Trim() + "`n")
$sample   = (@($lines[$i_yaml..$i_fx])    -join "`n").Trim() + "`n"
$delivery = (@($lines[$i_deliv..$i_c15])  -join "`n").Trim() + "`n"

$saved = @()
$saved += Save '00_Bible_v1.1.md' $bible
$saved += Save 'B3\B3-C04.md' $sample
$saved += Save 'B3\B3-C04_delivery.md' $delivery
$saved += Save '_meta\01_Glossary.md'   ('# 01 统一术语表（提取自总方案 1.5）' + "`n`n" + (Section $i_15 $i_16))
$saved += Save '_meta\02_Constants.md'  ('# 02 核心公式与常量表（提取自总方案 1.6）' + "`n`n" + (Section $i_16 $i_17))
$saved += Save '_meta\05_Template.md'   ('# 05 章节标准模板（提取自总方案 1.7）' + "`n`n" + (Section $i_17 $i_p2))
$saved += Save '_meta\03_Ownership.md'  ('# 03 依赖关系与概念归属表（提取自总方案第二部分）' + "`n`n" + (Section $i_p2 $i_p3))
$saved += Save '_meta\06_Verify.md' $VERIFY

foreach ($v in @('B1','B2','B3','B4','B5','B6','B7','B8','compiled')) {
    New-Item -ItemType Directory -Path (Join-Path $ROOT $v) -Force | Out-Null
}

Write-Output ("lines_total=" + $lines.Count)
foreach ($p in $saved) {
    $t = [IO.File]::ReadAllText($p, $enc)
    $ls = @($t -split "`n" | Where-Object { $_.Trim() })
    Write-Output ("-" * 60)
    Write-Output $p
    Write-Output ("  lines=" + $ls.Count + "  chars=" + ($t -replace '\s', '').Length)
    Write-Output ("  head: " + $ls[0].Substring(0, [Math]::Min(46, $ls[0].Length)))
    Write-Output ("  tail: " + $ls[-1].Substring(0, [Math]::Min(46, $ls[-1].Length)))
}
