/**
 * VENDENDO SOLUÇÕES — AUTHENTICATION & SECURITY
 * Secure login simulation, registration flows, 2FA, rate limiting, and role management
 */

const Auth = {
  failedAttempts: {},

  // Validation helpers
  showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return false;
    input.classList.add("input-error");
    input.setAttribute("aria-invalid", "true");
    
    // Remove existing error message
    const existingError = input.parentNode.querySelector(".field-error");
    if (existingError) existingError.remove();
    
    // Add error message
    const errorEl = document.createElement("div");
    errorEl.className = "field-error";
    errorEl.textContent = message;
    input.parentNode.appendChild(errorEl);
    return true;
  },

  clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.remove("input-error");
    input.removeAttribute("aria-invalid");
    const existingError = input.parentNode.querySelector(".field-error");
    if (existingError) existingError.remove();
  },

  clearAllErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
    form.querySelectorAll(".field-error").forEach(el => el.remove());
    form.querySelectorAll("[aria-invalid]").forEach(el => el.removeAttribute("aria-invalid"));
  },

  validateRequired(fields) {
    let valid = true;
    fields.forEach(({ id, label, validator }) => {
      const input = document.getElementById(id);
      if (!input) return;
      const value = input.value.trim();
      
      if (!value) {
        this.showFieldError(id, `${label} é obrigatório`);
        valid = false;
      } else if (validator && !validator(value)) {
        this.showFieldError(id, `${label} inválido`);
        valid = false;
      } else {
        this.clearFieldError(id);
      }
    });
    return valid;
  },

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Client registration form
    const clientForm = document.getElementById("form-register-client");
    if (clientForm) {
      clientForm.addEventListener("submit", (e) => this.handleClientRegister(e));
    }

    // Merchant registration form
    const merchantForm = document.getElementById("form-register-merchant");
    if (merchantForm) {
      merchantForm.addEventListener("submit", (e) => this.handleMerchantRegister(e));
    }

    // Partner registration form
    const partnerForm = document.getElementById("form-register-partner");
    if (partnerForm) {
      partnerForm.addEventListener("submit", (e) => this.handlePartnerRegister(e));
    }

    // Login form
    const loginForm = document.getElementById("form-login");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }
  },

  handleLogin(e) {
    e.preventDefault();
    this.clearAllErrors("form-login");

    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const pass = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error-msg");

    if (errorEl) errorEl.style.display = "none";

    // Validate required fields
    if (!email) {
      this.showFieldError("login-email", "E-mail é obrigatório");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      this.showFieldError("login-email", "E-mail inválido");
      return;
    }
    this.clearFieldError("login-email");

    if (!pass) {
      this.showFieldError("login-password", "Senha é obrigatória");
      return;
    }
    this.clearFieldError("login-password");

    // Brute force defense
    const attempts = this.failedAttempts[email] || 0;
    if (attempts >= 5) {
      const waitMinutes = 15;
      const msg = `Conta bloqueada preventivamente após 5 tentativas inválidas. Aguarde ${waitMinutes} minutos.`;
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.style.display = "block";
      }
      store.addAuditLog("SECURITY_LOCKOUT", email, "Bloqueio automático por múltiplas tentativas incorretas.");
      store.showToast(msg, "error");
      return;
    }

    if (pass.length < 6) {
      this.failedAttempts[email] = attempts + 1;
      const left = 5 - (attempts + 1);
      const msg = `Senha inválida. Tentativas restantes antes do bloqueio: ${left}`;
      this.showFieldError("login-password", msg);
      store.addAuditLog("LOGIN_FAILED", email, `Senha incorreta informada (Tentativa ${attempts + 1}/5).`);
      return;
    }

    // Reset attempts on valid check
    this.failedAttempts[email] = 0;
    this.clearFieldError("login-password");

    // Check if user exists and determine if 2FA is required
    const users = store.getUsers ? store.getUsers() : [];
    const existingUser = users.find(u => u.email === email);
    const isAdmin = existingUser && existingUser.role === "admin";
    const requires2FA = isAdmin || true;
    
    if (requires2FA) {
      this.show2FAModal(email, () => {
        store.loginUser(email, pass);
        App.closeAllModals();
        store.showToast(isAdmin ? "Login de administrador autenticado com 2FA!" : "Login autenticado com sucesso via 2FA!", "success", "Bem-vindo(a)!");
        App.updateNavUser();
        App.navigate(isAdmin ? "dashboard-admin" : "home");
      });
      return;
    }
  },

  show2FAModal(email, onVerified) {
    App.openModal("modal-2fa");
    const emailHint = document.getElementById("2fa-email-hint");
    if (emailHint) emailHint.textContent = email;

    const btnVerify = document.getElementById("btn-verify-2fa");
    if (btnVerify) {
      btnVerify.onclick = () => {
        const code = document.getElementById("2fa-code-input").value.trim();
        if (code.length === 6) {
          onVerified();
        } else {
          store.showToast("Digite o código de 6 dígitos enviado por e-mail/SMS (ex: 123456)", "warning");
        }
      };
    }
  },

  handleClientRegister(e) {
    e.preventDefault();
    this.clearAllErrors("form-register-client");

    const fields = [
      { id: "reg-name", label: "Nome Completo" },
      { id: "reg-email", label: "E-mail", validator: v => v.includes("@") && v.includes(".") },
      { id: "reg-cpf", label: "CPF", validator: v => v.replace(/\D/g, "").length === 11 },
      { id: "reg-password", label: "Senha", validator: v => v.length >= 8 },
      { id: "reg-terms", label: "Termos", validator: v => document.getElementById("reg-terms").checked }
    ];

    if (!this.validateRequired(fields)) {
      store.showToast("Preencha todos os campos obrigatórios corretamente", "warning");
      return;
    }

    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const cpf = document.getElementById("reg-cpf").value.trim();
    const phone = document.getElementById("reg-phone").value.trim();
    const cep = document.getElementById("reg-cep").value.trim();
    const password = document.getElementById("reg-password").value;

    const newUser = {
      id: "usr-" + Date.now(),
      name,
      email,
      cpf,
      phone,
      cep,
      role: "client",
      storeId: null,
      mfaEnabled: true,
      registeredAt: new Date().toISOString()
    };

    store.set(STORAGE_KEYS.CURRENT_USER, newUser);
    store.addAuditLog("USER_REGISTER", email, "Novo cliente cadastrado com aceite expresso de Termos e LGPD.");
    store.showToast("Conta criada com sucesso! Enviamos a confirmação para seu e-mail.", "success", `Olá, ${name.split(" ")[0]}!`);
    App.closeAllModals();
    App.updateNavUser();
    App.navigate("home");
  },

  handleMerchantRegister(e) {
    e.preventDefault();
    this.clearAllErrors("form-register-merchant");

    const fields = [
      { id: "mreg-legal-name", label: "Razão Social" },
      { id: "mreg-trade-name", label: "Nome Fantasia" },
      { id: "mreg-cnpj", label: "CNPJ", validator: v => v.replace(/\D/g, "").length === 14 },
      { id: "mreg-email", label: "E-mail", validator: v => v.includes("@") && v.includes(".") },
      { id: "mreg-category", label: "Categoria" },
      { id: "mreg-terms", label: "Termos", validator: v => document.getElementById("mreg-terms").checked }
    ];

    if (!this.validateRequired(fields)) {
      store.showToast("Preencha todos os campos obrigatórios corretamente", "warning");
      return;
    }

    const legalName = document.getElementById("mreg-legal-name").value.trim();
    const tradeName = document.getElementById("mreg-trade-name").value.trim();
    const cnpj = document.getElementById("mreg-cnpj").value.trim();
    const email = document.getElementById("mreg-email").value.trim().toLowerCase();
    const category = document.getElementById("mreg-category").value;

    // Create store
    const storeId = "store-" + tradeName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random()*100);
    const newStore = {
      id: storeId,
      name: tradeName,
      legalName,
      cnpj,
      category,
      rating: 5.0,
      reviewCount: 0,
      verified: true,
      city: "São Paulo",
      state: "SP",
      responseTime: "< 1 hora",
      logo: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=150&auto=format&fit=crop&q=80",
      banner: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&auto=format&fit=crop&q=80",
      description: `Loja oficial de ${tradeName}. Produtos e soluções de alta qualidade com nota fiscal e garantia integral.`,
      policies: "Trocas e devoluções em até 7 dias corridos (CDC Art. 49). Garantia legal de 90 dias."
    };

    let stores = store.getStores();
    stores.push(newStore);
    store.set(STORAGE_KEYS.STORES, stores);

    if (typeof FirebaseBridge !== "undefined") {
      FirebaseBridge.saveStoreToFirestore(newStore);
    }

    const newUser = {
      id: "usr-" + Date.now(),
      name: tradeName,
      email,
      role: "lojista",
      storeId: storeId,
      mfaEnabled: true,
      registeredAt: new Date().toISOString()
    };

    store.set(STORAGE_KEYS.CURRENT_USER, newUser);
    store.addAuditLog("MERCHANT_REGISTER", email, `Nova loja registrada: '${tradeName}' (CNPJ: ${cnpj}).`);
    store.showToast("Loja criada com sucesso! Seu painel de vendas já está disponível.", "success", "Parabéns, Lojista!");
    App.closeAllModals();
    App.updateNavUser();
    App.navigate("dashboard-seller");
  },

  handlePartnerRegister(e) {
    e.preventDefault();
    this.clearAllErrors("form-register-partner");

    const fields = [
      { id: "preg-company", label: "Empresa" },
      { id: "preg-type", label: "Tipo de Parceria" },
      { id: "preg-email", label: "E-mail", validator: v => v.includes("@") && v.includes(".") }
    ];

    if (!this.validateRequired(fields)) {
      store.showToast("Preencha todos os campos obrigatórios corretamente", "warning");
      return;
    }

    const company = document.getElementById("preg-company").value.trim();
    const type = document.getElementById("preg-type").value;
    const email = document.getElementById("preg-email").value.trim().toLowerCase();

    const newUser = {
      id: "usr-" + Date.now(),
      name: company,
      email,
      role: "partner",
      partnerType: type,
      mfaEnabled: true,
      registeredAt: new Date().toISOString()
    };

    store.set(STORAGE_KEYS.CURRENT_USER, newUser);
    store.addAuditLog("PARTNER_REGISTER", email, `Novo parceiro credenciado: '${company}' [Tipo: ${type}].`);
    store.showToast("Credenciamento de parceiro concluído! Acesso liberado ao portal de APIs e Logística.", "success");
    App.closeAllModals();
    App.updateNavUser();
    App.navigate("dashboard-partner");
  },

  // Password Recovery Flow
  recoverPassword(email) {
    if (!email || !email.includes("@")) {
      store.showToast("Informe um e-mail válido para redefinição.", "warning");
      return;
    }
    store.addAuditLog("PASSWORD_RECOVERY_REQUEST", email, "Solicitação de token seguro para redefinição de senha.");
    store.showToast(`Link de recuperação temporário enviado para ${email}. Verifique sua caixa de entrada.`, "success", "Recuperação de Senha");
  }
};
