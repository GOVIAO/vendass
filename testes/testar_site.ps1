# Suite de testes de cadastro, seguranca e prontidao de deploy.
#
#   powershell -ExecutionPolicy Bypass -File .\testes\testar_site.ps1
#
# Duas camadas:
#   1. HTTP     - requisicoes reais contra o servidor rodando (so com server.ps1 ativo)
#   2. ESTATICA - leitura do codigo-fonte quando o servidor nao esta no ar
#
# Sem dependencias externas: nao usa Node nem Python.
#
# Mantido em ASCII de proposito: o Windows PowerShell 5.1 le este arquivo
# como ANSI, e acentos viram bytes invalidos que quebram o parsing.

param(
    [string]$BaseUrl = "https://localhost:3000",
    [switch]$SkipHttp
)

$ErrorActionPreference = "Continue"
$script:Root = Split-Path -Parent $PSScriptRoot

# As requisicoes HTTP usam curl.exe em vez de Invoke-WebRequest por dois motivos:
#   - o certificado local e self-signed, e o callback de validacao do 5.1 roda
#     fora de um runspace e sempre falha com "Runspace nao disponivel";
#   - assim nao precisamos instalar o certificado na confianza do sistema.
# -k aqui e seguro: vale apenas para host local. Contra um host real a suite
# deve ser rodada com -SkipHttp e validada pelo pipeline de deploy.

$script:Pass = 0
$script:Fail = 0
$script:Failures = [System.Collections.Generic.List[string]]::new()

function Write-Section($titulo) {
    Write-Host ""
    Write-Host "-- $titulo" -ForegroundColor Cyan
}

function Assert-That {
    param(
        [string]$Nome,
        [bool]$Condicao,
        [string]$Detalhe = ""
    )
    if ($Condicao) {
        Write-Host "  [ OK ] $Nome" -ForegroundColor Green
        $script:Pass++
    } else {
        Write-Host "  [FALHA] $Nome $Detalhe" -ForegroundColor Red
        $script:Fail++
        $script:Failures.Add("$Nome $Detalhe")
    }
}

function Get-Source($relPath) {
    $p = Join-Path $script:Root $relPath
    if (-not (Test-Path -LiteralPath $p)) { return $null }
    return Get-Content -LiteralPath $p -Raw
}

# Remove comentarios antes de procurar APIs chamadas de fato. Sem isso um
# comentario que MENCIONE um metodo inexistente derruba o teste, e o
# inverso tambem: um metodo real mas so comentado passaria sem checagem.
function Get-Codigo($texto) {
    if ($null -eq $texto) { return "" }
    $semBlocos = [regex]::Replace($texto, '/\*[\s\S]*?\*/', ' ')
    return [regex]::Replace($semBlocos, '(?m)//.*$', '')
}

# Devolve o codigo HTTP de uma URL, ou $null se a conexao falhou.
# --path-as-is impede que o proprio curl normalize "../" antes de enviar:
# sem isso o traversal nem chega ao servidor e o teste passaria por engano.
function Get-CodigoHttp($url, [switch]$CaminhoCru) {
    $curlArgs = @("-k", "-s", "-o", "NUL", "-w", "%{http_code}")
    if ($CaminhoCru) { $curlArgs += "--path-as-is" }
    $curlArgs += $url
    $saida = & curl.exe @curlArgs 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $saida) { return $null }
    $saida = $saida.Trim()
    if ($saida -eq "000") { return $null }
    return [int]$saida
}

# Le os cabecalhos de uma resposta.
function Get-Cabecalhos($url) {
    return (& curl.exe -k -s -D - -o NUL $url 2>$null)
}

function Test-ServidorNoAr {
    $code = Get-CodigoHttp "$BaseUrl/"
    return ($null -ne $code) -and ($code -gt 0)
}

Write-Section "Ambiente"
$httpDisponivel = (-not $SkipHttp) -and (Test-ServidorNoAr)
if ($SkipHttp) {
    Write-Host "  Testes HTTP pulados (-SkipHttp)." -ForegroundColor DarkGray
} elseif ($httpDisponivel) {
    Write-Host "  Servidor respondendo em $BaseUrl" -ForegroundColor Green
} else {
    Write-Host "  Servidor fora do ar em $BaseUrl - indo apenas com analise estatica." -ForegroundColor Yellow
    Write-Host "  Suba com: .\server.ps1" -ForegroundColor DarkGray
}

