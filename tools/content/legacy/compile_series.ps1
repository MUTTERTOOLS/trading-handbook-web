$ErrorActionPreference = 'Stop'
$ROOT = 'D:\Desktop\workspace\trading-series'
$enc = New-Object Text.UTF8Encoding($false)
$numCN = @{ 'B1' = '一'; 'B2' = '二'; 'B3' = '三'; 'B4' = '四'; 'B5' = '五'; 'B6' = '六'; 'B7' = '七'; 'B8' = '八' }
$vols = [ordered]@{
  'B1' = '交易入门地图'; 'B2' = '市场规则与下单实务'; 'B3' = '风控与资金管理';
  'B4' = '读盘入门：价量与技术结构'; 'B5' = '基本面与估值入门'; 'B6' = '策略验证与统计常识';
  'B7' = '执行纪律与交易复盘'; 'B8' = '实战门派图鉴与选择'
}
$risk = '本书内容仅为教育与方法讨论，不构成任何投资建议或证券推荐。市场有风险，投资可能导致本金亏损。书中示例均为虚构或说明性案例，书中数字为"起步参考值"，需结合个人情况校准。交易规则与费率以交易所及券商最新规定为准。'

$idx = New-Object System.Text.StringBuilder
[void]$idx.AppendLine('# 《新手交易系统化入门丛书》总索引')
[void]$idx.AppendLine('')
[void]$idx.AppendLine('> 全丛书 8 册 77 章｜编写总方案：[00_Bible_v1.1.md](00_Bible_v1.1.md)（含 v1.1 裁决与 v1.2 补编）｜待核验清单：[_meta/06_Verify.md](_meta/06_Verify.md)｜[验收报告](验收报告.md)')
[void]$idx.AppendLine('> 以下链接指向 compiled 目录下的汇编成品；分章原稿位于 B1~B8 目录（B3-C01.md 等，配套交付说明 *_delivery.md 一并保留）。')
[void]$idx.AppendLine('')

