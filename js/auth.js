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
    
    const existingError = input.parentNode.querySelector(".field-error");
    if (existingError) existingError.remove();
    
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

  // Firebase Auth integration
  async firebaseLogin(email, password) {
    if (!FirebaseBridge.auth) {
      store.showToast("Firebase Auth não inicializado", "error");
      return null;
    }
    try {
      const result = await FirebaseBridge.auth.signInWithEmailAndPassword(email, password);
      return result.user;
    } catch (err) {
      const msg = this.getFirebaseErrorMessage(err.code);
      store.showToast(msg, "error");
      throw err;
    }
  },

  getFirebaseErrorMessage(code) {
    const messages = {
      "auth/user-not-found": "Usuário não encontrado",
      "auth/wrong-password": "Senha incorreta",
      "auth/invalid-email": "E-mail inválido",
      "auth/user-disabled": "Conta desativada",
      "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde",
      "auth/network-request-failed": "Erro de conexão"
    };
    return messages[code] || "Erro de autenticação";
  },

  // TOTP 2FA Setup (Authenticator App)
  async setupTOTP(user) {
    if (!FirebaseBridge.auth || !user) return null;
    try {
      const multiFactor = user.multiFactor;
      const session = await multiFactor.getSession();
      const totpSecret = await multiFactor.enroll(new firebase.auth.TotpMultiFactorGenerator(), "Authenticator App", session);
      return totpSecret;
    } catch (err) {
      console.error("TOTP setup error:", err);
      return null;
    }
  },

  // Verify TOTP code
  async verifyTOTP(user, code) {
    if (!FirebaseBridge.auth || !user) return false;
    try {
      const multiFactor = user.multiFactor;
      const session = await multiFactor.getSession();
      const credential = firebase.auth.TotpMultiFactorGenerator.assertionForEnrollment(code, session);
      await multiFactor.enroll(credential, "Authenticator App");
      return true;
    } catch (err) {
      console.error("TOTP verify error:", err);
      return false;
    }
  },

  // Sign in with email/password + TOTP
  async signInWithEmailAndTOTP(email, password, totpCode) {
    try {
      const result = await FirebaseBridge.auth.signInWithEmailAndPassword(email, password);
      const user = result.user;
      
      // If user has 2FA enrolled, verify TOTP
      if (user.multiFactor && user.multiFactor.enrolledFactors.length > 0) {
        const multiFactor = user.multiFactor;
        const session = await multiFactor.getSession();
        const credential = firebase.auth.TotpMultiFactorAssertion(code);
        await user.multiFactor.resolveSignIn(credential, session);
      }
      
      return user;
    } catch (err) {
      const msg = this.getFirebaseErrorMessage(err.code);
      store.showToast(msg, "error");
      throw err;
    }
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

    // Use Firebase Auth for real authentication
    this.firebaseLogin(email, pass).then(user => {
      if (!user) return;
      
      // Check if user has 2FA enrolled
      const has2FA = user.multiFactor && user.multiFactor.enrolledFactors.length > 0;
      
      if (has2FA) {
        // Show TOTP verification modal
        this.showTOTPModal(user, () => {
          this.completeLogin(user);
        });
      } else {
        // No 2FA, complete login directly
        this.completeLogin(user);
      }
    }).catch(() => {
      this.failedAttempts[email] = attempts + 1;
    });
  },

  completeLogin(user) {
    const existingUser = store.getUsers ? store.getUsers().find(u => u.email === user.email) : null;
    const isAdmin = existingUser && existingUser.role === "admin";
    
    store.loginUser(user.email, "firebase-auth");
    App.closeAllModals();
    store.showToast(isAdmin ? "Login de administrador autenticado!" : "Login realizado com sucesso!", "success", "Bem-vindo(a)!");
    App.updateNavUser();
    App.navigate(isAdmin ? "dashboard-admin" : "home");
  },

  showTOTPModal(user, onVerified) {
    App.openModal("modal-2fa");
    const emailHint = document.getElementById("2fa-email-hint");
    if (emailHint) emailHint.textContent = user.email;
    
    const titleEl = document.querySelector("#modal-2fa .modal-title");
    if (titleEl) titleEl.textContent = "Autenticação 2FA (Authenticator App)";
    
    const descEl = document.querySelector("#modal-2fa p");
    if (descEl) descEl.innerHTML = `Digite o código de 6 dígitos do seu aplicativo autenticador (Google Authenticator, Authy, Microsoft Authenticator)`;

    const btnVerify = document.getElementById("btn-verify-2fa");
    if (btnVerify) {
      btnVerify.onclick = async () => {
        const code = document.getElementById("2fa-code-input").value.trim();
        if (code.length !== 6) {
          store.showToast("Digite o código de 6 dígitos do autenticador", "warning");
          return;
        }
        
        try {
          const multiFactor = user.multiFactor;
          const session = await multiFactor.getSession();
          const credential = firebase.auth.TotpMultiFactorAssertion(code);
          await user.multiFactor.resolveSignIn(credential, session);
          
          onVerified();
        } catch (err) {
          store.showToast("Código inválido ou expirado", "error");
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

    // Create user in Firebase Auth
    if (FirebaseBridge.auth) {
      FirebaseBridge.auth.createUserWithEmailAndPassword(email, password)
        .then(result => {
          const user = result.user;
          user.updateProfile({ displayName: name });
          
          const newUser = {
            id: "usr-" + user.uid.substring(0, 8),
            firebaseUid: user.uid,
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
        })
        .catch(err => {
          const msg = this.getFirebaseErrorMessage(err.code);
          store.showToast(msg, "error");
        });
    } else {
      // Fallback to local storage if Firebase not available
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
      store.showToast("Conta criada com sucesso! (Modo local)", "success", `Olá, ${name.split(" ")[0]}!`);
      App.closeAllModals();
      App.updateNavUser();
      App.navigate("home");
    }
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