$auth = Get-Source "js\auth.js"
$app = Get-Source "js\app.js"
$store = Get-Source "js\store.js"
$index = Get-Source "index.html"
$dashboards = Get-Source "js\dashboards.js"
$firebase = Get-Source "js\firebase-config.js"
$authCodigo = Get-Codigo $auth

# ============================================================== CADASTRO
Write-Section "Cadastro - formulario e validacao"

if ($null -eq $auth) {
    Assert-That "js/auth.js presente" $false "(arquivo nao encontrado)"
} else {
    foreach ($perfil in @("reg", "mreg", "preg")) {
        $campo = "$perfil-password"
        Assert-That "campo de senha existe (#$campo)" ($index -match ('id="' + $campo + '"')) "sem $campo no index.html"
        Assert-That "senha validada ($perfil)" ($auth -match ('id: "' + $campo + '", label: "Senha"'))
    }

    Assert-That "minimo de 10 caracteres" ($auth -match "PASSWORD_MIN_LENGTH:\s*10")
    Assert-That "dicionario de senhas comuns rejeitado" ($auth -match "COMMON_PASSWORDS")
    Assert-That "exige 3 classes de caracteres" ($auth -match "classes\s*<\s*3")
    Assert-That "sequencias obvias rejeitadas" ($auth -match "abcdefghij|qwertyuiop")
    Assert-That "senha nao pode derivar da identidade" ($auth -match "passwordMatchesIdentity")

    Assert-That "CPF com 11 digitos validado" ($auth -match 'reg-cpf", label: "CPF".*length === 11')
    Assert-That "CNPJ com 14 digitos validado" ($auth -match 'mreg-cnpj", label: "CNPJ".*length === 14')

    Assert-That "lojista exige Firebase Auth" ($auth -match "if \(!FirebaseBridge\.auth\)")
    Assert-That "conta criada antes de liberar painel" ($auth -match "createUserWithEmailAndPassword")

    Assert-That "envio de e-mail de verificacao implementado" ($auth -match "sendEmailVerification")
    Assert-That "envio chamado no cadastro de cliente" ($auth -match 'sendVerificationEmail\(\$?firebaseUser, "Cadastro de cliente"\)')
    Assert-That "envio chamado no cadastro de lojista" ($auth -match 'sendVerificationEmail\(authUser, "Cadastro de lojista"\)')
    Assert-That "envio chamado no cadastro de parceiro" ($auth -match 'sendVerificationEmail\(authUser, "Cadastro de parceiro"\)')
    Assert-That "falha de envio nao invalida cadastro" ($authCodigo -match "sendEmailVerification[\s\S]{0,600}catch")

    Assert-That "aceite de termos nao vem pre-marcado (cliente)" ($index -notmatch 'id="reg-terms"[^>]*checked')
    Assert-That "botao de cadastro exige aceite" ($index -match 'id="btn-submit-client"[^>]*disabled')
    Assert-That "termos validados no submit" ($auth -match 'id: "reg-terms", label: "Termos"')
}

# ============================================================== LOGIN
Write-Section "Login - sessao e portao de acesso"

if ($null -ne $app) {
    Assert-That "portao de acesso aplicado no init" ($app -match "enforceAuthGate\(\)")
    Assert-That "login resiste a clique fora" ($app -match "authGateLocked")
    Assert-That "login resiste ao Esc" ($app -match "keydown")
    Assert-That "sair da conta reativa o portao" ($app -match "lockAuthGate\(\)")
    Assert-That "login bem-sucedido libera o portao" ($app -match "onAuthenticated")
}

if ($null -ne $store) {
    Assert-That "nenhum usuario de exemplo e criado" ($store -notmatch "usr-carlos|carlos\.silva@exemplo")
    Assert-That "login real via Firebase" ($auth -match "signInWithEmailAndPassword")
}

if ($null -ne $firebase) {
    Assert-That "sessao Firebase revogada invalida cache local" ($firebase -match "cached\.firebaseUid")
}

if ($null -ne $auth) {
    Assert-That "erro nao revela se e-mail existe" ($auth -match 'auth/user-not-found": "E-mail ou senha incorretos')
    Assert-That "recuperacao responde igual para e-mail inexistente" ($auth -match "auth/user-not-found.*auth/invalid-email")
    Assert-That "lockout com backoff progressivo" ($auth -match "Math\.pow")
    Assert-That "TOTP usa assertionForSignIn" ($auth -match "TotpMultiFactorGenerator\.assertionForSignIn")
    Assert-That "API inexistente do TOTP nao e chamada" ($authCodigo -notmatch "TotpMultiFactorAssertion")
}

