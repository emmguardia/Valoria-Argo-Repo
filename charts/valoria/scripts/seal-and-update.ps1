# Script: chiffre valoria-secrets et met a jour values.yaml
# Prerequis: kubeseal installe, kubectl connecte au cluster cible
# Usage: depuis charts/valoria -> .\scripts\seal-and-update.ps1

$ErrorActionPreference = "Stop"
$chartDir = Split-Path -Parent $PSScriptRoot
$secretPath = Join-Path $chartDir "secrets\valoria-secrets.yaml"
$valuesPath = Join-Path $chartDir "values.yaml"
$tempPath = [System.IO.Path]::GetTempFileName() + ".yaml"
$certProdPath = Join-Path $chartDir "secrets\sealed-secrets-cert-prod.pem"
$certDefaultPath = Join-Path $chartDir "secrets\sealed-secrets-cert.pem"

try {
    if (-not (Test-Path $secretPath)) {
        Write-Error "Fichier introuvable: $secretPath"
    }

    Write-Host "1. Preparation du secret pour namespace valoria..."
    $content = Get-Content $secretPath -Raw
    $content = $content -replace "namespace:\s*.*", "namespace: valoria"
    Set-Content $tempPath -Value $content -Encoding UTF8

    Write-Host "2. Chiffrement avec kubeseal..."
    $kubesealArgs = @("--format", "yaml", "--namespace", "valoria", "--name", "valoria-secrets", "--scope", "namespace-wide")
    if (Test-Path $certProdPath) {
        Write-Host "   -> Utilisation du certificat PROD: $certProdPath"
        $kubesealArgs += @("--cert", $certProdPath)
    }
    elseif (Test-Path $certDefaultPath) {
        Write-Host "   -> Utilisation du certificat local: $certDefaultPath"
        $kubesealArgs += @("--cert", $certDefaultPath)
    }
    else {
        Write-Host "   -> Aucun certificat local trouvé, kubeseal utilisera le cluster courant (kubectl context)."
    }

    $sealed = Get-Content $tempPath -Raw | kubeseal @kubesealArgs
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

    # Mise a jour safe: remplacer uniquement les lignes apres `encryptedData:` dans `sealedSecret`,
    # sans toucher au reste de la config Helm.
    $sealedSecretIndex = $valuesContent.IndexOf('sealedSecret:', [System.StringComparison]::Ordinal)
    if ($sealedSecretIndex -lt 0) {
        throw "sealedSecret: introuvable dans values.yaml"
    }

    $encryptedDataKeyIndex = $valuesContent.IndexOf('encryptedData:', $sealedSecretIndex, [System.StringComparison]::Ordinal)
    if ($encryptedDataKeyIndex -lt 0) {
        throw "encryptedData: introuvable dans values.yaml"
    }

    $lineEnd = $valuesContent.IndexOf("`n", $encryptedDataKeyIndex, [System.StringComparison]::Ordinal)
    if ($lineEnd -lt 0) {
        throw "Fin de ligne introuvable apres encryptedData:"
    }

    $blockStart = $lineEnd + 1

    $candidates = @('imagePullSecrets:', 'frontend:', 'backend:', 'nginx:', 'ingress:')
    $nextKeyIndex = [int]::MaxValue
    foreach ($cand in $candidates) {
        $idx = $valuesContent.IndexOf($cand, $blockStart, [System.StringComparison]::Ordinal)
        if ($idx -ge 0 -and $idx -lt $nextKeyIndex) {
            $nextKeyIndex = $idx
        }
    }
    if ($nextKeyIndex -eq [int]::MaxValue) {
        $nextKeyIndex = $valuesContent.Length
    }

    $prefix = $valuesContent.Substring(0, $blockStart)
    $suffix = $valuesContent.Substring($nextKeyIndex)
    $updated = $prefix + $indentedBlock + "`n" + $suffix

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
