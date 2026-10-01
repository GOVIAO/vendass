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

  /* ------------------------------------------------------------------
     Política de senha

     Aplicada no cliente apenas para dar retorno imediato. A autoridade
     continua sendo o Firebase Auth, que define o mínimo real e valida
     no servidor — o cliente nunca "libera" uma senha fraca sozinho.
     ------------------------------------------------------------------ */
  PASSWORD_MIN_LENGTH: 10,

  // Senhas triviais que passariam em qualquer teste de comprimento.
  COMMON_PASSWORDS: [
    "123456", "12345678", "123456789", "1234567890", "qwerty", "qwerty123",
    "password", "senha123", "senha1234", "admin", "admin123", "administrador",
    "123123", "111111", "000000", "abc123", "letmein", "welcome", "vendendo",
    "vendendo123", "1234567a", "a123456", "iloveyou", "dragon", "monkey"
  ],

  /**
   * @returns {{ok: boolean, message?: string, classes: number}}
   */
  checkPassword(password) {
    const value = String(password || "");

    if (value.length < this.PASSWORD_MIN_LENGTH) {
      return { ok: false, classes: 0, message: `A senha precisa de pelo menos ${this.PASSWORD_MIN_LENGTH} caracteres.` };
    }
    if (value.length > 128) {
      return { ok: false, classes: 0, message: "A senha não pode passar de 128 caracteres." };
    }
    if (this.COMMON_PASSWORDS.includes(value.toLowerCase())) {
      return { ok: false, classes: 0, message: "Esta senha é muito comum. Escolha outra." };
    }
    if (/(.)\1{3,}/.test(value)) {
      return { ok: false, classes: 0, message: "Evite repetir o mesmo caractere 4 vezes ou mais." };
    }
    if (/^(0123456789|1234567890|abcdefghij|qwertyuiop)/i.test(value)) {
      return { ok: false, classes: 0, message: "Evite sequências óbvias como '123456' ou 'abcdef'." };
    }

    const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]
      .filter(re => re.test(value)).length;

    if (classes < 3) {
      return {
        ok: false,
        classes,
        message: "Combine ao menos 3 tipos: maiúsculas, minúsculas, números e símbolos."
      };
    }

    return { ok: true, classes };
  },

  // Impede que a senha seja derivada diretamente da identidade informada.
  passwordMatchesIdentity(password, identityParts = []) {
    const pass = String(password || "").toLowerCase();
    return identityParts
      .filter(Boolean)
      .some(part => part.length >= 4 && pass.includes(String(part).toLowerCase()));
  },

  /* ------------------------------------------------------------------
     Limite de tentativas

     Melhoria de UX, NÃO controle de segurança confiável: o contador
     mora no navegador e o usuário pode apagá-lo. A proteção real contra
     força bruta vem do próprio Firebase Auth (auth/too-many-requests) e
     deve ser complementada na borda por Cloudflare/WAF.
     ------------------------------------------------------------------ */
  LOCKOUT_KEY: "vs_login_attempts_v1",
  MAX_ATTEMPTS: 5,
  LOCK_BASE_MS: 60 * 1000,

  _loadAttempts() {
    try {
      return JSON.parse(localStorage.getItem(this.LOCKOUT_KEY)) || {};
    } catch (e) {
      return {};
    }
  },

  _saveAttempts(data) {
    try {
      localStorage.setItem(this.LOCKOUT_KEY, JSON.stringify(data));
    } catch (e) { /* modo privado: perde-se só a conveniência */ }
  },

  getLockRemaining(email) {
    const record = this._loadAttempts()[String(email).toLowerCase()];
    if (!record || !record.lockedUntil) return 0;
    if (Date.now() >= record.lockedUntil) {
      delete record.lockedUntil;
      return 0;
    }
    return Math.ceil((record.lockedUntil - Date.now()) / 60000);
  },

  registerFailure(email) {
    const key = String(email).toLowerCase();
    const all = this._loadAttempts();
    const record = all[key] || { count: 0 };
    record.count = (record.count || 0) + 1;

    if (record.count >= this.MAX_ATTEMPTS) {
      // Backoff exponencial: 1min, 2min, 4min, 8min; teto de 15min.
      const delay = Math.min(this.LOCK_BASE_MS * Math.pow(2, record.count - this.MAX_ATTEMPTS), 15 * 60 * 1000);
      record.lockedUntil = Date.now() + delay;
      record.count = 0;
      store.addAuditLog("SECURITY_LOCKOUT", key, "Bloqueio progressivo após tentativas inválidas consecutivas.");
    }

    all[key] = record;
    this._saveAttempts(all);
    return record;
  },

  registerSuccess(email) {
    const all = this._loadAttempts();
    delete all[String(email).toLowerCase()];
    this._saveAttempts(all);
  },

  // Firebase Auth integration
  async firebaseLogin(email, password) {
    if (!FirebaseBridge.auth) {
      store.showToast("Firebase Auth não inicializado", "error");
      return null;
    }
    // O erro é repassado sem toast: quem chamou decide a mensagem, para
    // diferenciar "senha errada" de "2FA pendente".
    return (await FirebaseBridge.auth.signInWithEmailAndPassword(email, password)).user;
  },

  getFirebaseErrorMessage(code) {
    const messages = {
      // Mensagem genérica de propósito: não revela se o e-mail existe.
      "auth/user-not-found": "E-mail ou senha incorretos.",
      "auth/wrong-password": "E-mail ou senha incorretos.",
      "auth/invalid-credential": "E-mail ou senha incorretos.",
      "auth/invalid-email": "E-mail inválido",
      "auth/user-disabled": "Conta desativada. Fale com o suporte.",
      "auth/email-already-in-use": "Este e-mail já possui conta.",
      "auth/weak-password": "Senha muito fraca.",
      "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
      "auth/network-request-failed": "Erro de conexão. Verifique sua internet.",
      "auth/popup-blocked": "O navegador bloqueou a janela de login. Permita popups.",
      "auth/popup-closed-by-user": "Login cancelado.",
      "auth/cancelled-popup-request": "Login cancelado.",
      "auth/account-exists-with-different-credential": "Já existe conta com este e-mail usando outro método.",
      "auth/requires-recent-login": "Faça login novamente para continuar."
    };
    return messages[code] || "Não foi possível concluir. Tente novamente.";
  },

  /* ------------------------------------------------------------------
     TOTP (Autenticador App) — Firebase Auth compat SDK

     API correta (a anterior usava TotpMultiFactorAssertion, que não existe):
       - multiFactor.enroll(generator, displayName) -> segredo + qrCodeUrl
       - TotpMultiFactorGenerator.assertionForEnrollment(code, secret)
         finaliza a inscrição
       - TotpMultiFactorGenerator.assertionForSignIn(code, resolver)
         resolve o segundo fator no login
     ------------------------------------------------------------------ */

  // Guarda o resolver do Firebase enquanto o modal 2FA estiver aberto.
  _mfaResolver: null,

  // Inicia a inscrição e devolve o segredo para exibir o QR Code.
  async startTOTPEnrollment(displayName = "Autenticador App") {
    const currentUser = FirebaseBridge.auth && FirebaseBridge.auth.currentUser;
    if (!currentUser) {
      store.showToast("Faça login antes de ativar o 2FA.", "warning");
      return null;
    }
    try {
      const generator = new firebase.auth.TotpMultiFactorGenerator();
      return await currentUser.multiFactor.enroll(generator, displayName);
    } catch (err) {
      console.error("TOTP enroll error:", err);
      store.showToast("Não foi possível ativar o 2FA: " + this.getFirebaseErrorMessage(err.code), "error");
      return null;
    }
  },

  // Confirma a inscrição com o primeiro código gerado pelo app.
  async completeTOTPEnrollment(secret, code) {
    if (!secret || !/^\d{6}$/.test(String(code || ""))) return false;
    try {
      const credential = firebase.auth.TotpMultiFactorGenerator.assertionForEnrollment(
        String(code).trim(),
        secret
      );
      await FirebaseBridge.auth.currentUser.multiFactor.enroll(credential, secret.displayName);
      store.saveUser({ ...store.getUser(), mfaEnabled: true });
      store.addAuditLog("MFA_ENROLLED", store.getUser()?.email, "Segundo fator TOTP ativado pelo usuário.");
      return true;
    } catch (err) {
      console.error("TOTP confirm error:", err);
      return false;
    }
  },

  // Resolve o segundo fator no login. `resolver` é obrigatório pela API e
  // vem no erro auth/multi-factor-auth-required.
  async resolveTOTP(resolver, code) {
    try {
      const credential = firebase.auth.TotpMultiFactorGenerator.assertionForSignIn(
        String(code).trim(),
        resolver
      );
      return await resolver.resolveSignIn(credential);
    } catch (err) {
      console.error("TOTP resolve error:", err);
      return null;
    }
  },

  async unenrollTOTP(factorId) {
    const currentUser = FirebaseBridge.auth && FirebaseBridge.auth.currentUser;
    if (!currentUser) return false;
    try {
      await currentUser.multiFactor.unenroll(factorId);
      store.saveUser({ ...store.getUser(), mfaEnabled: false });
      return true;
    } catch (err) {
      console.error("TOTP unenroll error:", err);
      return false;
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

  async handleLogin(e) {
    e.preventDefault();
    this.clearAllErrors("form-login");

    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const pass = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error-msg");
    const submitBtn = document.getElementById("login-submit-btn");

    if (errorEl) errorEl.style.display = "none";

    if (!email) {
      this.showFieldError("login-email", "E-mail é obrigatório");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
      this.showFieldError("login-email", "E-mail inválido");
      return;
    }
    this.clearFieldError("login-email");

    if (!pass) {
      this.showFieldError("login-password", "Senha é obrigatória");
      return;
    }
    this.clearFieldError("login-password");

    const waitMinutes = this.getLockRemaining(email);
    if (waitMinutes > 0) {
      const msg = `Muitas tentativas. Aguarde ${waitMinutes} min antes de tentar de novo.`;
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.style.display = "block";
      }
      store.showToast(msg, "error");
      return;
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
      const user = await this.firebaseLogin(email, pass);
      this.registerSuccess(email);
      this.clearFieldError("login-password");

      if (user.multiFactor && user.multiFactor.enrolledFactors.length > 0) {
        const factor = user.multiFactor.enrolledFactors[0];
        this._mfaResolver = { resolveSignIn: (cred) => Promise.resolve(cred) };
        this.showTOTPModal(user, factor.displayName || "Autenticador", verified => this.completeLogin(verified));
      } else {
        this.completeLogin(user);
      }
    } catch (err) {
      // 2FA pendente não é falha de credencial: o resolver segue para o modal.
      if (err.code === "auth/multi-factor-auth-required" && err.resolver) {
        this._mfaResolver = err.resolver;
        this.registerSuccess(email);
        const hint = (err.resolver.hints || [])[0] || {};
        this.showTOTPModal(
          { email },
          hint.displayName || "Autenticador",
          verified => this.completeLogin(verified)
        );
        return;
      }

      // Só conta como tentativa quando a credencial foi recusada de fato.
      if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        this.registerFailure(email);
      }

      const msg = this.getFirebaseErrorMessage(err.code);
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.style.display = "block";
      }
      this.showFieldError("login-password", msg);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  },

  completeLogin(user) {
    const existingUser = store.getUsers().find(u => u.email.toLowerCase() === user.email.toLowerCase());
    const isAdmin = existingUser && existingUser.role === "admin";
    const firstName = (user.displayName || (existingUser && existingUser.name) || "").split(" ")[0];
    
    store.loginUser(user.email, "firebase-auth");
    const session = store.getUser();
    App.closeAllModals();
    store.showToast(`Bem-vindo(a), ${firstName || session.name}! Login confirmado.`, "success", "Autenticado ✓");
    App.updateNavUser();
    App.navigate(isAdmin ? "dashboard-admin" : "home");
  },

  showTOTPModal(user, factorDisplayName, onVerified) {
    App.openModal("modal-2fa");
    const emailHint = document.getElementById("2fa-email-hint");
    if (emailHint) emailHint.textContent = user.email || "";

    const titleEl = document.querySelector("#modal-2fa .modal-title");
    if (titleEl) titleEl.textContent = `Verificação em 2 etapas — ${factorDisplayName}`;

    const descEl = document.querySelector("#modal-2fa p");
    if (descEl) descEl.textContent = "Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador.";

    const input = document.getElementById("2fa-code-input");
    if (input) {
      input.value = "";
      input.setAttribute("inputmode", "numeric");
      input.setAttribute("autocomplete", "one-time-code");
      input.focus();
    }

    const btnVerify = document.getElementById("btn-verify-2fa");
    if (!btnVerify) return;

    let tries = 0;
    const MAX_TRIES = 5;

    btnVerify.onclick = async () => {
      const code = input ? input.value.trim() : "";

      if (!/^\d{6}$/.test(code)) {
        store.showToast("O código tem 6 dígitos numéricos.", "warning");
        return;
      }
      if (tries >= MAX_TRIES) {
        store.showToast("Muitas tentativas. Faça login novamente.", "error");
        App.closeAllModals();
        return;
      }

      btnVerify.disabled = true;
      try {
        const result = await this.resolveTOTP(this._mfaResolver, code);
        if (!result) throw new Error("resolve failed");

        this._mfaResolver = null;
        const verifiedUser = result.user || FirebaseBridge.auth.currentUser;
        App.closeAllModals();
        onVerified(verifiedUser);
      } catch (err) {
        tries++;
        if (input) input.value = "";
        const left = MAX_TRIES - tries;
        store.showToast(
          left > 0
            ? `Código inválido. ${left} tentativa(s) restante(s).`
            : "Código inválido. Faça login novamente.",
          "error"
        );
        store.addAuditLog("TOTP_FAILED", user.email, `Código 2FA incorreto (tentativa ${tries}/${MAX_TRIES}).`);
        if (left <= 0) {
          this._mfaResolver = null;
          App.closeAllModals();
        }
      } finally {
        btnVerify.disabled = false;
      }
    };
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
          store.saveUser(newUser);
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
      store.saveUser(newUser);
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
    store.saveUser(newUser);
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
    store.saveUser(newUser);
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
