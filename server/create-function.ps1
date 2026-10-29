# Один раз: создаёт функцию toropov-leads в Яндекс.Облаке, открывает к ней доступ,
# кладёт секреты и код (через copy-secrets.ps1) и записывает адрес функции в function-url.txt.
# Запуск: powershell -ExecutionPolicy Bypass -File .\create-function.ps1

$name = 'toropov-leads'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$yc   = Join-Path $env:USERPROFILE 'yandex-cloud\bin\yc.exe'

$exists = & $yc serverless function get $name --format json 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Создаю функцию $name..." -ForegroundColor Cyan
  & $yc serverless function create --name $name --description 'Заявки с stastoropov.ru -> Telegram' 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Host 'Не получилось создать функцию.' -ForegroundColor Red; exit 1 }
} else {
  Write-Host "Функция $name уже есть." -ForegroundColor Yellow
}

Write-Host 'Открываю доступ для сайта...' -ForegroundColor Cyan
& $yc serverless function allow-unauthenticated-invoke $name 2>$null | Out-Null

& powershell -ExecutionPolicy Bypass -File (Join-Path $here 'copy-secrets.ps1')
if ($LASTEXITCODE -ne 0) { exit 1 }

$f = (& $yc serverless function get $name --format json | Out-String | ConvertFrom-Json)
$url = $f.http_invoke_url
Set-Content -Path (Join-Path $here 'function-url.txt') -Value $url -Encoding ASCII
Write-Host "Адрес функции: $url" -ForegroundColor Green
