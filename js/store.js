/**
 * VENDENDO SOLUÇÕES — STATE STORE
 * Reactive State Management with LocalStorage persistence
 */

/**
 * Escapa texto para inserção segura em HTML.
 *
 * Uso obrigatório sempre que um valor vindo do usuário (nome de cadastro,
 * título de produto, avaliação, endereço, alvo de denúncia) for concatenado
 * numa string passada a innerHTML. Sem isso, um cadastro com nome
 * `<img src=x onerror=...>` executa script para todos os visitantes.
 *
 * Quando a marcação não for necessária, prefira textContent — sempre mais
 * seguro que escapar.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Valida e normaliza uma URL de imagem remota.
 *
 * Restringe a http/https e descarta esquemas executáveis (javascript:, data:)
 * que poderiam transformar um campo de imagem em vetor de XSS. Também evita
 * que um lojista aponte o campo para um pixel de rastreamento externo.
 */
function safeImageUrl(url) {
  if (!url) return "";
  const raw = String(url).trim();
  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return escapeHtml(parsed.href);
  } catch (e) {
    return "";
  }
}

/**
 * Escapa um valor destined a um handler inline `onclick="fn('...')"`.
 * Impede que aspas ou parênteses no dado fechem o argumento e injetem JS.
 */
function escapeJsArg(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E")
    .replace(/&/g, "\\u0026")
    .replace(/\r?\n/g, "");
}

const STORAGE_KEYS = {
  STORES: "vs_stores_v1",
  PRODUCTS: "vs_products_v1",
  CATEGORIES: "vs_categories_v1",
  CART: "vs_cart_v1",
  FAVORITES: "vs_favorites_v1",
  ORDERS: "vs_orders_v1",
  CURRENT_USER: "vs_current_user_v1",
  USERS: "vs_users_v1",
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
    // Nota: FirebaseBridge.init() é chamado em App.init() após todos os
    // scripts terem carregado — não aqui, pois store.js carrega antes de
    // firebase-config.js e FirebaseBridge ainda não existiria.
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
  getUsers() { return this.get(STORAGE_KEYS.USERS) || []; }
  getLogs() { return this.get(STORAGE_KEYS.LOGS) || []; }
  getReports() { return this.get(STORAGE_KEYS.REPORTS) || []; }

/* ------------------------------------------------------------------------
     User & Roles
     ------------------------------------------------------------------------ */

  // Papéis válidos. Qualquer valor fora desta lista é rejeitado.
  // Campo de classe (não propriedade de objeto): vírgula aqui separaria
  // campos, não métodos.
  VALID_ROLES = ["client", "lojista", "partner", "admin"];

  isValidRole(role) {
    return this.VALID_ROLES.includes(role);
  }

  isAdmin() {
    const user = this.getUser();
    return !!user && user.role === "admin";
  }

  hasRole(...roles) {
    const user = this.getUser();
    return !!user && roles.includes(user.role);
  }

  // Apenas troca o perfil EXIBIDO na interface. NÃO concede permissão:
  // a autorização real é sempre reavaliada no Firestore (firestore.rules).
  setUserRole(role) {
    if (!this.isValidRole(role)) {
      throw new Error("Papel inválido.");
    }
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
    } else {
      user.storeId = null;
    }
    this.set(STORAGE_KEYS.CURRENT_USER, user);
    this.addAuditLog("ROLE_SWITCH", user.email || "sistema", `Perfil exibido alterado para ${role.toUpperCase()}`);
    return user;
  }

  // Deriva a sessão a partir do perfil CADASTRADO.
  //
  // Segurança: o papel NUNCA é inferido do texto do e-mail. Fazer isso permitiria
  // que qualquer pessoa se cadastrasse com um e-mail contendo "admin" e recebesse
  // privilégios administrativos. Papéis saem exclusivamente do registro persistido.
  loginUser(email, authProvider = "firebase") {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error("E-mail inválido.");
    }

    const registered = this.getUsers().find(
      u => String(u.email || "").toLowerCase() === normalizedEmail
    );

    // Sem cadastro correspondente => menor privilégio possível.
    const userRole = registered && this.isValidRole(registered.role) ? registered.role : "client";

    const user = {
      id: registered ? registered.id : "usr-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now()),
      email: normalizedEmail,
      name: registered ? registered.name : normalizedEmail.split("@")[0],
      role: userRole,
      storeId: registered ? registered.storeId || null : null,
      // Reflete apenas o que o provedor de identidade já confirmou.
      mfaEnabled: registered ? !!registered.mfaEnabled : false,
      authProvider,
      lastLogin: new Date().toISOString()
    };

    this.set(STORAGE_KEYS.CURRENT_USER, user);
    this.addAuditLog("LOGIN_SUCCESS", normalizedEmail, `Login confirmado via ${authProvider} [Papel: ${userRole.toUpperCase()}].`);
    return user;
  }

  saveUser(userData) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (idx > -1) {
      users[idx] = { ...users[idx], ...userData };
    } else {
      users.push(userData);
    }
    this.set(STORAGE_KEYS.USERS, users);
    return userData;
  }

  logout() {
    const user = this.getUser();
    if (user) {
      this.addAuditLog("LOGOUT", user.email, "Sessão encerrada pelo usuário.");
    }
    this.set(STORAGE_KEYS.CURRENT_USER, null);
    // Encerra a sessão no Firebase Auth (assíncrono, não bloqueia a UI)
    if (typeof FirebaseBridge !== "undefined" && FirebaseBridge.auth) {
      FirebaseBridge.auth.signOut().catch(e => console.warn("Firebase signOut:", e));
    }
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

    // Montado via DOM e textContent, nunca innerHTML: título e mensagem vêm
    // de dados do usuário (nome de cadastro, nome de loja, e-mail, alvo de
    // denúncia) e concatená-los em HTML permitia XSS em toda notificação.
    const iconEl = document.createElement("div");
    iconEl.className = "toast-icon";
    iconEl.textContent = icon;

    const contentEl = document.createElement("div");
    contentEl.className = "toast-content";

    if (title) {
      const titleEl = document.createElement("div");
      titleEl.className = "toast-title";
      titleEl.textContent = title;
      contentEl.appendChild(titleEl);
    }

    const msgEl = document.createElement("p");
    msgEl.className = "toast-message";
    msgEl.textContent = message;
    contentEl.appendChild(msgEl);

    const closeBtn = document.createElement("button");
    closeBtn.className = "toast-close";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => toast.remove());

    toast.appendChild(iconEl);
    toast.appendChild(contentEl);
    toast.appendChild(closeBtn);

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
