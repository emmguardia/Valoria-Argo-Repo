# Script: chiffre valoria-secrets et met a jour values.yaml
# Prerequis: kubeseal installe, kubectl connecte au cluster cible
# Usage: depuis charts/valoria -> .\scripts\seal-and-update.ps1

$ErrorActionPreference = "Stop"
$chartDir = Split-Path -Parent $PSScriptRoot
$secretPath = Join-Path $chartDir "secrets\valoria-secrets.yaml"
$valuesPath = Join-Path $chartDir "values.yaml"
$tempPath = [System.IO.Path]::GetTempFileName() + ".yaml"

try {
    if (-not (Test-Path $secretPath)) {
        Write-Error "Fichier introuvable: $secretPath"
    }

    Write-Host "1. Preparation du secret pour namespace valoria..."
    $content = Get-Content $secretPath -Raw
    $content = $content -replace "namespace:\s*.*", "namespace: valoria"
    Set-Content $tempPath -Value $content -Encoding UTF8

    Write-Host "2. Chiffrement avec kubeseal..."
    $sealed = Get-Content $tempPath -Raw | kubeseal --format yaml --namespace valoria
    if ($LASTEXITCODE -ne 0) {
        throw "kubeseal a echoue. Verifie kubectl/kubeconfig."
    }

    Write-Host "3. Extraction du bloc encryptedData..."
    $sealedStr = $sealed | Out-String
    if ($sealedStr -notmatch '(?ms)encryptedData:\s*\n(?<block>.+?)\n\s*template:') {
        throw "Impossible d'extraire encryptedData depuis la sortie kubeseal."
    }
    $encryptedYaml = $Matches["block"].TrimEnd()

    Write-Host "4. Mise a jour de values.yaml..."
    $valuesContent = Get-Content $valuesPath -Raw
    $indentedBlock = ($encryptedYaml -split "`n" | ForEach-Object { "    $($_.TrimStart())" }) -join "`n"
    $replacement = "sealedSecret:`n  enabled: true`n  encryptedData:`n$indentedBlock"

    $updated = [System.Text.RegularExpressions.Regex]::Replace(
        $valuesContent,
        '(?ms)sealedSecret:\s*\n\s*enabled:\s*(true|false)\s*\n\s*encryptedData:\s*\n(?:\s{4}.*\n)*',
        $replacement + "`n"
    )

    if ($updated -eq $valuesContent) {
        throw "Bloc sealedSecret introuvable dans values.yaml."
    }

    Set-Content $valuesPath -Value $updated -Encoding UTF8 -NoNewline
    Write-Host "OK: values.yaml mis a jour avec encryptedData."
}
finally {
    if (Test-Path $tempPath) {
        Remove-Item $tempPath -Force
    }
}
