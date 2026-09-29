# Quick Start - Vendendo Soluções

## 🚀 Local Development (HTTPS)
```powershell
# Start HTTPS server (accept self-signed cert in browser)
powershell -ExecutionPolicy Bypass -File server.ps1
# Open: https://localhost:3000
```

## 🌐 Deploy to Vercel (Production SSL Auto)
```bash
# 1. Push to GitHub
git init && git add . && git commit -m "Init" && git branch -M main
git remote add origin https://github.com/USER/vendendo-solucoes.git
git push -u origin main

# 2. Import at https://vercel.com/new
#    Framework: Other | Build: (empty) | Output: (empty)

# 3. Add Environment Variables (from .env.example)
#    VITE_FIREBASE_* | VITE_GA_MEASUREMENT_ID

# 4. Firebase Console → Auth → Authorized domains
#    Add: your-project.vercel.app

# 5. Deploy → Automatic HTTPS + HSTS
```

## ✅ Features Ready
- **Access Gate**: Email + Phone verification before access
- **2FA**: Mandatory for admins, optional for others
- **Firebase**: Auth (Google/Email), Firestore, Analytics
- **GA4**: Configurable via `VITE_GA_MEASUREMENT_ID`
- **LGPD**: Cookie consent, data rights, audit logs
- **Multi-store Checkout**: Split orders by seller
- **PWA**: Manifest + Service Worker ready
- **Security**: HSTS, CSP headers, brute-force protection

## 🔐 Dev Bypass
Press `Ctrl+Shift+D` on Access Gate to skip verification locally.