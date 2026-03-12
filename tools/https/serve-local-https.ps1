param(
  [int]$Port = 8443,

  [string]$BindHost = "0.0.0.0",

  [string]$SiteDir = ".",

  [string]$CertPath = ".local/https/cadencia-local-server.crt",

  [string]$KeyPath = ".local/https/cadencia-local-server.key.pem"
)

$ErrorActionPreference = "Stop"

function Resolve-RepoPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if ([System.IO.Path]::IsPathRooted($Path)) {
    return $Path
  }

  $repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\\..")
  return [System.IO.Path]::GetFullPath((Join-Path $repoRoot $Path))
}

$python = (Get-Command python -ErrorAction Stop).Source
$certFile = Resolve-RepoPath -Path $CertPath
$keyFile = Resolve-RepoPath -Path $KeyPath
$sitePath = Resolve-RepoPath -Path $SiteDir
$serverScript = Join-Path $PSScriptRoot "serve_https.py"

if (-not (Test-Path $certFile) -or -not (Test-Path $keyFile)) {
  throw "Certificados nao encontrados. Rode antes .\\tools\\https\\generate-local-certs.ps1."
}

Write-Host "Servidor HTTPS do Cadencia"
Write-Host "  Pasta: $sitePath"
Write-Host "  URL  : https://localhost:$Port"
Write-Host "  Rede : https://SEU-IP:$Port"
Write-Host ""

& $python $serverScript `
  --host $BindHost `
  --port $Port `
  --dir $sitePath `
  --cert $certFile `
  --key $keyFile
