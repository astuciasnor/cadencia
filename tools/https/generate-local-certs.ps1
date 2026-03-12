param(
  [Parameter(Mandatory = $true)]
  [string]$IpAddress,

  [string]$OutputDir = ".local/https",

  [string]$ServerName = $env:COMPUTERNAME,

  [int]$RootDays = 3650,

  [int]$ServerDays = 825,

  [switch]$Force
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

$openssl = (Get-Command openssl -ErrorAction Stop).Source
$outputPath = Resolve-RepoPath -Path $OutputDir
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null

$rootCertPath = Join-Path $outputPath "cadencia-local-ca.crt"
$rootCerPath = Join-Path $outputPath "cadencia-local-ca.cer"
$rootKeyPath = Join-Path $outputPath "cadencia-local-ca.key.pem"
$serverCertPath = Join-Path $outputPath "cadencia-local-server.crt"
$serverKeyPath = Join-Path $outputPath "cadencia-local-server.key.pem"
$serverCsrPath = Join-Path $outputPath "cadencia-local-server.csr.pem"
$serverExtPath = Join-Path $outputPath "cadencia-local-server.ext"
$serialPath = Join-Path $outputPath "cadencia-local-ca.srl"

$serverName = $ServerName.Trim()
if ([string]::IsNullOrWhiteSpace($serverName)) {
  $serverName = "cadencia-local"
}

if ($Force -or -not ((Test-Path $rootCertPath) -and (Test-Path $rootKeyPath))) {
  Remove-Item $rootCertPath, $rootCerPath, $rootKeyPath, $serialPath -Force -ErrorAction SilentlyContinue
  & $openssl req `
    -x509 `
    -newkey rsa:2048 `
    -sha256 `
    -nodes `
    -days $RootDays `
    -keyout $rootKeyPath `
    -out $rootCertPath `
    -subj "/CN=Cadencia Local CA" `
    -addext "basicConstraints=critical,CA:TRUE" `
    -addext "keyUsage=critical,keyCertSign,cRLSign" `
    -addext "subjectKeyIdentifier=hash"
}

& $openssl x509 `
  -in $rootCertPath `
  -outform der `
  -out $rootCerPath

Remove-Item $serverCertPath, $serverKeyPath, $serverCsrPath, $serverExtPath -Force -ErrorAction SilentlyContinue

@"
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=@alt_names

[alt_names]
DNS.1=localhost
DNS.2=$serverName
IP.1=127.0.0.1
IP.2=$IpAddress
"@ | Set-Content -Encoding ascii $serverExtPath

& $openssl req `
  -new `
  -newkey rsa:2048 `
  -sha256 `
  -nodes `
  -keyout $serverKeyPath `
  -out $serverCsrPath `
  -subj "/CN=$IpAddress"

if (Test-Path $serialPath) {
  & $openssl x509 `
    -req `
    -in $serverCsrPath `
    -CA $rootCertPath `
    -CAkey $rootKeyPath `
    -CAserial $serialPath `
    -out $serverCertPath `
    -days $ServerDays `
    -sha256 `
    -extfile $serverExtPath
} else {
  & $openssl x509 `
    -req `
    -in $serverCsrPath `
    -CA $rootCertPath `
    -CAkey $rootKeyPath `
    -CAcreateserial `
    -out $serverCertPath `
    -days $ServerDays `
    -sha256 `
    -extfile $serverExtPath
}

Write-Host ""
Write-Host "Certificados gerados em:"
Write-Host "  CA root : $rootCerPath"
Write-Host "  Servidor: $serverCertPath"
Write-Host "  Chave   : $serverKeyPath"
Write-Host ""
Write-Host "Proximo passo:"
Write-Host "  powershell -ExecutionPolicy Bypass -File .\\tools\\https\\serve-local-https.ps1 -Port 8443"