# ============================================================== XSS
Write-Section "XSS - escape de conteudo nao confiavel"

if ($null -ne $store) {
    Assert-That "escapeHtml definido" ($store -match "function escapeHtml")
    Assert-That "safeImageUrl rejeita javascript:" ($store -match 'parsed\.protocol !== "http:"')
}

if ($null -ne $dashboards) {
    Assert-That "denuncia escapada no painel admin" ($dashboards -match 'escapeHtml\(r\.reportedItem\)')
    Assert-That "motivo de denuncia escapado" ($dashboards -match 'escapeHtml\(r\.reason\)')
    Assert-That "log de auditoria escapado" ($dashboards -match 'escapeHtml\(l\.details\)')
    Assert-That "id usado em onclick escapado" ($dashboards -match "escapeJsArg")
}

if ($null -ne $index) {
    Assert-That "nenhum e-mail de exemplo hardcoded" ($index -notmatch "vendendo solucoes@gmail\.com")
}

# ============================================================== AUTORIZACAO
Write-Section "Autorizacao e papeis"

if ($null -ne $auth) {
    Assert-That "loja auto-aprovada conforme configurado" ($auth -match 'verified:\s*true')
    Assert-That "auto-registro de aprovacao para auditoria" ($auth -match 'approvedBy:\s*"auto-approve"')
}

if ($null -ne $dashboards) {
    Assert-That "suspensao continua possivel pelo admin" ($dashboards -match "toggleStoreVerification")
    Assert-That "suspensao fica registrada" ($dashboards -match "suspendedAt")
}

# ============================================================== CATEGORIAS
Write-Section "Categorias - catalogo com imagem propria"

$data = Get-Source "js\data.js"
$appCodigo = Get-Codigo $app
$storeCodigo = Get-Codigo $store

if ($null -eq $data) {
    Assert-That "js/data.js presente" $false
} else {
    $cats = [regex]::Matches($data, 'slug:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*image:\s*"/assets/categories/([^"]+)"')

    Assert-That "30 categorias no catalogo" ($cats.Count -eq 30) "-> $($cats.Count)"

    $slugs = @()
    $imagens = @()
    $nomes = @()
    foreach ($m in $cats) {
        $slugs += $m.Groups[1].Value
        $nomes += $m.Groups[2].Value
        $arquivo = $m.Groups[3].Value
        $imagens += $arquivo
        # O arquivo tem de se chamar igual ao slug: é o que permite recortar
        # e nomear em lote sem consultar a lista.
        if ($arquivo -replace '\.webp$','' -ne $m.Groups[1].Value) {
            Assert-That "slug e arquivo coerentes" $false "-> $($m.Groups[1].Value) vs $arquivo"
        }
    }

    Assert-That "nenhum slug duplicado" (($slugs | Select-Object -Unique).Count -eq $slugs.Count)
    Assert-That "nenhuma imagem repetida" (($imagens | Select-Object -Unique).Count -eq $imagens.Count)
    Assert-That "nenhum nome de categoria repetido" (($nomes | Select-Object -Unique).Count -eq $nomes.Count)
    Assert-That "toda imagem usa .webp" ((($imagens | Where-Object { $_ -notmatch '\.webp$' }).Count -eq 0))
    Assert-That "nenhum caminho de imagem absoluto externo" ((($imagens | Where-Object { $_ -match '^https?://' }).Count -eq 0))
}

if ($null -ne $appCodigo) {
    Assert-That "grade de categorias renderizada" ($appCodigo -match "renderProductCategoryGrid")
    Assert-That "cards apontam para /assets/categories" ($data -match "/assets/categories/")
    Assert-That "card usa object-fit via classe" (Get-Codigo (Get-Source "css\marketplace.css") -match "object-fit:\s*cover")
    Assert-That "link da categoria aponta para /categoria/<slug>" ($appCodigo -match '/categoria/\$\{encodeURIComponent')
    Assert-That "rota de categoria registrada" ($appCodigo -match 'renderCategoryView\(params\.slug')
    Assert-That "imagem ausente cai em fallback" ($appCodigo -match "onImageFallback")
    Assert-That "slug resolvido por busca exata" ($storeCodigo -match "findProductCategory")
}

# O catalogo antigo (8 eixos) continua intacto: os cards novos sao uma
# vitrine paralela e nao podem ter quebrado o filtro das pilhas.
if ($null -ne $data) {
    Assert-That "eixos legados preservados" ($data -match 'cat-tec' -and $data -match 'cat-ferramentas')
}

