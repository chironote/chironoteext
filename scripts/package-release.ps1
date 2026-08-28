$ErrorActionPreference = 'Stop'
$repositoryPath = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $repositoryPath
try {
  node scripts/verify-package.js
  if ($LASTEXITCODE -ne 0) { throw 'Package verification failed. Run npm run build first.' }
  $package = Get-Content -Raw -LiteralPath package.json | ConvertFrom-Json
  $artifactPath = Join-Path $repositoryPath 'release-artifacts'
  New-Item -ItemType Directory -Path $artifactPath -Force | Out-Null
  $archivePath = Join-Path $artifactPath ('chironote-extension-' + $package.version + '-candidate.zip')
  Compress-Archive -Path (Join-Path $repositoryPath 'build\*') -DestinationPath $archivePath -Force
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
  try {
    $entry = $archive.GetEntry('manifest.json')
    if (-not $entry) { throw 'Archive must contain manifest.json at its root.' }
    $reader = New-Object System.IO.StreamReader($entry.Open())
    try { $manifest = $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
    if ($manifest.version -ne $package.version) { throw 'Archive version mismatch.' }
  } finally { $archive.Dispose() }
  $hashAlgorithm = [System.Security.Cryptography.SHA256]::Create()
  $archiveStream = [System.IO.File]::OpenRead($archivePath)
  try {
    $hash = [System.BitConverter]::ToString($hashAlgorithm.ComputeHash($archiveStream)).Replace('-', '').ToLower()
  } finally {
    $archiveStream.Dispose()
    $hashAlgorithm.Dispose()
  }
  Set-Content -LiteralPath ($archivePath + '.sha256') -Value ($hash + '  ' + (Split-Path -Leaf $archivePath))
  Write-Output ('Candidate archive verified: ' + $archivePath)
  Write-Output ('SHA256: ' + $hash)
} finally { Pop-Location }
