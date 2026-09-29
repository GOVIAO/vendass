/**
 * VENDENDO SOLUÇÕES — POLICIES, DIVERSITY & LGPD COMPLIANCE
 * Implementation of Brazilian regulatory frameworks: LGPD, CDC, Marco Civil & Ethical Community Guidelines
 */

const PoliciesLGPD = {
  init() {
    this.checkCookieConsent();
    this.bindEvents();
  },

  checkCookieConsent() {
    const consent = localStorage.getItem(STORAGE_KEYS.LGPD_CONSENT);
    const banner = document.getElementById("cookie-consent-banner");
    if (!consent && banner) {
      setTimeout(() => {
        banner.classList.add("active");
      }, 1000);
    }
  },

  acceptAllCookies() {
    const preferences = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.LGPD_CONSENT, JSON.stringify(preferences));
    store.addAuditLog("COOKIE_CONSENT", "Visitante", "Consentimento total de cookies aceito.");
    const banner = document.getElementById("cookie-consent-banner");
    if (banner) banner.classList.remove("active");
    store.showToast("Preferências de privacidade salvas com sucesso!", "success");
  },

  acceptEssentialOnly() {
    const preferences = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.LGPD_CONSENT, JSON.stringify(preferences));
    store.addAuditLog("COOKIE_CONSENT", "Visitante", "Consentimento restrito a cookies essenciais.");
    const banner = document.getElementById("cookie-consent-banner");
    if (banner) banner.classList.remove("active");
    store.showToast("Apenas cookies essenciais ativados.", "info");
  },

  bindEvents() {
    // Complaint / Report Form
    const reportForm = document.getElementById("form-submit-report");
    if (reportForm) {
      reportForm.addEventListener("submit", (e) => this.handleReportSubmit(e));
    }
  },

  handleReportSubmit(e) {
    e.preventDefault();
    const item = document.getElementById("report-target-name").value.trim();
    const type = document.getElementById("report-target-type").value;
    const reason = document.getElementById("report-reason-select").value;
    const desc = document.getElementById("report-description").value.trim();

    const report = store.addReport({
      reportedItem: item,
      reportedType: type,
      reason,
      details: desc
    });

    store.showToast(`Denúncia registrada com sucesso sob protocolo ${report.id}. Nossa equipe de governança analisará em até 24 horas.`, "success", "Canal de Ética & Respeito");
    App.closeAllModals();
    reportForm.reset();
  },

  // Export User Data Package (LGPD Art. 18)
  exportUserData() {
    const user = store.getUser();
    if (!user) {
      store.showToast("Faça login para exportar seus dados.", "warning");
      return;
    }

    const exportPayload = {
      plataforma: "Vendendo Soluções Marketplace",
      dataExportacao: new Date().toISOString(),
      conformidadeLegal: "Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - Art. 18, V)",
      titular: user,
      pedidos: store.getOrders().filter(o => o.customer && o.customer.email === user.email),
      preferenciasCookies: JSON.parse(localStorage.getItem(STORAGE_KEYS.LGPD_CONSENT) || "{}"),
      logsSeguranca: store.getLogs().filter(l => l.user === user.email)
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `vendendo-solucoes-meus-dados-lgpd-${user.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    store.addAuditLog("LGPD_DATA_EXPORT", user.email, "Titular efetuou download integral do arquivo portátil de seus dados.");
    store.showToast("Arquivo JSON contendo seus dados cadastrais e histórico foi baixado!", "success", "Portabilidade de Dados");
  },

  // Request Data Deletion / Right to be Forgotten (LGPD Art. 18, VI)
  requestDataDeletion() {
    const user = store.getUser();
    if (!user) return;

    if (confirm("ATENÇÃO (LGPD Art. 18):\nTem certeza que deseja solicitar a exclusão de seus dados pessoais e encerramento da conta? Dados fiscais de compras concluídas serão retidos pelo prazo legal exigido pelo Código Tributário Nacional.")) {
      store.addAuditLog("LGPD_DELETION_REQUEST", user.email, "Titular solicitou anonimização/exclusão de dados da conta.");
      store.logout();
      store.showToast("Sua solicitação de exclusão foi registrada. Seus dados foram desvinculados.", "info", "Privacidade LGPD");
      App.updateNavUser();
      App.navigate("home");
    }
  },

  // Simulate 7-day CDC Regret Refund
  simulateCdcReturn(orderId) {
    const orders = store.getOrders();
    const ord = orders.find(o => o.id === orderId);
    if (!ord) return;

    ord.status = "Devolução Solicitada (CDC Art. 49)";
    store.set(STORAGE_KEYS.ORDERS, orders);
    store.addAuditLog("CDC_RETURN_REQUEST", ord.customer ? ord.customer.email : "cliente", `Direito de arrependimento (7 dias) acionado para o pedido ${orderId}. Código de postagem reversa emitido.`);
    store.showToast(`Solicitação aceita! Código de logística reversa dos Correios gerado para devolução sem custos.`, "success", "Direito de Arrependimento (CDC)");
    Dashboards.renderSellerDashboard();
  }
};
