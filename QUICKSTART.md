# Quick Start — Vendendo Soluções

## 🌐 Site
- **Produção:** https://vendass.netlify.app
- **GitHub Pages:** https://GOVIAO.github.io/vendass/
- **Local HTTPS:** https://localhost:3000

---

## 🚀 Deploy Principal — Netlify (via GitHub)

**Pré-requisitos:** conta Netlify, conta GitHub, projeto Firebase `vendedor-de-solu`.

1. **Push para GitHub**
   ```bash
   git add .
   git commit -m "Deploy Netlify"
   git push
   ```

2. **Import no Netlify**
   - https://app.netlify.com → **Add new site → Import an existing project**
   - Selecione `GOVIAO/vendass` (branch `main`)
   - **Build command:** vazio | **Publish directory:** `.`

3. **Variáveis de ambiente** (Settings → Environment variables)
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

4. **Deploy** — URL: https://vendass.netlify.app (HTTPS automático)

5. **Pós-deploy** — Firebase Console → Authentication → Authorized domains → adicione `vendass.netlify.app`

---

## 🔄 Backup — GitHub Pages
```bash
Copy-Item index.html 404.html
git add 404.html && git commit -m "SPA fallback"
git push
```
URL: https://GOVIAO.github.io/vendass/

---

## 💻 Local (HTTPS)
```powershell
powershell -ExecutionPolicy Bypass -File server.ps1
# https://localhost:3000
```

## 🔐 Dev Bypass
`Ctrl+Shift+D` no Access Gate pula a verificação.

## ✅ Recursos
Login persistente (nome real exibido no banner e no header) · 2FA TOTP · Meus Cartões · Checkout multi-lojista · LGPD · Firebase · PWA · HSTS