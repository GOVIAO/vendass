/**
 * VENDENDO SOLUÇÕES — DASHBOARDS ENGINE
 * Seller (Lojista), Partner (Parceiro), and Admin Portals
 */

const Dashboards = {
  activeSellerTab: "catalog",
  activePartnerTab: "logistics",
  activeAdminTab: "approvals",

  /* ------------------------------------------------------------------------
     Seller Portal (Lojista)
     ------------------------------------------------------------------------ */
  renderSellerDashboard() {
    const user = store.getUser() || {};
    const storeId = user.storeId || "store-technova";
    const stores = store.getStores();
    const myStore = stores.find(s => s.id === storeId) || stores[0];

    // Header info
    const nameEl = document.getElementById("seller-store-name");
    const cnpjEl = document.getElementById("seller-store-cnpj");
    if (nameEl) nameEl.textContent = myStore.name;
    if (cnpjEl) cnpjEl.textContent = `CNPJ: ${Formatters.cnpj(myStore.cnpj)}`;

    // Products of this store
    const products = store.getProducts().filter(p => p.storeId === myStore.id);
    const orders = store.getOrders();

    // Calculate metrics
    const totalOrdersCount = orders.length;
    const totalRevenue = products.reduce((acc, p) => acc + (p.price * 3), 18450.00);

    const kpiRev = document.getElementById("seller-kpi-revenue");
    const kpiOrders = document.getElementById("seller-kpi-orders");
    const kpiProds = document.getElementById("seller-kpi-products");
    const kpiRating = document.getElementById("seller-kpi-rating");

    if (kpiRev) kpiRev.textContent = Formatters.currency(totalRevenue);
    if (kpiOrders) kpiOrders.textContent = totalOrdersCount;
    if (kpiProds) kpiProds.textContent = products.length;
    if (kpiRating) kpiRating.textContent = `${myStore.rating} ★ (${myStore.reviewCount})`;

    this.renderSellerProducts(products);
    this.renderSellerOrders(orders, myStore.id);
  },

  renderSellerProducts(products) {
    const tbody = document.getElementById("seller-products-table-body");
    if (!tbody) return;

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem;">Nenhum produto cadastrado ainda. Clique em "Cadastrar Novo" para começar.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <img src="${safeImageUrl(p.image)}" alt="" style="width:40px; height:40px; border-radius:6px; object-fit:cover;" loading="lazy">
            <div>
              <div style="font-weight:600;">${escapeHtml(p.title)}</div>
              <span class="badge ${p.type === 'service' ? 'badge-cyan' : 'badge-primary'}">${p.type === 'service' ? 'Serviço' : 'Produto'}</span>
            </div>
          </div>
        </td>
        <td><strong>${escapeHtml(Formatters.currency(p.price))}</strong></td>
        <td>${p.stock > 0 ? `<span class="badge badge-success">${escapeHtml(p.stock)} un</span>` : `<span class="badge badge-danger">Esgotado</span>`}</td>
        <td>${escapeHtml(p.rating)} ★ (${escapeHtml(p.reviewsCount)})</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="Dashboards.editProduct('${escapeJsArg(p.id)}')">Editar</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="Dashboards.deleteProduct('${escapeJsArg(p.id)}')">Excluir</button>
        </td>
      </tr>
    `).join("");
  },

  renderSellerOrders(orders, storeId) {
    const tbody = document.getElementById("seller-orders-table-body");
    if (!tbody) return;

    tbody.innerHTML = orders.map(ord => {
      const sub = ord.subOrders ? ord.subOrders.find(s => s.storeId === storeId) : null;
      return `
        <tr>
          <td><strong>${ord.id}</strong></td>
          <td>${Formatters.date(ord.date)}</td>
          <td>${ord.customer ? ord.customer.name : "Cliente"}</td>
          <td><span class="badge badge-success">${sub ? sub.status : ord.status}</span></td>
          <td><code style="color:var(--secondary);">${sub ? sub.trackingCode : ord.trackingCode}</code></td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="Dashboards.dispatchOrderModal('${ord.id}')">Despachar</button>
          </td>
        </tr>
      `;
    }).join("");
  },

  openAddProductModal() {
    App.openModal("modal-add-product");
  },

  handleSaveProduct(e) {
    e.preventDefault();
    const user = store.getUser() || {};
    const storeId = user.storeId || "store-technova";

    const title = document.getElementById("prod-form-title").value.trim();
    const type = document.getElementById("prod-form-type").value;
    const category = document.getElementById("prod-form-category").value;
    const price = parseFloat(document.getElementById("prod-form-price").value);
    const originalPrice = parseFloat(document.getElementById("prod-form-orig-price").value) || price;
    const stock = parseInt(document.getElementById("prod-form-stock").value) || 1;
    const image = document.getElementById("prod-form-image").value.trim() || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80";
    const desc = document.getElementById("prod-form-desc").value.trim();

    const newProd = {
      id: "prod-" + Date.now(),
      storeId,
      type,
      title,
      category,
      price,
      originalPrice,
      stock,
      rating: 5.0,
      reviewsCount: 1,
      isFeatured: false,
      isFlashDeal: false,
      image,
      description: desc,
      variations: [],
      specs: {
        "Origem": "Nacional com Garantia Legal CDC",
        "Disponibilidade": "Pronta Entrega"
      },
      shipping: { weightKg: 1, dimensions: "20x20x10cm", estimatedDays: 2 }
    };

    let products = store.getProducts();

    // Verifica se é edição ou criação
    const form = document.getElementById("form-add-product");
    const editingId = form && form._editingId;

    if (editingId) {
      // Modo edição: atualiza produto existente
      const idx = products.findIndex(p => p.id === editingId);
      if (idx > -1) {
        products[idx] = { ...products[idx], title, type, category, price, originalPrice, stock, image, description: desc };
        store.set(STORAGE_KEYS.PRODUCTS, products);
        if (typeof FirebaseBridge !== "undefined" && FirebaseBridge.db) {
          FirebaseBridge.db.collection("products").doc(editingId).update({ title, type, category, price, originalPrice, stock, image, description: desc }).catch(e => console.warn(e));
        }
        store.addAuditLog("PRODUCT_UPDATED", user.email || "lojista", `Item '${title}' atualizado no catálogo.`);
        store.showToast("Item atualizado com sucesso!", "success");
      }
      // Limpa o estado de edição
      if (form) {
        form._editingId = null;
        const submitBtn = form.querySelector("[type=submit]");
        if (submitBtn) submitBtn.textContent = "Cadastrar Item no Catálogo";
      }
    } else {
      // Modo criação
      const newProd = {
        id: "prod-" + Date.now(),
        storeId,
        type,
        title,
        category,
        price,
        originalPrice,
        stock,
        rating: 5.0,
        reviewsCount: 1,
        isFeatured: false,
        isFlashDeal: false,
        image,
        description: desc,
        variations: [],
        specs: {
          "Origem": "Nacional com Garantia Legal CDC",
          "Disponibilidade": "Pronta Entrega"
        },
        shipping: { weightKg: 1, dimensions: "20x20x10cm", estimatedDays: 2 }
      };
      products.unshift(newProd);
      store.set(STORAGE_KEYS.PRODUCTS, products);
      if (typeof FirebaseBridge !== "undefined" && FirebaseBridge.db) {
        FirebaseBridge.db.collection("products").doc(newProd.id).set(newProd).catch(e => console.warn(e));
      }
      store.addAuditLog("PRODUCT_CREATED", user.email || "lojista", `Novo item '${title}' cadastrado na loja.`);
      store.showToast("Item cadastrado com sucesso no catálogo!", "success");
    }
    App.closeAllModals();
    this.renderSellerDashboard();
  },

  editProduct(productId) {
    const prods = store.getProducts();
    const p = prods.find(prod => prod.id === productId);
    if (!p) return;

    // Preenche o formulário de cadastro com os dados do produto
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };
    setVal("prod-form-title", p.title);
    setVal("prod-form-type", p.type);
    setVal("prod-form-category", p.category);
    setVal("prod-form-price", p.price);
    setVal("prod-form-orig-price", p.originalPrice || p.price);
    setVal("prod-form-stock", p.stock);
    setVal("prod-form-image", p.image);
    setVal("prod-form-desc", p.description);

    // Altera o botão de submit para atualizar em vez de criar
    const form = document.getElementById("form-add-product");
    if (form) {
      form._editingId = productId;
      const submitBtn = form.querySelector("[type=submit]");
      if (submitBtn) submitBtn.textContent = "Salvar Alterações";
    }

    App.openModal("modal-add-product");
  },

  deleteProduct(productId) {
    if (confirm("Tem certeza que deseja excluir este item do catálogo?")) {
      let prods = store.getProducts().filter(p => p.id !== productId);
      store.set(STORAGE_KEYS.PRODUCTS, prods);
      store.showToast("Item removido do catálogo.", "info");
      this.renderSellerDashboard();
    }
  },

  dispatchOrderModal(orderId) {
    const orders = store.getOrders();
    const ord = orders.find(o => o.id === orderId);
    if (!ord) return;

    const newCode = "VS" + Math.floor(100000000 + Math.random() * 900000000) + "BR";
    ord.status = "Despachado para Transportadora";
    ord.trackingCode = newCode;
    store.set(STORAGE_KEYS.ORDERS, orders);

    store.addAuditLog("ORDER_DISPATCHED", "Lojista", `Pedido ${orderId} despachado com código ${newCode}`);
    store.showToast(`Pedido ${orderId} despachado! Código gerado: ${newCode}`, "success");
    this.renderSellerDashboard();
  },

  /* ------------------------------------------------------------------------
     Partner Portal (Logística & Tecnologia)
     ------------------------------------------------------------------------ */
  renderPartnerDashboard() {
    const user = store.getUser() || {};
    const titleEl = document.getElementById("partner-company-name");
    if (titleEl) titleEl.textContent = user.name || "Nexus Logística & Cloud";

    this.renderCarrierFleet();
    this.renderApiCredentials();
  },

  renderCarrierFleet() {
    const container = document.getElementById("partner-fleet-list");
    if (!container) return;

    container.innerHTML = INITIAL_DATA.carriers.map(c => `
      <div style="background:var(--bg-surface-elevated); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
        <div>
          <div style="font-weight:700;">${c.name}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary);">Prazo médio: ${c.prazo} • Custo base: ${Formatters.currency(c.preco)}</div>
        </div>
        <span class="badge badge-cyan">${c.badge}</span>
      </div>
    `).join("");
  },

  /* ------------------------------------------------------------------------
     Credenciais de API de parceiro

     Antes: a chave ficava hardcoded no bundle e "regenerava" com
     Math.random() no navegador — sem valor de segurança, pois qualquer
     chave real precisa ser emitida e revogada no servidor.

     Agora o campo é apenas leitura e mostra um placeholder. Chaves de API
     reais devem ser emitidas pelo backend para o parceiro autenticado e
     nunca embarcadas no JavaScript do cliente.
     ---------------------------------------------------------------------- */
  renderApiCredentials() {
    const keyEl = document.getElementById("partner-api-key");
    if (keyEl) keyEl.value = "vs_live_••••••••••••••••••••••••";
  },

  regenerateApiKey() {
    store.showToast(
      "Emissão de chave desativada no cliente. Solicite uma nova chave pelo backend autenticado.",
      "warning",
      "Segurança"
    );
    store.addAuditLog("API_KEY_REQUEST_BLOCKED", "Parceiro", "Tentativa de emissão de chave sem backend.");
  },

  simulateWebhook() {
    const event = "order.payment_confirmed";
    store.addAuditLog("WEBHOOK_SENT", "Parceiro Webhook Dispatcher", `Evento simulado: ${event} disparado para endpoints registrados.`);
    store.showToast(`Webhook simulado: '${event}' disparado com HTTP 200 OK.`, "info", "Webhook Dispatcher");
  },

  /* ------------------------------------------------------------------------
     Admin Portal (Governança & Moderação)
     ------------------------------------------------------------------------ */
  renderAdminDashboard() {
    this.renderAdminStores();
    this.renderAdminReports();
    this.renderAdminLogs();
  },

  renderAdminStores() {
    const stores = store.getStores();
    const tbody = document.getElementById("admin-stores-table-body");
    if (!tbody) return;

    tbody.innerHTML = stores.map(s => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <img src="${safeImageUrl(s.logo)}" alt="" style="width:32px; height:32px; border-radius:6px; object-fit:cover;" loading="lazy">
            <strong>${escapeHtml(s.name)}</strong>
          </div>
        </td>
        <td><code>${escapeHtml(Formatters.cnpj(s.cnpj))}</code></td>
        <td>${escapeHtml(s.category)}</td>
        <td>
          ${s.verified
            ? `<span class="badge badge-success">✓ Aprovada & Verificada</span>`
            : `<span class="badge badge-warning">Aguardando Análise</span>`}
        </td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="Dashboards.toggleStoreVerification('${escapeJsArg(s.id)}')">
            ${s.verified ? "Suspender Loja" : "Aprovar Loja"}
          </button>
        </td>
      </tr>
    `).join("");
  },

  toggleStoreVerification(storeId) {
    let stores = store.getStores();
    const s = stores.find(st => st.id === storeId);
    if (s) {
      s.verified = !s.verified;
      store.set(STORAGE_KEYS.STORES, stores);
      store.addAuditLog("STORE_MODERATION", "Admin Master", `Status da loja '${s.name}' alterado para: ${s.verified ? "Aprovada" : "Suspensa"}`);
      store.showToast(`Loja '${s.name}' ${s.verified ? 'Aprovada e Ativada!' : 'Suspensa preventivamente.'}`, s.verified ? "success" : "warning");
      this.renderAdminStores();
    }
  },

  renderAdminReports() {
    const reports = store.getReports();
    const tbody = document.getElementById("admin-reports-table-body");
    if (!tbody) return;

    // `reportedItem` e `reason` são texto livre enviado por qualquer visitante.
    // Sem escape, uma denúncia contendo HTML executaria no console do admin —
    // XSS armazenado contra um alvo privilegiado.
    tbody.innerHTML = reports.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.id)}</strong></td>
        <td>${escapeHtml(r.date)}</td>
        <td>${escapeHtml(r.reportedItem)} (${escapeHtml(r.reportedType)})</td>
        <td><span class="badge badge-danger">${escapeHtml(r.reason)}</span></td>
        <td><span class="badge badge-warning">${escapeHtml(r.status)}</span></td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="Dashboards.resolveReport('${escapeJsArg(r.id)}')">Resolver</button>
        </td>
      </tr>
    `).join("");
  },

  resolveReport(reportId) {
    let reports = store.getReports();
    const r = reports.find(rep => rep.id === reportId);
    if (r) {
      r.status = "Resolvido e Arquivado";
      store.set(STORAGE_KEYS.REPORTS, reports);
      store.addAuditLog("REPORT_RESOLVED", "Admin Master", `Denúncia ${reportId} avaliada e solucionada.`);
      store.showToast(`Denúncia ${reportId} marcada como resolvida.`, "success");
      this.renderAdminReports();
    }
  },

  renderAdminLogs() {
    const logs = store.getLogs();
    const tbody = document.getElementById("admin-logs-table-body");
    if (!tbody) return;

    // `details` concatena valores de usuário (nome de loja, título de produto,
    // alvo de denúncia), então é um sink de XSS armazenado no console admin.
    tbody.innerHTML = logs.slice(0, 15).map(l => `
      <tr>
        <td><span style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(l.date)}</span></td>
        <td><code style="font-size:0.75rem; color:var(--secondary);">${escapeHtml(l.type)}</code></td>
        <td>${escapeHtml(l.user)}</td>
        <td><small style="color:var(--text-muted);">${escapeHtml(l.ip)}</small></td>
        <td><small>${escapeHtml(l.details)}</small></td>
      </tr>
    `).join("");
  }
};
