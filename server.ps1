# Servidor Web HTTPS Local para a plataforma Vendendo Solucoes
$port = 3000
$ip = [System.Net.IPAddress]::Loopback
$certPath = Join-Path $PSScriptRoot "localhost.pfx"
$certPassword = "devcert"

try {
    $listener = [System.Net.Sockets.TcpListener]::new($ip, $port)
    $listener.Start()
} catch {
    $port = 3001
    $listener = [System.Net.Sockets.TcpListener]::new($ip, $port)
    $listener.Start()
}

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

# Carregar certificado SSL
$cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($certPath, $certPassword)

# Arquivos sensíveis que devem ser bloqueados
$blockedFiles = @(
    "firebase.json",
    ".firebaserc",
    "firestore.rules",
    "server.ps1",
    "test_tcp.ps1",
    "AGENTS.md",
    ".git",
    ".gitignore",
    "localhost.pfx"
)

# Extensões bloqueadas
$blockedExtensions = @(".ps1", ".md", ".json", ".rules", ".rc", ".pfx")

Write-Host "Servidor HTTPS Ativo em: https://localhost:$port/" -ForegroundColor Green
Write-Host "Certificado: $certPath" -ForegroundColor Cyan

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf"  = "font/ttf"
}

function Is-PathSafe($requestedPath, $rootPath) {
    try {
        $fullRequested = [System.IO.Path]::GetFullPath($requestedPath)
        $fullRoot = [System.IO.Path]::GetFullPath($rootPath)
        return $fullRequested.StartsWith($fullRoot, [System.StringComparison]::OrdinalIgnoreCase)
    } catch {
        return $false
    }
}

function Is-BlockedFile($fileName) {
    $lower = $fileName.ToLower()
    foreach ($blocked in $blockedFiles) {
        if ($lower -eq $blocked.ToLower()) { return $true }
    }
    foreach ($ext in $blockedExtensions) {
        if ($lower.EndsWith($ext)) { return $true }
    }
    return $false
}

function Send-Response($sslStream, $statusCode, $statusText, $contentType, $bodyBytes, $headers = @{}) {
    $headerLines = @("HTTP/1.1 $statusCode $statusText")
    $headerLines += "Content-Type: $contentType"
    $headerLines += "Content-Length: " + $bodyBytes.Length
    $headerLines += "X-Content-Type-Options: nosniff"
    $headerLines += "X-Frame-Options: SAMEORIGIN"
    $headerLines += "X-XSS-Protection: 1; mode=block"
    $headerLines += "Referrer-Policy: strict-origin-when-cross-origin"
    $headerLines += "Connection: close"
    foreach ($h in $headers.GetEnumerator()) {
        $headerLines += "$($h.Key): $($h.Value)"
    }
    $headerLines += "`r`n"
    $headerStr = $headerLines -join "`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerStr)
    $sslStream.Write($headerBytes, 0, $headerBytes.Length)
    $sslStream.Write($bodyBytes, 0, $bodyBytes.Length)
    $sslStream.Flush()
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        
        # Upgrade para SSL/TLS
        $sslStream = [System.Net.Security.SslStream]::new($stream, $false)
        $sslStream.AuthenticateAsServer($cert, $false, [System.Security.Authentication.SslProtocols]::Tls12, $false)
        
        $reader = [System.IO.StreamReader]::new($sslStream, [System.Text.Encoding]::ASCII)
        $line = $reader.ReadLine()

        if ($line) {
            $parts = $line.Split(' ')
            if ($parts.Length -ge 2 -and $parts[0] -eq "GET") {
                $rawPath = $parts[1].Split('?')[0].TrimStart('/')
                if ([string]::IsNullOrWhiteSpace($rawPath)) {
                    $rawPath = "index.html"
                }
                
                # Bloquear directory traversal
                if ($rawPath.Contains("..") -or $rawPath.Contains("~")) {
                    $body = "403 - Forbidden: Directory traversal blocked"
                    $bytes = [System.Text.Encoding]::ASCII.GetBytes($body)
                    Send-Response $sslStream 403 "Forbidden" "text/plain" $bytes
                    $client.Close()
                    continue
                }

                $decodedPath = [System.Uri]::UnescapeDataString($rawPath)
                $fileName = [System.IO.Path]::GetFileName($decodedPath)
                
                # Bloquear arquivos sensíveis
                if (Is-BlockedFile $fileName) {
                    $body = "403 - Forbidden: Access denied"
                    $bytes = [System.Text.Encoding]::ASCII.GetBytes($body)
                    Send-Response $sslStream 403 "Forbidden" "text/plain" $bytes
                    $client.Close()
                    continue
                }

                $filePath = Join-Path $root $decodedPath

                # Verificar se o caminho é seguro (não sai do root)
                if (-not (Is-PathSafe $filePath $root)) {
                    $body = "403 - Forbidden: Path traversal blocked"
                    $bytes = [System.Text.Encoding]::ASCII.GetBytes($body)
                    Send-Response $sslStream 403 "Forbidden" "text/plain" $bytes
                    $client.Close()
                    continue
                }

                if (Test-Path $filePath -PathType Leaf) {
                    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                    $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                    $bytes = [System.IO.File]::ReadAllBytes($filePath)
                    Send-Response $sslStream 200 "OK" $contentType $bytes @{"Access-Control-Allow-Origin" = "*"}
                } else {
                    $notFoundBody = "404 - Not Found"
                    $notFoundBytes = [System.Text.Encoding]::ASCII.GetBytes($notFoundBody)
                    Send-Response $sslStream 404 "Not Found" "text/plain" $notFoundBytes
                }
            }
        }

        $sslStream.Close()
        $client.Close()
    }
} finally {
    $listener.Stop()
}