# ============================================================== DEPLOY
Write-Section "Deploy - exposicao de arquivos no Netlify"

$netlify = Get-Source "netlify.toml"
if ($null -eq $netlify) {
    Assert-That "netlify.toml presente" $false
} else {
    $publishDot = $netlify -match 'publish\s*=\s*"\."'
    Assert-That "publish nao expoe a raiz inteira" ((-not $publishDot) -or (Test-Path (Join-Path $script:Root ".netlifyignore")))
    Assert-That "HSTS habilitado" ($netlify -match "Strict-Transport-Security")
    Assert-That "X-Frame-Options presente" ($netlify -match "X-Frame-Options")
    Assert-That "nosniff presente" ($netlify -match "X-Content-Type-Options")
    Assert-That "Permissions-Policy restritiva" ($netlify -match "Permissions-Policy")
    Assert-That "SPA rewrite configurado" ($netlify -match "status\s*=\s*200")
}

$gitignore = Get-Source ".gitignore"
Assert-That "certificado fora do versionamento" ($gitignore -match "localhost\.pfx")
Assert-That "segredos fora do versionamento" ($gitignore -match "\.env")

# ================================================================= HTTP
if ($httpDisponivel) {
    Write-Section "HTTP - entrega de assets"
    foreach ($asset in @(
        "", "index.html", "404.html", "manifest.json",
        "js/app.js", "js/auth.js", "js/store.js", "js/data.js",
        "js/dashboards.js", "js/cart-checkout.js", "js/firebase-config.js",
        "js/policies-lgpd.js",
        "css/design-system.css", "css/components.css", "css/marketplace.css",
        "css/dashboards.css", "css/policies.css", "css/responsive.css"
    )) {
        $url = if ($asset -eq "") { "$BaseUrl/" } else { "$BaseUrl/$asset" }
        $code = Get-CodigoHttp $url
        Assert-That "GET /$asset" ($code -eq 200) "-> $code"
    }

    Write-Section "HTTP - bloqueio de arquivos sensiveis"
    foreach ($sensivel in @(
        "firebase.json", "vercel.json", ".firebaserc", "firestore.rules",
        "server.ps1", "test_tcp.ps1", "localhost.pfx", "README.md",
        ".netlifyignore", ".env.example"
    )) {
        $code = Get-CodigoHttp "$BaseUrl/$sensivel"
        Assert-That "$sensivel bloqueado" (($code -eq 403) -or ($code -eq 404)) "-> $code"
    }

    Write-Section "HTTP - directory traversal"
    foreach ($ataque in @(
        "/../server.ps1",
        "/../../etc/passwd",
        "/js/../../firebase.json",
        "/%2e%2e/server.ps1",
        "/..%5cserver.ps1",
        "/../.netlifyignore",
        "/css/../../firestore.rules"
    )) {
        $code = Get-CodigoHttp "$BaseUrl$ataque" -CaminhoCru
        Assert-That "traversal $ataque bloqueado" (($code -eq 403) -or ($code -eq 404)) "-> $code"
    }

    Write-Section "HTTP - cabecalhos de seguranca"
    $cabecalhos = Get-Cabecalhos "$BaseUrl/"
    foreach ($header in @(
        "X-Content-Type-Options", "X-Frame-Options",
        "X-XSS-Protection", "Referrer-Policy"
    )) {
        # -match devolve um array quando a entrada tem varias linhas; sem o
        # cast o parametro booleano recebe Object[] e o teste estoura.
        Assert-That "header $header" ([bool]($cabecalhos -match "(?im)^$header\s*:")) "ausente"
    }
}

# ================================================================= RESUMO
Write-Host ""
Write-Host "========================================" -ForegroundColor DarkGray
Write-Host "  Passou:  $script:Pass" -ForegroundColor Green
if ($script:Fail -gt 0) {
    Write-Host "  Falhou:  $script:Fail" -ForegroundColor Red
} else {
    Write-Host "  Falhou:  0" -ForegroundColor Green
}
Write-Host "========================================" -ForegroundColor DarkGray

if ($script:Fail -gt 0) {
    Write-Host ""
    Write-Host "Detalhamento das falhas:" -ForegroundColor Red
    foreach ($f in $script:Failures) { Write-Host "  - $f" -ForegroundColor Red }
    exit 1
} else {
    Write-Host ""
    Write-Host "Todos os testes passaram." -ForegroundColor Green
    exit 0
}