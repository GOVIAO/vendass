# Quick Start - Vendendo Soluções

## 🚀 Local Development
```bash
# Netlify CLI (mirrors production redirects + headers)
netlify dev
# Open: http://localhost:8888
```
```powershell
# Alternative: HTTPS server (accept self-signed cert in browser)
powershell -ExecutionPolicy Bypass -File server.ps1
# Open: https://localhost:3000
```

## 🌐 Deploy to Netlify (Production SSL Auto)
```bash
# 1. Push to GitHub
git push origin main

# 2. Netlify → Add new project → Import an existing project
#    Build command: (empty) | Publish directory: . (set in netlify.toml)

# 3. Firebase web config lives in js/firebase-config.js
#    (static site: Netlify env vars are not injected into the browser)

# 4. Firebase Console → Auth → Authorized domains
#    Add: solucionando.netlify.app (and any custom domain)

# 5. Deploy → Automatic HTTPS + HSTS
#    Or via CLI: netlify deploy --prod
```

## ✅ Features Ready
- **Access Gate**: Email + Phone verification before access
- **2FA**: Mandatory for admins, optional for others
- **Firebase**: Auth (Google/Email), Firestore, Analytics
- **GA4**: Configurable via Firebase config
- **LGPD**: Cookie consent, data rights, audit logs
- **Multi-store Checkout**: Split orders by seller
- **PWA**: Manifest + Service Worker ready
- **Security**: HSTS, security headers (netlify.toml), brute-force protection

## 🔐 Dev Bypass
Press `Ctrl+Shift+D` on Access Gate to skip verification locally.
