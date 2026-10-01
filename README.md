# Vendendo Soluções — Plataforma Digital & Marketplace Inclusivo

## 🚀 Deploy na neflity

### site
- Conta na https://solucionando.netlify.app/#home
- Projeto Firebase configurado (vendedor-de-solu)

### Configuração Rápida

1. **Conecte o repositório na Vercel**
   ```bash
   # Opção A: Via Dashboard
   # 1. Acesse https://vercel.com/new
   # 2. Importe este repositório
   # 3. Framework Preset: "Other"
   # 4. Build Command: deixe vazio
   # 5. Output Directory: deixe vazio (raiz)
   
   # Opção B: Via CLI
   npx vercel --prod
   ```

2. **Configure as Variáveis de Ambiente** (Settings → Environment Variables)
   ```
   VITE_FIREBASE_API_KEY=AIzaSyAOHlzuTQDKIqgo1FUgU7ARN6tBzEs52_4
   VITE_FIREBASE_AUTH_DOMAIN=vendedor-de-solu.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=vendedor-de-solu
   VITE_FIREBASE_STORAGE_BUCKET=vendedor-de-solu.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=953875102535
   VITE_FIREBASE_APP_ID=1:953875102535:web:6b5782e82c4dc207832a62
   VITE_FIREBASE_MEASUREMENT_ID=G-XT74WR2V3C
   VITE_GA_MEASUREMENT_ID=G-SEU-GA4-ID
   ```

3. **Configure o Firebase Auth**
   - No Console Firebase → Authentication → Settings → Authorized domains
   - Adicione: `seu-projeto.vercel.app`
   - Adicione: `localhost` (para desenvolvimento)

4. **Deploy!**
   - Push para main → Deploy automático
   - Ou: `vercel --prod`

### Desenvolvimento Local

```bash
# Opção 1: PowerShell Server (HTTPS local)
powershell -ExecutionPolicy Bypass -File server.ps1
# Acesse: https://localhost:3000

# Opção 2: Vercel CLI (simula produção)
npx vercel dev
# Acesse: http://localhost:3000
```

### Estrutura do Projeto
```
├── index.html              # Entry point (SPA)
├── vercel.json             # Configuração Vercel
├── package.json            # Metadados do projeto
├── .vercelignore           # Arquivos ignorados no deploy
├── manifest.json           # PWA Manifest
├── assets/
│   ├── images/             # Imagens e ícones
├── css/                    # Stylesheets
├── js/
│   ├── app.js              # App principal (router, UI)
│   ├── auth.js             # Autenticação + 2FA + Access Gate
│   ├── store.js            # Estado + localStorage
│   ├── data.js             # Dados mock (produtos, lojas)
│   ├── firebase-config.js  # Firebase + Analytics
│   ├── cart-checkout.js    # Carrinho + Checkout multi-lojista
│   ├── dashboards.js       # Dashboards (lojista, parceiro, admin)
│   └── policies-lgpd.js    # LGPD + Cookies + Denúncias
└── server.ps1              # Servidor HTTPS local (dev)
```

### Funcionalidades
- ✅ **Access Gate** - Verificação obrigatória de e-mail + celular
- ✅ **2FA Obrigatório para Admins** - Autenticação de dois fatores
- ✅ **Multi-lojista** - Checkout com envio por loja
- ✅ **LGPD Compliant** - Cookies, consentimento, direitos do titular
- ✅ **Firebase Integration** - Auth, Firestore, Analytics
- ✅ **PWA Ready** - Manifest, Service Worker ready
- ✅ **HTTPS Local** - Certificado auto-assinado para dev
- ✅ **GA4 Ready** - Google Analytics 4 configurável

### Scripts NPM
```bash
npm run dev       # Inicia servidor local HTTPS
npm run build     # Build (static site - no-op)
npm run start     # Alias para dev
```

### Variáveis de Ambiente (.env.local)
Copie `.env.example` para `.env.local` e preencha:
```bash
cp .env.example .env.local
```

### Segurança
- Headers de segurança configurados em `vercel.json`
- Content Security Policy recomendada para produção
- Firebase Rules em `firestore.rules`
- Access Gate protege acesso inicial

### Troubleshooting
- **Firebase Auth não funciona**: Verifique Authorized Domains no Console Firebase
- **GA4 não aparece**: Confirme VITE_GA_MEASUREMENT_ID nas env vars
- **CORS errors**: Vercel serve como origem única, sem CORS issues
- **Routes 404**: `vercel.json` tem rewrite para SPA (`/**` → `/index.html`)

### Licença
Proprietário - Vendendo Soluções Tecnologia e Marketplace Intermediação de Negócios S.A.
