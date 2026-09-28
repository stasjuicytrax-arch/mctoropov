# Скачивает все медиа со старого сайта stastoropov.ru в подпапку assets\
# Запуск (откуда угодно):
#   powershell -ExecutionPolicy Bypass -File "C:\Users\G13\Desktop\CLAUDE\mctoropov\download-assets.ps1"

$ErrorActionPreference = "Stop"
$base = $PSScriptRoot
if (-not $base) { $base = (Get-Location).Path }

$manifest = Join-Path $base "content\assets.json"
if (-not (Test-Path $manifest)) {
    Write-Error "Не найден $manifest"
    exit 1
}

$json = Get-Content -Raw -LiteralPath $manifest -Encoding UTF8 | ConvertFrom-Json
$root = Join-Path $base "assets"
foreach ($c in @("photo","logo","icon","decor","video")) {
    New-Item -ItemType Directory -Force -Path (Join-Path $root $c) | Out-Null
}

$total = $json.assets.Count
$i = 0; $ok = 0; $skip = 0; $fail = 0
$failed = @()

foreach ($a in $json.assets) {
    $i++
    $dir  = Join-Path $root $a.category
    $dest = Join-Path $dir $a.file

    if (Test-Path $dest) {
        $b    = [IO.Path]::GetFileNameWithoutExtension($a.file)
        $ext  = [IO.Path]::GetExtension($a.file)
        $dest = Join-Path $dir ("{0}_{1}{2}" -f $b, $i, $ext)
    }

    Write-Progress -Activity "Скачиваю медиа со старого сайта" -Status ("{0} / {1}  {2}" -f $i, $total, $a.file) -PercentComplete ($i * 100 / $total)

    try {
        Invoke-WebRequest -Uri $a.url -OutFile $dest -UseBasicParsing -TimeoutSec 90
        $size = [math]::Round((Get-Item $dest).Length / 1KB)
        Write-Host ("  ok   [{0}/{1}] {2}  ({3} KB)" -f $i, $total, $a.file, $size)
        $ok++
    } catch {
        Write-Host ("  FAIL [{0}/{1}] {2}" -f $i, $total, $a.url) -ForegroundColor Yellow
        $failed += $a.url
        $fail++
    }
}

Write-Progress -Activity "Скачиваю медиа со старого сайта" -Completed
Write-Host ""
Write-Host ("Готово. Скачано: {0}, ошибок: {1}" -f $ok, $fail) -ForegroundColor Green
Write-Host ("Папка: {0}" -f $root)
if ($fail -gt 0) {
    $log = Join-Path $base "assets-failed.txt"
    $failed | Set-Content -LiteralPath $log -Encoding UTF8
    Write-Host ("Не скачалось — список в {0}" -f $log)
}
