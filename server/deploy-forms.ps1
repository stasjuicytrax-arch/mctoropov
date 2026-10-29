# Подключение форм stastoropov.ru к Telegram — всё одной командой:
#   1) функция toropov-leads в Яндекс.Облаке (создать, открыть доступ, секреты из stevent-leads, код)
#   2) адрес функции — в ENDPOINT формы (src/scripts/sections/18-form.js)
#   3) проверка, что функция отвечает
#   4) коммит и пуш в main — Vercel сам пересоберёт сайт
# Запуск: powershell -ExecutionPolicy Bypass -File C:\Users\G13\Desktop\CLAUDE\mctoropov\server\deploy-forms.ps1

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here

Write-Host '=== 1/4 Функция в Яндекс.Облаке ===' -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File (Join-Path $here 'create-function.ps1')
if ($LASTEXITCODE -ne 0) { Write-Host 'Стоп: функция не готова.' -ForegroundColor Red; exit 1 }
$url = (Get-Content (Join-Path $here 'function-url.txt') -Raw).Trim()
if (-not $url.StartsWith('https://functions.yandexcloud.net/')) { Write-Host "Стоп: странный адрес функции: $url" -ForegroundColor Red; exit 1 }

Write-Host '=== 2/4 Адрес функции -> форма ===' -ForegroundColor Cyan
$js = Join-Path $root 'src\scripts\sections\18-form.js'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$text = [IO.File]::ReadAllText($js, $utf8)
$text = $text -replace "https://functions\.yandexcloud\.net/[A-Za-z0-9_]+", $url
[IO.File]::WriteAllText($js, $text, $utf8)
Write-Host "ENDPOINT = $url"

Write-Host '=== 3/4 Проверка функции ===' -ForegroundColor Cyan
try {
  Invoke-RestMethod -Method Post -Uri $url -Headers @{ Origin = 'https://stastoropov.ru' } -ContentType 'application/json' -Body '{}' | Out-Null
  Write-Host 'Функция ответила неожиданно «ок» на пустую заявку.' -ForegroundColor Yellow
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  if ($code -eq 400) { Write-Host 'Функция живая (на пустую заявку ответила 400 — так и надо).' -ForegroundColor Green }
  else { Write-Host "Функция ответила $code — смотри раздел «Если не работает» в инструкции." -ForegroundColor Red; exit 1 }
}

Write-Host '=== 4/4 Коммит и пуш ===' -ForegroundColor Cyan
Set-Location $root
$ErrorActionPreference = 'Continue'
git add server/leads server/copy-secrets.ps1 server/create-function.ps1 server/deploy-forms.ps1 src/scripts/sections/18-form.js src/styles/sections/18-form.css vite.config.js .vercelignore README.md
git commit -m "Формы заявок -> Telegram через функцию toropov-leads (Яндекс.Облако)" -m "Обе формы (секция #form и окно из hero) шлют заявку в toropov-leads -> stevent-relay -> @helpppevent с меткой #toropov: форма, страница, кнопка, телефон, UTM." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`nClaude-Session: https://claude.ai/code/session_01BEQTXTowmLE5HPjUTgwZ6K"
git push origin main
if ($LASTEXITCODE -ne 0) { Write-Host 'Пуш не прошёл — сайт не обновится. Пришли Claude текст ошибки выше.' -ForegroundColor Red; exit 1 }

Write-Host ''
Write-Host 'Готово! Vercel пересоберёт сайт за 1–2 минуты.' -ForegroundColor Green
