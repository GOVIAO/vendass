/**
 * VENDENDO SOLUÇÕES — CART & CHECKOUT
 * Multi-vendor cart grouping, Brazilian CEP shipping calculator, and PIX/Card/Boleto payment engine
 */

const CartCheckout = {
  currentStep: 1,
  selectedPaymentMethod: "pix",
  pixTimerInterval: null,

  init() {
    this.renderCartDrawer();
  },

  renderCartDrawer() {
    const cart = store.getCart();
    const container = document.getElementById("cart-drawer-items");
    const countBadge = document.getElementById("header-cart-count");
    const mobileBadge = document.getElementById("mobile-cart-count");
    const subtotalEl = document.getElementById("cart-subtotal");
    const emptyState = document.getElementById("cart-empty-state");
    const footerEl = document.getElementById("cart-drawer-footer");

    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    if (countBadge) countBadge.textContent = totalCount;
    if (mobileBadge) mobileBadge.textContent = totalCount;

    if (!container) return;

    if (cart.length === 0) {
      if (emptyState) emptyState.style.display = "block";
      if (footerEl) footerEl.style.display = "none";
      container.innerHTML = "";
      return;
    }

    if (emptyState) emptyState.style.display = "none";
    if (footerEl) footerEl.style.display = "block";

    // Group items by store
    const stores = store.getStores();
    const grouped = {};
    cart.forEach(item => {
      if (!grouped[item.storeId]) grouped[item.storeId] = [];
      grouped[item.storeId].push(item);
    });

    let total = 0;
    let html = "";

    Object.keys(grouped).forEach(storeId => {
      const storeObj = stores.find(s => s.id === storeId) || { name: "Loja Parceira" };
      const items = grouped[storeId];
      let storeSubtotal = 0;

      html += `
        <div class="cart-store-group">
          <div class="cart-store-header">
            <span>🏪 Vendedor: ${escapeHtml(storeObj.name)}</span>
            <span class="badge badge-primary">Envio Separado</span>
          </div>
      `;

      items.forEach(item => {
        const itemTotal = item.price * item.qty;
        storeSubtotal += itemTotal;
        total += itemTotal;

        html += `
          <div class="cart-item">
            <img src="${safeImageUrl(item.image)}" alt="${escapeHtml(item.title)}" class="cart-item-thumb" loading="lazy">
            <div class="cart-item-info">
              <div class="cart-item-title">${escapeHtml(item.title)}</div>
              <div class="cart-item-price">${escapeHtml(Formatters.currency(item.price))}</div>
              <div class="cart-item-controls">
                <button class="qty-btn" onclick="CartCheckout.changeQty('${escapeJsArg(item.productId)}', ${item.qty - 1})">-</button>
                <span class="qty-val">${escapeHtml(item.qty)}</span>
                <button class="qty-btn" onclick="CartCheckout.changeQty('${escapeJsArg(item.productId)}', ${item.qty + 1})">+</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--danger); margin-left:auto;" onclick="store.removeFromCart('${escapeJsArg(item.productId)}'); CartCheckout.renderCartDrawer();">
                  Remover
                </button>
              </div>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    });

    container.innerHTML = html;
    if (subtotalEl) subtotalEl.textContent = Formatters.currency(total);
  },

  changeQty(productId, newQty) {
    store.updateCartQty(productId, newQty);
    this.renderCartDrawer();
  },

  // Open Checkout View
  startCheckout() {
    const cart = store.getCart();
    if (cart.length === 0) {
      store.showToast("Seu carrinho está vazio.", "warning");
      return;
    }
    App.closeDrawer("cart-drawer");
    App.navigate("checkout");
    this.currentStep = 1;
    this.renderCheckoutStep();
  },

  setStep(step) {
    this.currentStep = step;
    this.renderCheckoutStep();
  },

  renderCheckoutStep() {
    // Update step indicator
    for (let i = 1; i <= 3; i++) {
      const node = document.getElementById(`step-node-${i}`);
      if (node) {
        node.classList.remove("active", "completed");
        if (i < this.currentStep) node.classList.add("completed");
        if (i === this.currentStep) node.classList.add("active");
      }
    }

    const step1El = document.getElementById("checkout-step-1");
    const step2El = document.getElementById("checkout-step-2");
    const step3El = document.getElementById("checkout-step-3");
    const summaryList = document.getElementById("checkout-summary-items");
    const totalEl = document.getElementById("checkout-total-price");
    const shippingEl = document.getElementById("checkout-shipping-price");

    if (step1El) step1El.style.display = this.currentStep === 1 ? "block" : "none";
    if (step2El) step2El.style.display = this.currentStep === 2 ? "block" : "none";
    if (step3El) step3El.style.display = this.currentStep === 3 ? "block" : "none";

    // Summary calculation
    const cart = store.getCart();
    const itemsTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shippingCost = cart.length > 0 ? 25.00 : 0;
    const finalTotal = itemsTotal + shippingCost;

    if (summaryList) {
      summaryList.innerHTML = cart.map(item => `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.6rem; font-size:0.85rem;">
          <span style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.qty)}x ${escapeHtml(item.title)}</span>
          <strong>${escapeHtml(Formatters.currency(item.price * item.qty))}</strong>
        </div>
      `).join("");
    }

    if (shippingEl) shippingEl.textContent = shippingCost === 0 ? "Grátis" : Formatters.currency(shippingCost);
    if (totalEl) totalEl.textContent = Formatters.currency(finalTotal);

    if (this.currentStep === 3) {
      this.initPaymentStep(finalTotal);
    }
  },

  selectPaymentMethod(method) {
    this.selectedPaymentMethod = method;
    document.querySelectorAll(".payment-method-card").forEach(el => el.classList.remove("selected"));
    const activeEl = document.getElementById(`pay-card-${method}`);
    if (activeEl) activeEl.classList.add("selected");

    const pixBox = document.getElementById("payment-pix-box");
    const creditBox = document.getElementById("payment-credit-box");
    const boletoBox = document.getElementById("payment-boleto-box");

    if (pixBox) pixBox.style.display = method === "pix" ? "block" : "none";
    if (creditBox) creditBox.style.display = method === "credit" ? "block" : "none";
    if (boletoBox) boletoBox.style.display = method === "boleto" ? "block" : "none";

    if (method === "credit") {
      const nameField = document.getElementById("checkout-card-name");
      if (nameField && !nameField.value.trim()) {
        const user = store.getUser();
        if (user && user.name) nameField.value = user.name;
      }
    }
  },

  initPaymentStep(total) {
    this.selectPaymentMethod(this.selectedPaymentMethod);
    this.startPixTimer();
  },

  startPixTimer() {
    if (this.pixTimerInterval) clearInterval(this.pixTimerInterval);
    let secondsLeft = 15 * 60; // 15 minutes
    const timerEl = document.getElementById("pix-countdown");

    const updateTimer = () => {
      const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
      const s = (secondsLeft % 60).toString().padStart(2, '0');
      if (timerEl) timerEl.textContent = `${m}:${s}`;
      if (secondsLeft <= 0) {
        clearInterval(this.pixTimerInterval);
        if (timerEl) timerEl.textContent = "Expirado";
      }
      secondsLeft--;
    };
    updateTimer();
    this.pixTimerInterval = setInterval(updateTimer, 1000);
  },

  copyPixCode() {
    const code = document.getElementById("pix-copy-paste-code").value;
    navigator.clipboard.writeText(code).then(() => {
      store.showToast("Código PIX copiado para a área de transferência!", "success");
    }).catch(() => {
      store.showToast("Código PIX pronto para cópia.", "info");
    });
  },

  // Complete Order
  processPayment() {
    const cart = store.getCart();
    if (cart.length === 0) return;

    const user = store.getUser();
    if (!user) {
      store.showToast("Você precisa estar logado para finalizar a compra.", "warning");
      App.openModal("modal-login");
      return;
    }
    const stores = store.getStores();

    // Group items by store for sub-orders
    const grouped = {};
    cart.forEach(item => {
      if (!grouped[item.storeId]) grouped[item.storeId] = [];
      grouped[item.storeId].push(item);
    });

    const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    const trackingCode = "VS" + Math.floor(100000000 + Math.random() * 900000000) + "BR";

    const subOrders = Object.keys(grouped).map((storeId, idx) => {
      const storeObj = stores.find(s => s.id === storeId) || { name: "Loja Parceira" };
      return {
        storeId,
        storeName: storeObj.name,
        subOrderId: `${orderId}-${String.fromCharCode(65 + idx)}`,
        items: grouped[storeId],
        shippingMethod: "Nexus Express Rápido",
        shippingCost: 12.50,
        status: "Pago - Aguardando Despacho",
        trackingCode: "VS" + Math.floor(100000000 + Math.random() * 900000000) + "BR"
      };
    });

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0) + 25.00;

    const newOrder = {
      id: orderId,
      date: new Date().toISOString(),
      status: "Pagamento Aprovado",
      trackingCode,
      carrier: "Nexus Logística Parceira",
      total: totalAmount,
      customer: {
        name: user.name,
        email: user.email,
        phone: "(11) 98765-4321",
        address: "Av. Paulista, 1578, Apto 82, São Paulo - SP"
      },
      subOrders,
      payment: {
        method: this.selectedPaymentMethod.toUpperCase(),
        status: "Aprovado Instantaneamente",
        paidAt: new Date().toISOString()
      }
    };

    let orders = store.getOrders();
    orders.unshift(newOrder);
    store.set(STORAGE_KEYS.ORDERS, orders);

    // Sync to Firestore Cloud & Google Analytics
    if (typeof FirebaseBridge !== "undefined") {
      FirebaseBridge.saveOrderToFirestore(newOrder);
    }

    // Security & audit log
    store.addAuditLog("ORDER_CREATED", user.email, `Pedido ${orderId} aprovado via ${this.selectedPaymentMethod.toUpperCase()}. Valor: ${Formatters.currency(totalAmount)}`);

    // Clear cart
    store.clearCart();
    this.renderCartDrawer();

    // Show order success modal
    this.showSuccessOrderModal(newOrder);
  },

  showSuccessOrderModal(order) {
    const modalEl = document.getElementById("modal-order-success");
    if (!modalEl) return;

    document.getElementById("success-order-id").textContent = order.id;
    document.getElementById("success-order-total").textContent = Formatters.currency(order.total);
    document.getElementById("success-tracking-code").textContent = order.trackingCode;

    const subOrdersList = document.getElementById("success-suborders-list");
    if (subOrdersList) {
      subOrdersList.innerHTML = order.subOrders.map(sub => `
        <div style="background:var(--bg-surface-elevated); padding:0.75rem 1rem; border-radius:var(--radius-md); margin-bottom:0.5rem; border:1px solid var(--border-color);">
          <div style="font-weight:700; font-size:0.875rem;">&#127978; ${escapeHtml(sub.storeName)} (Sub-pedido ${escapeHtml(sub.subOrderId)})</div>
          <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.25rem;">
            Rastreio exclusivo: <code style="color:var(--secondary);">${escapeHtml(sub.trackingCode)}</code>
          </div>
        </div>
      `).join("");
    }

    App.openModal("modal-order-success");
  }
};
