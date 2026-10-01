# Vendendo Soluções — Plataforma Digital & Marketplace Inclusivo

## 🌐 Site

| Ambiente | URL |
|----------|-----|
| **Produção (Netlify)** | https://vendass.netlify.app |
| GitHub Pages | https://GOVIAO.github.io/vendass/ |
| Local (HTTPS) | https://localhost:3000 |

Todos os ambientes usam HTTPS/SSL.

---

## 🚀 Deploy Principal — Netlify

### Pré-requisitos
- Conta no [Netlify](https://app.netlify.com)
- Conta no [GitHub](https://github.com) com acesso ao repositório `GOVIAO/vendass`
- Projeto Firebase configurado (`vendedor-de-solu`)

### Deploy via GitHub (recomendado)

1. **Conecte o repositório no Netlify**
   - Acesse https://app.netlify.com/drop ou https://app.netlify.com
   - **Add new site → Import an existing project**
   - Selecione `GOVIAO/vendass` (branch `main`)
   - Configure:
     - **Build command:** deixe **vazio**
     - **Publish directory:** `.`
     - **Site configuration → Environment variables:** adicione as variáveis abaixo

2. **Variáveis de ambiente** (Settings → Environment variables)
   ```
   VITE_FIREBASE_API_KEY=AIzaSyAOHlzuTQDKIqgo1FUgU7ARN6tBzEs52_4
   VITE_FIREBASE_AUTH_DOMAIN=vendedor-de-solu.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=vendedor-de-solu
   VITE_FIREBASE_STORAGE_BUCKET=vendedor-de-solu.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=953875102535
   VITE_FIREBASE_APP_ID=1:953875102535:web:6b5782e82c4dc207832a62
   VITE_FIREBASE_MEASUREMENT_ID=G-XT74WR2V3C
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **Deploy!** — cada push em `main` dispara deploy automático.

**URL gerada:** `https://<seu-site>.netlify.app` (SSL/HTTPS automático)

### Deploy via CLI (opcional)
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Pós-deploy
No **Firebase Console → Authentication → Settings → Authorized domains**, adicione:
- `seu-site.netlify.app`

---

## 🔄 Deploy Secundário — GitHub Pages

```bash
# GitHub Pages serve o site direto do repositório
# Settings → Pages → Source: main branch / root

# URL: https://GOVIAO.github.io/vendass/
```

Para GitHub Pages, adicione no `<head>` do `index.html` ou use `404.html` como fallback SPA:

```bash
Copy-Item index.html 404.html
git add 404.html && git commit -m "Add SPA fallback for GitHub Pages"
```

---

## 💻 Desenvolvimento Local (HTTPS)

```powershell
# Servidor HTTPS local com certificado auto-assinado
powershell -ExecutionPolicy Bypass -File server.ps1
# Acesse: https://localhost:3000
```

---

## 📁 Estrutura do Projeto
```
├── index.html              # Entry point (SPA)
├── netlify.toml            # Configuração Netlify
├── vercel.json             # Configuração Vercel (backup)
├── manifest.json           # PWA Manifest
├── .env.example            # Variáveis de ambiente
├── assets/images/          # Imagens e ícones
├── css/                    # 6 stylesheets
├── js/
│   ├── app.js              # App principal (router, UI, login status)
│   ├── auth.js             # Auth + 2FA + validação de formulários
│   ├── store.js            # Estado + localStorage + registro de usuários
│   ├── data.js             # Dados mock (produtos, lojas)
│   ├── firebase-config.js  # Firebase + Analytics
│   ├── cart-checkout.js    # Carrinho + Checkout multi-lojista
│   ├── dashboards.js       # Dashboards (lojista, parceiro, admin)
│   └── policies-lgpd.js    # LGPD + Cookies + Denúncias
└── server.ps1              # Servidor HTTPS local
```

## ✅ Funcionalidades
- **Access Gate** — verificação obrigatória de e-mail + celular
- **2FA (TOTP)** — Google Authenticator / Authy, obrigatório para admins
- **Login persistente** — nome e perfil reais preservados entre sessões
- **Banner de confirmação** — exibe nome e papel do usuário autenticado
- **Cartões salvos** — menu "Meus Cartões" no dropdown do perfil
- **Checkout multi-lojista** — envio e rastreio por loja
- **LGPD** — consentimento de cookies, direitos do titular, logs de auditoria
- **Firebase** — Auth (Google + Email), Firestore, Analytics
- **PWA** — manifest, ícones, instalável
- **Segurança** — HSTS, CSP, X-Frame-Options, brute-force lockout

## 🧪 Testes
```bash
python -m pytest testes/test_validacao.py -v
```

### Segurança
- Headers de segurança (HSTS, CSP, cache) configurados em `netlify.toml` e `vercel.json`
- Content Security Policy recomendada para produção
- Firebase Rules em `firestore.rules`
- Access Gate protege acesso inicial
- `localhost.pfx` e demais segredos estão no `.gitignore` e **não** são versionados
- Cartões salvos guardam apenas bandeira e finais (`•••• 1234`); PAN e CVV nunca são persistidos

### Troubleshooting
- **Firebase Auth não funciona**: adicione o domínio do deploy em Firebase Authentication → Authorized domains
- **GA4 não aparece**: o `measurementId` precisa ser preenchido em `window.ENV` (veja Limitação abaixo)
- **Routes 404**: `netlify.toml` tem redirect SPA (`/*` → `/index.html`); no GitHub Pages use `404.html`
- **Deploy falha no build**: o site é 100% estático, sem `package.json` — publique o diretório raiz com build command vazio

### ⚠️ Limitação conhecida — variáveis de ambiente
Por ser um site estático sem etapa de build, as variáveis definidas no painel da Netlify
**não** são injetadas automaticamente no HTML. A configuração Firebase/M Analytics é lida de
`window.ENV` no `<head>` de `index.html`. Para parametrizar por ambiente, substitua esses valores
por um `config.json` gerado no build ou por um endpoint próprio.

## 📜 Licença
Proprietário — Vendendo Soluções Tecnologia e Marketplace Intermediação de Negócios S.A.
