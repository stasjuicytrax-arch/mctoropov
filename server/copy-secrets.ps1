# Копирует токен бота и ключ релея из stevent-leads в toropov-leads и выкладывает текущий код из leads/.
# Значения нигде не показываются. Этот же скрипт — способ обновить код функции.
# Запуск: powershell -ExecutionPolicy Bypass -File .\copy-secrets.ps1

$target = 'toropov-leads'
$entry  = 'index.handler'
$here   = Split-Path -Parent $MyInvocation.MyCommand.Path
$src    = Join-Path $here 'leads'
$yc     = Join-Path $env:USERPROFILE 'yandex-cloud\bin\yc.exe'

Write-Host '1/2 Беру секреты из stevent-leads...' -ForegroundColor Cyan
$json = & $yc serverless function version get-by-tag --function-name stevent-leads --tag '$latest' --format json 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host 'Не получилось прочитать stevent-leads.' -ForegroundColor Red; exit 1 }
$e = ($json | Out-String | ConvertFrom-Json).environment
if (-not $e.TELEGRAM_BOT_TOKEN) { Write-Host 'В stevent-leads нет токена.' -ForegroundColor Red; exit 1 }

Write-Host "2/2 Кладу их в $target и выкладываю код..." -ForegroundColor Cyan
$envs = "TELEGRAM_CHAT_ID=@helpppevent,TELEGRAM_API_BASE=https://stevent-relay.ngperm.workers.dev,TELEGRAM_BOT_TOKEN=$($e.TELEGRAM_BOT_TOKEN),TELEGRAM_RELAY_KEY=$($e.TELEGRAM_RELAY_KEY)"
& $yc serverless function version create --function-name $target --runtime nodejs22 --entrypoint $entry --memory 128m --execution-timeout 20s --source-path $src --environment $envs 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "Не получилось обновить $target." -ForegroundColor Red; exit 1 }

$e = $null; $json = $null; $envs = $null
Write-Host 'Готово!' -ForegroundColor Green
