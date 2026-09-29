/**
 * VENDENDO SOLUÇÕES — STATE STORE
 * Reactive State Management with LocalStorage persistence
 */

const STORAGE_KEYS = {
  STORES: "vs_stores_v1",
  PRODUCTS: "vs_products_v1",
  CATEGORIES: "vs_categories_v1",
  CART: "vs_cart_v1",
  FAVORITES: "vs_favorites_v1",
  ORDERS: "vs_orders_v1",
  CURRENT_USER: "vs_current_user_v1",
  LOGS: "vs_audit_logs_v1",
  REPORTS: "vs_reports_v1",
  LGPD_CONSENT: "vs_lgpd_consent_v1",
  THEME: "vs_theme_v1"
};

class StoreManager {
  constructor() {
    this.subscribers = [];
    this.init();
  }

  init() {
    // Initialize or refresh persistent collections with newly expanded catalog
    const existingStores = JSON.parse(localStorage.getItem(STORAGE_KEYS.STORES) || "[]");
    if (existingStores.length < INITIAL_DATA.stores.length) {
      localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(INITIAL_DATA.stores));
    }

    const existingProds = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || "[]");
    if (existingProds.length < INITIAL_DATA.products.length) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_DATA.products));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_DATA.categories));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_DATA.ordersSeed));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_DATA.securityAuditLogs));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_DATA.reportsSeed));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CART)) {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FAVORITES)) {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify({ products: [], stores: [] }));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      // No default user - start with clean session
    }

    // Initialize Firebase Cloud Bridge if available
    if (typeof FirebaseBridge !== "undefined") {
      FirebaseBridge.init();
    }
  }

  // Generic getter & setter
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return null;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify(key, value);
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  // Subscribe to changes
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify(key, value) {
    this.subscribers.forEach(cb => {
      try { cb(key, value); } catch (e) { console.error(e); }
    });
  }

  /* ------------------------------------------------------------------------
     Getters
     ------------------------------------------------------------------------ */
  getStores() { return this.get(STORAGE_KEYS.STORES) || []; }
  getProducts() { return this.get(STORAGE_KEYS.PRODUCTS) || []; }
  getCategories() { return this.get(STORAGE_KEYS.CATEGORIES) || []; }
  getCart() { return this.get(STORAGE_KEYS.CART) || []; }
  getFavorites() { return this.get(STORAGE_KEYS.FAVORITES) || { products: [], stores: [] }; }
  getOrders() { return this.get(STORAGE_KEYS.ORDERS) || []; }
  getUser() { return this.get(STORAGE_KEYS.CURRENT_USER); }
  getLogs() { return this.get(STORAGE_KEYS.LOGS) || []; }
  getReports() { return this.get(STORAGE_KEYS.REPORTS) || []; }

  /* ------------------------------------------------------------------------
     User & Roles
     ------------------------------------------------------------------------ */
  setUserRole(role) {
    let user = this.getUser() || {};
    user.role = role;
    if (role === "lojista") {
      user.name = "TechNova Inovações (Lojista)";
      user.storeId = "store-technova";
    } else if (role === "partner") {
      user.name = "Nexus Express Hub (Parceiro)";
      user.partnerType = "Logística & Tech";
    } else if (role === "admin") {
      user.name = "Administrador Geral do Sistema";
      user.role = "admin";
    } else {
      user.name = "Carlos Eduardo Silva";
      user.storeId = null;
      user.role = "client";
    }
    this.set(STORAGE_KEYS.CURRENT_USER, user);
    this.addAuditLog("ROLE_SWITCH", user.email || "sistema", `Alternou perfil ativo para ${role.toUpperCase()}`);
    return user;
  }

  loginUser(email, password) {
    // Check if locked
    const lockKey = `vs_lock_${email}`;
    const lockExpiry = localStorage.getItem(lockKey);
    if (lockExpiry && Date.now() < parseInt(lockExpiry)) {
      const waitMin = Math.ceil((parseInt(lockExpiry) - Date.now()) / 60000);
      throw new Error(`Conta bloqueada por segurança. Tente novamente em ${waitMin} minutos.`);
    }

    // Demo authentication check
    let userRole = "client";
    let name = "Usuário Verificado";
    let storeId = null;

    if (email.includes("lojista") || email.includes("technova")) {
      userRole = "lojista";
      name = "TechNova Inovações (Lojista)";
      storeId = "store-technova";
    } else if (email.includes("admin")) {
      userRole = "admin";
      name = "Administrador Master";
    } else if (email.includes("parceiro") || email.includes("nexus")) {
      userRole = "partner";
      name = "Nexus Logística (Parceiro)";
    }

    const user = {
      id: "usr-" + Date.now(),
      email,
      name,
      role: userRole,
      storeId,
      mfaEnabled: true,
      lastLogin: new Date().toISOString()
    };

    this.set(STORAGE_KEYS.CURRENT_USER, user);
    this.addAuditLog("LOGIN_SUCCESS", email, `Login seguro bem-sucedido [Perfil: ${userRole.toUpperCase()}].`);
    return user;
  }

  logout() {
    const user = this.getUser();
    if (user) {
      this.addAuditLog("LOGOUT", user.email, "Sessão encerrada pelo usuário.");
    }
    this.set(STORAGE_KEYS.CURRENT_USER, null);
  }

  /* ------------------------------------------------------------------------
     Cart Management
     ------------------------------------------------------------------------ */
  addToCart(productId, qty = 1, variation = {}) {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.productId === productId && JSON.stringify(item.variation) === JSON.stringify(variation));

    if (existingIndex > -1) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({
        productId,
        storeId: product.storeId,
        title: product.title,
        price: product.price,
        image: product.image,
        qty,
        variation
      });
    }

    this.set(STORAGE_KEYS.CART, cart);
    this.showToast("Produto adicionado ao carrinho!", "success");
  }

  updateCartQty(productId, qty) {
    let cart = this.getCart();
    if (qty <= 0) {
      cart = cart.filter(item => item.productId !== productId);
    } else {
      const item = cart.find(i => i.productId === productId);
      if (item) item.qty = qty;
    }
    this.set(STORAGE_KEYS.CART, cart);
  }

  removeFromCart(productId) {
    let cart = this.getCart().filter(item => item.productId !== productId);
    this.set(STORAGE_KEYS.CART, cart);
    this.showToast("Item removido do carrinho.", "info");
  }

  clearCart() {
    this.set(STORAGE_KEYS.CART, []);
  }

  /* ------------------------------------------------------------------------
     Favorites
     ------------------------------------------------------------------------ */
  toggleFavoriteProduct(productId) {
    let favs = this.getFavorites();
    const idx = favs.products.indexOf(productId);
    if (idx > -1) {
      favs.products.splice(idx, 1);
      this.showToast("Produto removido dos favoritos", "info");
    } else {
      favs.products.push(productId);
      this.showToast("Produto salvo nos seus favoritos!", "success");
    }
    this.set(STORAGE_KEYS.FAVORITES, favs);
    return favs.products.includes(productId);
  }

  toggleFavoriteStore(storeId) {
    let favs = this.getFavorites();
    const idx = favs.stores.indexOf(storeId);
    if (idx > -1) {
      favs.stores.splice(idx, 1);
      this.showToast("Loja removida dos favoritos", "info");
    } else {
      favs.stores.push(storeId);
      this.showToast("Loja adicionada às suas favoritas!", "success");
    }
    this.set(STORAGE_KEYS.FAVORITES, favs);
    return favs.stores.includes(storeId);
  }

  /* ------------------------------------------------------------------------
     Audit Logs & Moderation
     ------------------------------------------------------------------------ */
  addAuditLog(type, user, details) {
    let logs = this.getLogs();
    const newLog = {
      id: "LOG-" + (logs.length + 1).toString().padStart(2, '0'),
      date: new Date().toLocaleString("pt-BR"),
      type,
      user,
      ip: "189." + Math.floor(Math.random() * 200) + "." + Math.floor(Math.random() * 200) + ".1",
      details
    };
    logs.unshift(newLog);
    if (logs.length > 50) logs.pop();
    this.set(STORAGE_KEYS.LOGS, logs);
  }

  addReport(reportData) {
    let reports = this.getReports();
    const newReport = {
      id: "REP-" + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().split('T')[0],
      status: "Em Análise",
      ...reportData
    };
    reports.unshift(newReport);
    this.set(STORAGE_KEYS.REPORTS, reports);
    this.addAuditLog("REPORT_SUBMITTED", "Anônimo", `Denúncia registrada contra ${reportData.reportedItem}. Protocolo: ${newReport.id}`);

    // Sync to Firestore Cloud
    if (typeof FirebaseBridge !== "undefined") {
      FirebaseBridge.saveReportToFirestore(newReport);
    }

    return newReport;
  }

  /* ------------------------------------------------------------------------
     Toasts & UI Utilities
     ------------------------------------------------------------------------ */
  showToast(message, type = "info", title = "") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "⚠️";
    if (type === "warning") icon = "🔔";

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ""}
        <p class="toast-message">${message}</p>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4500);
  }
}

// Global instance
const store = new StoreManager();

// Global Formatters
const Formatters = {
  currency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  },
  date(isoString) {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  },
  cpf(cpf) {
    if (!cpf) return "";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  },
  cnpj(cnpj) {
    if (!cnpj) return "";
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  },
  cep(cep) {
    if (!cep) return "";
    return cep.replace(/(\d{5})(\d{3})/, "$1-$2");
  }
};
