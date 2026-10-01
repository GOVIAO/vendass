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
        this.app = firebase.initializeApp(firebaseConfig);
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

  // Native Google Sign-In with Popup
  async signInWithGoogle() {
    if (!this.auth) {
      store.showToast("Firebase Auth em carregamento ou indisponível.", "warning");
      return;
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await this.auth.signInWithPopup(provider);
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
      store.addAuditLog("LOGIN_GOOGLE_SUCCESS", user.email, "Autenticação via Google Sign-In concluída.");
      
      // Save profile to Firestore
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
      App.closeAllModals();
      App.updateNavUser();
      App.navigate("home");
    } catch (err) {
      console.error("Google Sign-In error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        store.showToast("Janela de login fechada antes de concluir.", "info");
      } else {
        store.showToast(`Autenticação Google: ${err.message}`, "error");
      }
    }
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
