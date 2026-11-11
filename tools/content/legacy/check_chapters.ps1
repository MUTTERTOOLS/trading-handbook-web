$ErrorActionPreference = 'Stop'
$ROOT = 'D:\Desktop\workspace\trading-series'
$EXPECTED = @{ 'B1' = 7; 'B2' = 8; 'B3' = 12; 'B4' = 10; 'B5' = 8; 'B6' = 12; 'B7' = 9; 'B8' = 11 }
$REQUIRED = @('## 开场问题', '## 一句话结论', '## 本章学习目标', '## 正文',
    '## 常见误区', '## 本章小结', '## 自测题', '## 延伸与链接', '风险提示')
$FORBIDDEN = @('稳赚', '必涨', '圣杯', '保本', '无风险', '跟我买', '六元', '门派一', '门派二',
    '门派三', '门派四', '悟道', '出神入化', '一眼看穿')
$enc = New-Object Text.UTF8Encoding($false)
$totalBad = 0
$vols = @(); if ($args.Count -gt 0) { $vols = $args } else { $vols = @('B1','B2','B3','B4','B5','B6','B7','B8') }
foreach ($v in $vols) {
    $d = Join-Path $ROOT $v
    if (!(Test-Path $d)) { Write-Output ("[$v] no dir"); $totalBad++; continue }
    $chap = @(Get-ChildItem $d -Filter '*.md' | Where-Object { $_.Name -match ('^' + $v + '-C\d{2}\.md$') } | Sort-Object Name)
    $missing = @()
    for ($i = 1; $i -le $EXPECTED[$v]; $i++) {
        $fn = ('{0}-C{1:D2}.md' -f $v, $i)
        if (!(Test-Path (Join-Path $d $fn))) { $missing += $fn }
    }
    if ($missing.Count -gt 0) { Write-Output ("[$v] missing: " + ($missing -join ', ')); $totalBad++ }
    foreach ($f in $chap) {
        $s = [IO.File]::ReadAllText($f.FullName, $enc)
        $issues = @()
        foreach ($r in $REQUIRED) { if (!$s.Contains($r)) { $issues += ('缺小节:' + $r) } }
        $plain = $s -replace '\s', ''
        $n = $plain.Length
        if ($n -lt 2400) { $issues += ('字数少:' + $n) }
        if ($n -gt 8000) { $issues += ('字数多:' + $n) }
        foreach ($wd in $FORBIDDEN) {
            $idx = $s.IndexOf($wd)
            if ($idx -ge 0) {
                $a = [Math]::Max(0, $idx - 20); $len = [Math]::Min(45, $s.Length - $a)
                $issues += ('词[' + $wd + ']' + $s.Substring($a, $len).Replace("`n", ' '))
            }
        }
        if ($s -notmatch ('chapter_id:\s*' + $v + '-C\d{2}')) { $issues += 'chapter_id缺失' }
        $nt = -1
        if ($s -match 'new_terms:\s*\[(.*?)\]') {
            $nt = @($Matches[1] -split '[,，]' | Where-Object { $_.Trim() }).Count
            if ($nt -gt 8) { $issues += ('新术语' + $nt + '>8') }
        }
        $bang = ([regex]::Matches($s, '！')).Count
        if ($bang -gt 0) { $issues += ('感叹号x' + $bang) }
        $refs = @([regex]::Matches($s, '〔B(\d)-C(\d{2})〕') | ForEach-Object { 'B' + $_.Groups[1].Value + '-C' + $_.Groups[2].Value } | Sort-Object -Unique)
        $exs = @([regex]::Matches($s, 'EX-([A-Z])') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
        $dv = ([regex]::Matches($s, '【待核验】')).Count
        $dl = Test-Path (Join-Path $d ($f.BaseName + '_delivery.md'))
        Write-Output ("[$v] " + $f.Name + " chars=$n terms=$nt 待核验=$dv EX=" + ($exs -join '') + " REF=" + ($refs -join ',') + " delivery=" + $(if ($dl) { 'Y' } else { 'MISSING!' }))
        foreach ($it in $issues) { Write-Output ('    !! ' + $it); $totalBad++ }
    }
}
Write-Output ("TOTAL_ISSUES: " + $totalBad)
