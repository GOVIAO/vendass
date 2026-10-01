/**
 * VENDENDO SOLUÇÕES — FIREBASE CLOUD CONFIGURATION & INTEGRATION
 * Project ID: vendedor-de-solu
 * Services: Authentication (Google + Email/Password), Cloud Firestore, and Google Analytics
 * 
 * Supports Vite/import.meta.env or window.ENV for Vercel/environment variables
 */

function getEnv(key, fallback) {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof window !== "undefined" && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  return fallback;
}

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "AIzaSyAOHlzuTQDKIqgo1FUgU7ARN6tBzEs52_4"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN", "vendedor-de-solu.firebaseapp.com"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "vendedor-de-solu"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET", "vendedor-de-solu.firebasestorage.app"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "953875102535"),
  appId: getEnv("VITE_FIREBASE_APP_ID", "1:953875102535:web:6b5782e82c4dc207832a62"),
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID", "G-XT74WR2V3C")
};

const FirebaseBridge = {
  app: null,
  auth: null,
  db: null,
  analytics: null,
  isOnline: false,

  init() {
    try {
      if (typeof firebase !== "undefined") {
        // Evita dupla inicialização se já existe um app Firebase.
        this.app = firebase.apps.length
          ? firebase.apps[0]
          : firebase.initializeApp(firebaseConfig);
        this.auth = firebase.auth();
        this.db = firebase.firestore();

        try {
          if (firebase.analytics && typeof firebase.analytics.isSupported === 'function') {
            firebase.analytics.isSupported().then(supported => {
              if (supported) {
                this.analytics = firebase.analytics();
                console.log("🔥 Firebase Analytics inicializado com sucesso (G-XT74WR2V3C).");
              }
            });
          }
        } catch (e) {
          console.warn("Firebase Analytics em modo local:", e);
        }

        this.isOnline = true;
        this.updateCloudStatusBadge(true);
        this.listenAuthState();
        this.handleRedirectResult();

        // Processa resultado de redirect do Google (caso popup foi bloqueado)
        this.auth.getRedirectResult().then(result => {
          if (result && result.user) {
            const user = result.user;
            const clientUser = {
              id: "usr-" + user.uid.substring(0, 8),
              firebaseUid: user.uid,
              name: user.displayName || "Usuário Google",
              email: user.email,
              photoURL: user.photoURL,
              role: "client",
              storeId: null,
              mfaEnabled: true,
              lastLogin: new Date().toISOString()
            };
            store.set(STORAGE_KEYS.CURRENT_USER, clientUser);
            store.addAuditLog("LOGIN_GOOGLE_SUCCESS", user.email, "Autenticação via Google (redirect) concluída.");
            if (this.db) {
              this.db.collection("users").doc(user.uid).set({
                name: clientUser.name,
                email: clientUser.email,
                role: clientUser.role,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
              }, { merge: true }).catch(e => console.warn(e));
            }
            this.trackEvent("login", { method: "Google" });
            store.showToast(`Autenticado como ${clientUser.name} via Google!`, "success", "Login com Google");
            if (typeof App !== "undefined") {
              App.closeAllModals();
              App.updateNavUser();
              App.navigate("home");
            }
          }
        }).catch(err => {
          if (err && err.code && err.code !== "auth/no-auth-event") {
            console.warn("Google redirect result error:", err.code, err.message);
          }
        });

        console.log("🔥 Firebase conectado ao projeto: vendedor-de-solu");
        store.addAuditLog("FIREBASE_INIT", "Sistema", "Conexão estabelecida com Firebase Cloud (vendedor-de-solu).");
      } else {
        console.log("⚠️ SDK do Firebase não detectado globalmente. Operando em modo offline / localStorage.");
        this.updateCloudStatusBadge(false);
      }
    } catch (err) {
      console.warn("⚠️ Erro ao inicializar Firebase:", err.message);
      this.updateCloudStatusBadge(false);
    }
  },

  updateCloudStatusBadge(online) {
    const badge = document.getElementById("firebase-cloud-status");
    if (badge) {
      if (online) {
        badge.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981; margin-right:4px;"></span> Cloud: vendedor-de-solu`;
        badge.title = "Conectado ao Firebase Auth, Firestore e Analytics";
        badge.style.display = "inline-flex";
      } else {
        badge.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#F59E0B; margin-right:4px;"></span> Modo Local`;
        badge.title = "Operando com armazenamento local";
        badge.style.display = "inline-flex";
      }
    }
  },

  listenAuthState() {
    if (!this.auth) return;
    this.auth.onAuthStateChanged(firebaseUser => {
      if (firebaseUser) {
        console.log("🔥 Usuário autenticado no Firebase:", firebaseUser.email);
        const currentUser = store.getUser() || {};
        currentUser.email = firebaseUser.email;
        currentUser.name = firebaseUser.displayName || currentUser.name || "Usuário Google";
        currentUser.firebaseUid = firebaseUser.uid;
        currentUser.photoURL = firebaseUser.photoURL;
        store.set(STORAGE_KEYS.CURRENT_USER, currentUser);
        App.updateNavUser();
      }
    });
  },

  // Native Google Sign-In with Popup (fallback para Redirect se bloqueado)
  async signInWithGoogle() {
    if (!this.auth) {
      store.showToast("Firebase Auth não está pronto ainda. Tente novamente em alguns instantes.", "warning");
      return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    // Força a tela de seleção de conta Google sempre
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      // No mobile o popup é bloqueado com frequência: o redirect é o
      // caminho confiável, com o resultado tratado em handleRedirectResult().
      const result = this._isMobile()
        ? await this.auth.signInWithRedirect(provider)
        : await this.auth.signInWithPopup(provider);

      if (result && result.user) this._handleGoogleUser(result.user);
    } catch (err) {
      console.warn("Google Sign-In popup error:", err.code, err.message);

      if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
        if (err.code === "auth/popup-blocked") {
          store.showToast("Popup bloqueado pelo navegador. Redirecionando para o Google...", "info");
          try {
            await this.auth.signInWithRedirect(provider);
            // A página será recarregada; o resultado é tratado em init() via getRedirectResult()
          } catch (redirectErr) {
            console.error("Google redirect error:", redirectErr);
            store.showToast("Não foi possível abrir a tela de login do Google. Verifique se popups estão permitidos.", "error");
          }
        } else {
          store.showToast("Login com Google cancelado.", "info");
        }
      } else if (err.code === "auth/cancelled-popup-request") {
        // Ignora: outro popup já estava aberto
      } else if (err.code === "auth/network-request-failed") {
        store.showToast("Erro de conexão. Verifique sua internet e tente novamente.", "error");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        store.showToast("Este e-mail já possui conta com outro método de login (ex: e-mail/senha).", "error");
      } else {
        store.showToast(`Erro ao entrar com Google: ${err.message || err.code}`, "error");
      }
    }
  },

  /* ------------------------------------------------------------------
     Consolida a sessão após qualquer login bem-sucedido (Google ou
     e-mail/senha) e grava o perfil.
     ------------------------------------------------------------------ */
  _handleGoogleUser(user) {
    if (!user) return;
    const email = (user.email || "").toLowerCase();

    // Preserva o perfil já cadastrado. Sem isso, entrar pelo Google
    // sobrescreveria o papel de lojista do mesmo e-mail por "client".
    const existing = store.getUsers().find(u => String(u.email || "").toLowerCase() === email);

    const clientUser = {
      id: existing ? existing.id : user.uid,
      firebaseUid: user.uid,
      name: (existing && existing.name)
        || user.displayName
        || email.split("@")[0]
        || "Usuário",
      email,
      photoURL: user.photoURL || (existing && existing.photoURL) || null,
      role: existing && store.isValidRole(existing.role) ? existing.role : "client",
      storeId: existing ? existing.storeId || null : null,
      partnerType: existing ? existing.partnerType : undefined,
      // Reflete a inscrição real no provedor, não um valor fixo.
      mfaEnabled: user.multiFactor
        ? user.multiFactor.enrolledFactors.length > 0
        : false,
      authProvider: "google",
      lastLogin: new Date().toISOString()
    };

    store.set(STORAGE_KEYS.CURRENT_USER, clientUser);
    store.saveUser(clientUser);
    store.addAuditLog("LOGIN_GOOGLE_SUCCESS", email, "Autenticação via Google Sign-In concluída.");

    if (this.db) {
      this.db.collection("users").doc(user.uid).set({
        name: clientUser.name,
        email: clientUser.email,
        role: clientUser.role,
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(e => console.warn("Firestore user sync:", e));
    }

    this.trackEvent("login", { method: "Google" });
    store.showToast(`Bem-vindo(a), ${clientUser.name}! Login com Google realizado.`, "success", "Login com Google");
    if (typeof App !== "undefined") {
      App.closeAllModals();
      App.updateNavUser();
      App.navigate(clientUser.role === "admin" ? "dashboard-admin" : "home");
    }
    return clientUser;
  },

  // Consome o resultado de um fluxo de redirect (usado no mobile e
  // quando o popup é bloqueado).
  handleRedirectResult() {
    if (!this.auth) return;
    try {
      this.auth.getRedirectResult()
        .then(result => {
          if (result && result.user) this._handleGoogleUser(result.user);
        })
        .catch(err => {
          if (err && err.code && err.code !== "auth/cancelled-popup-request") {
            console.warn("Google redirect result:", err.code);
          }
        });
    } catch (e) { /* SDK sem suporte a redirect */ }
  },

  // True em dispositivos móveis, onde o popup costuma ser bloqueado.
  _isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  },

  // Track event in Google Analytics
  trackEvent(eventName, params = {}) {
    if (this.analytics) {
      try {
        this.analytics.logEvent(eventName, params);
      } catch (err) {
        console.warn("Analytics event error:", err);
      }
    }
  },

  // Sync order to Firestore
  async saveOrderToFirestore(order) {
    if (!this.db || !this.auth || !this.auth.currentUser) return false;
    try {
      // buyerUid e storeId são o que firestore.rules usa para autorizar a
      // leitura. Sem o uid autenticado, o pedido seria gravado sem dono e
      // a regra de create seria negada.
      const buyerUid = this.auth.currentUser.uid;
      await this.db.collection("orders").doc(order.id).set({
        ...order,
        buyerUid,
        storeId: order.storeId || null,
        items: order.items || order.subOrders || [],
        syncedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log(`🔥 Pedido ${order.id} sincronizado com Firestore.`);
      this.trackEvent("purchase", {
        transaction_id: order.id,
        value: order.total,
        currency: "BRL"
      });
      return true;
    } catch (err) {
      console.warn("Firestore saveOrder:", err.message);
      return false;
    }
  },

  // Sync store to Firestore
  async saveStoreToFirestore(storeData) {
    if (!this.db) return false;
    try {
      await this.db.collection("stores").doc(storeData.id).set({
        ...storeData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log(`🔥 Loja ${storeData.name} salva no Firestore.`);
      return true;
    } catch (err) {
      console.warn("Firestore saveStore:", err.message);
      return false;
    }
  },

  // Sync report to Firestore
  async saveReportToFirestore(reportData) {
    if (!this.db) return false;
    try {
      await this.db.collection("reports").doc(reportData.id).set({
        ...reportData,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log(`🔥 Denúncia ${reportData.id} enviada para análise no Firestore.`);
      return true;
    } catch (err) {
      console.warn("Firestore saveReport:", err.message);
      return false;
    }
  }
};
