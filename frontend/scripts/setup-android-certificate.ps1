param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({
        try {
            ([System.Net.IPAddress]::Parse($_)).AddressFamily -eq
                [System.Net.Sockets.AddressFamily]::InterNetwork
        } catch {
            $false
        }
    })]
    [string]$LanIp
)

$ErrorActionPreference = "Stop"
$certificateDirectory = Join-Path $PSScriptRoot "..\.local-certs"
$certificateDirectory = [System.IO.Path]::GetFullPath($certificateDirectory)
$caSubject = "CN=POINTA Android Development CA"
$serverSubject = "CN=POINTA Android $LanIp"
$caPath = Join-Path $certificateDirectory "pointa-android-ca.cer"
$pfxPath = Join-Path $certificateDirectory "pointa-dev.pfx"
$passwordPath = Join-Path $certificateDirectory "pointa-dev-password.txt"

New-Item -ItemType Directory -Path $certificateDirectory -Force | Out-Null

$certificateAuthority = Get-ChildItem Cert:\CurrentUser\My |
    Where-Object {
        $_.Subject -eq $caSubject -and
        $_.HasPrivateKey -and
        $_.NotAfter -gt (Get-Date)
    } |
    Sort-Object NotAfter -Descending |
    Select-Object -First 1

if (-not $certificateAuthority) {
    $certificateAuthority = New-SelfSignedCertificate `
        -Type Custom `
        -Subject $caSubject `
        -KeyAlgorithm RSA `
        -KeyLength 2048 `
        -HashAlgorithm SHA256 `
        -KeyUsage CertSign, CRLSign, DigitalSignature `
        -TextExtension @("2.5.29.19={critical}{text}ca=TRUE&pathlength=1") `
        -CertStoreLocation Cert:\CurrentUser\My `
        -NotAfter (Get-Date).AddYears(5)
}

$serverCertificate = New-SelfSignedCertificate `
    -Type Custom `
    -Subject $serverSubject `
    -Signer $certificateAuthority `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -HashAlgorithm SHA256 `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -TextExtension @(
        "2.5.29.17={text}IPAddress=$LanIp&DNS=localhost",
        "2.5.29.37={text}1.3.6.1.5.5.7.3.1"
    ) `
    -CertStoreLocation Cert:\CurrentUser\My `
    -NotAfter (Get-Date).AddYears(1)

$passwordBytes = New-Object byte[] 32
$randomGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try {
    $randomGenerator.GetBytes($passwordBytes)
} finally {
    $randomGenerator.Dispose()
}

$password = [Convert]::ToBase64String($passwordBytes)
$securePassword = ConvertTo-SecureString -String $password -AsPlainText -Force

Export-Certificate -Cert $certificateAuthority -FilePath $caPath -Type CERT -Force | Out-Null
Export-PfxCertificate -Cert $serverCertificate -FilePath $pfxPath -Password $securePassword -Force | Out-Null
[System.IO.File]::WriteAllText($passwordPath, $password)

Write-Output "Certificat HTTPS créé pour https://$LanIp`:3100"
Write-Output "Certificat d'autorité à installer sur Android : $caPath"
Write-Output "Fichiers privés conservés localement dans : $certificateDirectory"