$totalChars = 0
foreach ($v in $vols.Keys) {
    $name = $vols[$v]
    $d = Join-Path $ROOT $v
    $chaps = @(Get-ChildItem $d -Filter ($v + '-C??.md') | Sort-Object Name)
    $doc = New-Object System.Text.StringBuilder
    [void]$doc.AppendLine('# 册' + $numCN[$v] + '《' + $name + '》')
    [void]$doc.AppendLine('')
    [void]$doc.AppendLine('> **册首风险提示：** ' + $risk)
    [void]$doc.AppendLine('>')
    [void]$doc.AppendLine('> 截稿日期：2026-11-07；规则、费率、税、时间类内容以交易所与券商最新规定为准。各章待核验事项见 [_meta/06_Verify.md](_meta/06_Verify.md)。')
    [void]$doc.AppendLine('')
    [void]$doc.AppendLine('## 目录')
    [void]$doc.AppendLine('')
    [void]$doc.AppendLine('| 章 | 标题 |')
    [void]$doc.AppendLine('|---|---|')
    $terms = New-Object System.Text.StringBuilder
    $body = New-Object System.Text.StringBuilder
    foreach ($f in $chaps) {
        $t = [IO.File]::ReadAllText($f.FullName, $enc)
        $title = ''
        if ($t -match 'title:\s*(.+)') { $title = $Matches[1].Trim() }
        [void]$doc.AppendLine('| ' + $f.BaseName + ' | ' + $title + ' |')
        [void]$body.AppendLine('')
        [void]$body.AppendLine('---')
        [void]$body.AppendLine('')
        [void]$body.Append($t.TrimEnd())
        if ($t -match 'new_terms:\s*\[(.*?)\]') {
            $ts = @($Matches[1] -split '[,，]' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
            if ($ts.Count -gt 0) { [void]$terms.AppendLine('| ' + $f.BaseName + ' | ' + ($ts -join '、') + ' |') }
        }
    }
    [void]$doc.AppendLine('')
    [void]$doc.Append($body.ToString())
    [void]$doc.AppendLine('')
    [void]$doc.AppendLine('')
    [void]$doc.AppendLine('---')
    [void]$doc.AppendLine('')
    [void]$doc.AppendLine('## 附录：本册新术语索引（按章，自动生成自各章 yaml）')
    [void]$doc.AppendLine('')
    [void]$doc.AppendLine('| 章 | 新术语 |')
    [void]$doc.AppendLine('|---|---|')
    [void]$doc.Append($terms.ToString())
    $out = Join-Path $ROOT ('compiled\' + $v + '_' + $name + '.md')
    [IO.File]::WriteAllText($out, $doc.ToString(), $enc)
    $c = ($doc.ToString() -replace '\s', '').Length
    $totalChars += $c
    Write-Output ($v + ' -> compiled\' + $v + '_' + $name + '.md  chars=' + $c + '  chapters=' + $chaps.Count)

    [void]$idx.AppendLine('## 册' + $numCN[$v] + '《' + $name + '》—— ' + $chaps.Count + ' 章')
    [void]$idx.AppendLine('')
    [void]$idx.AppendLine('**成品：[compiled/' + $v + '_' + $name + '.md](compiled/' + $v + '_' + $name + '.md)**')
    [void]$idx.AppendLine('')
    [void]$idx.AppendLine('| 章 | 标题 |')
    [void]$idx.AppendLine('|---|---|')
    foreach ($f in $chaps) {
        $t = [IO.File]::ReadAllText($f.FullName, $enc)
        $title = ''
        if ($t -match 'title:\s*(.+)') { $title = $Matches[1].Trim() }
        [void]$idx.AppendLine('| ' + $f.BaseName + ' | ' + $title + ' |')
    }
    [void]$idx.AppendLine('')
}
[void]$idx.AppendLine('---')
[void]$idx.AppendLine('')
[void]$idx.AppendLine('**全书合计（汇编成品，非空白字符）：约 ' + [Math]::Round($totalChars / 10000, 1) + ' 万字。**')
[IO.File]::WriteAllText((Join-Path $ROOT '00_总索引.md'), $idx.ToString(), $enc)
Write-Output 'INDEX written: 00_总索引.md'

$bibleAdd = @'

---

# 总编补编 v1.2（验收定稿追加，效力同顶部裁决块）

> 9.【术语收编】"破产结构"收编入 1.5"其他统一词"：指"单次或累积亏损无上限＋无预设退出"的账户死亡模式，四种典型为重仓单票、杠杆、扛单、亏损加仓（马丁式），归属 B3-C02。"爆仓"为俗称，正式行文用"强制平仓/杠杆归零"。
> 10.【字数口径】章节正文字数口径统一为：含标点正文，不含 yaml 头、表格、绘图说明与行情数据表。个别章节经总编批准的超出记入验收报告，不再追改。
> 11.【证据强度桥接】方法作为"公开描述"未经验证为 D；机械化为客观规则且含成本假设为 B（机械规则、无样本外）；两者可并存，行文中说明即可。
> 12.【定投熔断】纯定投不设单笔 1R/熔断体系，其不可降红线为零杠杆与资金期限，以退出⑦现金需求与月度投入上限承接（B8-C03 口径，全书有效）。
> 13.【yaml 围栏】章节 yaml 头保留 ```yaml 围栏（与 1.7 模板一致），成品电子版按原样呈现。
'@
[IO.File]::AppendAllText((Join-Path $ROOT '00_Bible_v1.1.md'), $bibleAdd, $enc)
Write-Output 'BIBLE v1.2 addendum appended'

$glossAdd = @'

---

## 总编补编 v1.2 收编术语（验收定稿追加）

- **破产结构**：单次或累积亏损无上限＋无预设退出的账户死亡模式，四种典型为重仓单票、杠杆、扛单、亏损加仓（马丁式）。归属〔B3-C02〕。
- **强制平仓**：杠杆账户担保不足时由券商强行了结头寸，机制见〔B2-C07〕。俗称"爆仓"，正式行文用"强制平仓/杠杆归零"。
- **尾部亏损**：被平均亏损统计掩盖的极端单笔亏损，见〔B3-C08〕"平均亏损会掩盖尾部亏损"。
'@
[IO.File]::AppendAllText((Join-Path $ROOT '_meta\01_Glossary.md'), $glossAdd, $enc)
Write-Output 'GLOSSARY addendum appended'
