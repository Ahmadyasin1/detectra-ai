param(
    [Parameter(Mandatory = $true)]
    [string]$Url
)

$ErrorActionPreference = "Stop"
$Url = $Url.Trim().TrimEnd("/")
if ($Url -notmatch "^https?://") {
    Write-Error "Url must start with http:// or https://"
}

$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

function Update-HerokuUrlInFile($path) {
    if (-not (Test-Path $path)) { return }
    (Get-Content $path) | ForEach-Object {
        if ($_ -match "herokuapp\.com") {
            $_ -replace "https://[a-z0-9-]+\.herokuapp\.com", $Url
        } else { $_ }
    } | Set-Content $path
}

if (Test-Path ".env") {
    (Get-Content ".env") | ForEach-Object {
        if ($_ -match "^VITE_API_URL=") { "VITE_API_URL=$Url" } else { $_ }
    } | Set-Content ".env"
} else {
    @("VITE_API_URL=$Url", "VITE_API_SAME_ORIGIN=true") | Set-Content ".env"
}

if (Test-Path ".env.production") {
    (Get-Content ".env.production") | ForEach-Object {
        if ($_ -match "^VITE_API_URL=") { "VITE_API_URL=$Url" } else { $_ }
    } | Set-Content ".env.production"
}

Update-HerokuUrlInFile "vercel.json"
Update-HerokuUrlInFile "vite.config.ts"
Update-HerokuUrlInFile "src\lib\detectraApi.ts"
Update-HerokuUrlInFile "src\constants\seoEntities.ts"

Write-Host "Updated API URL to: $Url" -ForegroundColor Green
Write-Host "Restart: npm run dev"
