# Vendendo Soluções — Plataforma Digital & Marketplace Inclusivo

## 🚀 Deploy no Netlify

### Pré-requisitos
- Conta no [Netlify](https://www.netlify.com)
- Projeto Firebase configurado (vendedor-de-solu)

### Configuração Rápida

1. **Conecte o repositório no Netlify**
   - Via Dashboard: *Add new project → Import an existing project* e selecione este repositório.
   - Build command: deixe vazio · Publish directory: `.` (já definidos em `netlify.toml`)
   - Ou via CLI: `netlify deploy --prod`

2. **Configuração do Firebase**
   - O site é estático (sem etapa de build), portanto variáveis de ambiente do Netlify
     **não** são injetadas no navegador. A configuração web do Firebase fica em
     `js/firebase-config.js` (ou pode ser definida via `window.ENV` antes do script).
   - Use `.env.example` como referência das chaves disponíveis. Nunca versione valores
     reais em arquivos de documentação.

3. **Configure o Firebase Auth**
   - No Console Firebase → Authentication → Settings → Authorized domains
   - Adicione: `solucionando.netlify.app` (e seu domínio personalizado, se houver)
   - Adicione: `localhost` (para desenvolvimento)

4. **Deploy!**
   - Push para `main` → Deploy automático
   - Ou: `netlify deploy --prod`

### Desenvolvimento Local

```bash
# Opção 1: Netlify CLI (simula produção: redirects e headers)
netlify dev
# Acesse: http://localhost:8888

# Opção 2: PowerShell Server (HTTPS local)
powershell -ExecutionPolicy Bypass -File server.ps1
# Acesse: https://localhost:3000
```

### Estrutura do Projeto
```
├── index.html              # Entry point (SPA)
├── netlify.toml            # Configuração Netlify (redirects, headers)
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

### Segurança
- Headers de segurança (HSTS, nosniff, X-Frame-Options etc.) configurados em `netlify.toml`
- Content Security Policy recomendada para produção
- Firebase Rules em `firestore.rules`
- Access Gate protege acesso inicial

### Troubleshooting
- **Firebase Auth não funciona**: Verifique Authorized Domains no Console Firebase
- **GA4 não aparece**: Confirme o ID de medição configurado em `js/firebase-config.js`
- **CORS errors**: O Netlify serve tudo a partir de uma única origem, sem problemas de CORS
- **Routes 404**: `netlify.toml` tem rewrite de SPA (`/*` → `/index.html`, status 200)

### Licença
Proprietário - Vendendo Soluções Tecnologia e Marketplace Intermediação de Negócios S.A.