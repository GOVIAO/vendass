/**
 * VENDENDO SOLUÇÕES — MAIN APPLICATION CONTROLLER
 * Router, UI Events, Search, Theme Switching, Hero Carousel, and Views Rendering
 */

const App = {
  currentView: "home",
  activeCategory: "cat-todos",
  carouselIndex: 0,
  carouselTimer: null,

  init() {
    this.initTheme();
    this.initCarousel();
    this.initSearch();
    this.initFlashCountdown();
    this.updateNavUser();
    this.renderHomeVitrines();
    this.renderCategoryPills();
    this.bindGlobalEvents();

    // Init submodules
    Auth.init();
    CartCheckout.init();
    PoliciesLGPD.init();

    // Check hash for direct route
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      this.navigate(hash);
    }
  },

  /* ------------------------------------------------------------------------
     Theme Toggle
     ------------------------------------------------------------------------ */
  initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.updateThemeIcon(savedTheme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const newTheme = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    this.updateThemeIcon(newTheme);
    store.showToast(`Modo ${newTheme === 'dark' ? 'Escuro' : 'Claro'} ativado.`, "info");
  },

  updateThemeIcon(theme) {
    const btn = document.getElementById("theme-toggle-btn");
    if (btn) {
      btn.innerHTML = theme === "dark" 
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
  },

  /* ------------------------------------------------------------------------
     Navigation & Views
     ------------------------------------------------------------------------ */
  navigate(viewName, params = {}) {
    this.currentView = viewName;
    window.location.hash = viewName;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Hide all view containers
    document.querySelectorAll(".view-container").forEach(el => el.style.display = "none");

    // Show target view container
    const targetEl = document.getElementById(`view-${viewName}`);
    if (targetEl) {
      targetEl.style.display = "block";
      targetEl.classList.add("animate-fade-in");
    }

    // Specific view initializers
    if (viewName === "home") {
      this.renderHomeVitrines();
    } else if (viewName === "storefront") {
      this.renderStorefrontView(params.storeId || "store-technova");
    } else if (viewName === "dashboard-seller") {
      Dashboards.renderSellerDashboard();
    } else if (viewName === "dashboard-partner") {
      Dashboards.renderPartnerDashboard();
    } else if (viewName === "dashboard-admin") {
      Dashboards.renderAdminDashboard();
    } else if (viewName === "my-orders") {
      this.renderMyOrdersView();
    }

    // Update bottom nav active state
    document.querySelectorAll(".mobile-nav-item").forEach(item => {
      item.classList.remove("active");
      if (item.getAttribute("data-view") === viewName) item.classList.add("active");
    });
  },

  updateNavUser() {
    const user = store.getUser();
    const userDisplay = document.getElementById("nav-user-display");
    const roleSelector = document.getElementById("quick-role-selector");
    const dropdownName = document.getElementById("dropdown-user-name");
    const dropdownRole = document.getElementById("dropdown-user-role");
    const userMenu = document.getElementById("user-profile-menu");

    if (userDisplay) {
      if (user) {
        userDisplay.innerHTML = `
          <div class="avatar-circle">${user.name.charAt(0)}</div>
          <div style="display:flex; flex-direction:column; line-height:1.1; text-align:left;">
            <strong style="font-size:0.825rem;">${user.name.split(" ")[0]}</strong>
            <span style="font-size:0.68rem; color:var(--secondary); text-transform:uppercase; font-weight:700;">${user.role}</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:2px;">⌄</svg>
        `;
        if (userMenu) userMenu.style.cursor = "pointer";
        if (dropdownName) dropdownName.textContent = user.name;
        if (dropdownRole) dropdownRole.textContent = user.role.toUpperCase();
      } else {
        userDisplay.innerHTML = `
          <div class="avatar-circle">?</div>
          <span style="font-size:0.85rem; font-weight:600;">Entrar / Cadastrar</span>
        `;
        if (userMenu) {
          userMenu.style.cursor = "pointer";
          userMenu.onclick = () => App.openModal('modal-login');
        }
      }
    }

    if (roleSelector && user) {
      roleSelector.value = user.role;
    }
  },

  handleRoleSwitch(newRole) {
    store.setUserRole(newRole);
    this.updateNavUser();
    store.showToast(`Visualização alternada para o perfil: ${newRole.toUpperCase()}`, "info", "Alternador de Visão");

    if (newRole === "lojista") {
      this.navigate("dashboard-seller");
    } else if (newRole === "partner") {
      this.navigate("dashboard-partner");
    } else if (newRole === "admin") {
      this.navigate("dashboard-admin");
    } else {
      this.navigate("home");
    }
  },

  logout() {
    store.logout();
    store.showToast("Você saiu da sua conta. Até logo!", "success", "Logout");
    this.updateNavUser();
    this.closeAllModals();
    this.closeDrawer("cart-drawer");
    this.navigate("home");
  },

  toggleUserMenu(e) {
    e.stopPropagation();
    const dropdown = document.getElementById("user-dropdown-menu");
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
    }
  },

  closeUserMenu() {
    const dropdown = document.getElementById("user-dropdown-menu");
    if (dropdown) dropdown.style.display = "none";
  },

  /* ------------------------------------------------------------------------
     Hero Carousel
     ------------------------------------------------------------------------ */
  initCarousel() {
    const track = document.getElementById("hero-carousel-track");
    if (!track) return;

    this.carouselTimer = setInterval(() => {
      this.nextSlide();
    }, 7000);
  },

  setSlide(index) {
    this.carouselIndex = index;
    const track = document.getElementById("hero-carousel-track");
    if (track) {
      track.style.transform = `translateX(-${index * 100}%)`;
    }
    document.querySelectorAll(".carousel-dot").forEach((dot, idx) => {
      dot.classList.toggle("active", idx === index);
    });
  },

  nextSlide() {
    const count = 3;
    this.carouselIndex = (this.carouselIndex + 1) % count;
    this.setSlide(this.carouselIndex);
  },

  prevSlide() {
    const count = 3;
    this.carouselIndex = (this.carouselIndex - 1 + count) % count;
    this.setSlide(this.carouselIndex);
  },

  /* ------------------------------------------------------------------------
     Categories & Vitrines Rendering
     ------------------------------------------------------------------------ */
  renderCategoryPills() {
    const container = document.getElementById("category-nav-pills");
    if (!container) return;

    const cats = store.getCategories();
    container.innerHTML = cats.map(cat => `
      <button class="cat-pill ${cat.id === this.activeCategory ? 'active' : ''}" onclick="App.filterCategory('${cat.id}')">
        <span>${cat.name}</span>
      </button>
    `).join("");
  },

  filterCategory(catId) {
    this.activeCategory = catId;
    this.renderCategoryPills();
    this.renderHomeVitrines();

    const targetSection = document.getElementById("section-produtos");
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth" });
    }
  },

  renderHomeVitrines() {
    const products = store.getProducts();
    const stores = store.getStores();

    // Filter products if a category is selected (and not 'cat-todos')
    const filteredProducts = this.activeCategory === "cat-todos" 
      ? products 
      : products.filter(p => p.category === this.activeCategory || p.type === 'product');

    // 1. Featured Products Grid
    const prodContainer = document.getElementById("vitrine-produtos-grid");
    if (prodContainer) {
      prodContainer.innerHTML = filteredProducts.map(p => this.renderProductCard(p)).join("");
    }

    // 2. Stores Showcase
    const storesContainer = document.getElementById("vitrine-lojas-grid");
    if (storesContainer) {
      storesContainer.innerHTML = stores.map(s => this.renderStoreCard(s)).join("");
    }

    // 3. Services Showcase
    const servicesContainer = document.getElementById("vitrine-servicos-grid");
    if (servicesContainer) {
      const services = products.filter(p => p.type === "service");
      servicesContainer.innerHTML = services.map(s => this.renderServiceCard(s)).join("");
    }
  },

  renderProductCard(product) {
    const stores = store.getStores();
    const s = stores.find(storeObj => storeObj.id === product.storeId) || { name: "Loja Parceira" };
    const favs = store.getFavorites();
    const isFav = favs.products.includes(product.id);

    const pixPrice = product.price * 0.95; // 5% off on PIX

    return `
      <div class="product-card" id="card-${product.id}">
        <div class="product-thumb-wrap" onclick="App.openProductModal('${product.id}')">
          <img src="${product.image}" alt="${product.title}" class="product-thumb" loading="lazy">
          ${product.originalPrice > product.price 
            ? `<div class="product-badge-float badge badge-danger">-${Math.round((1 - product.price/product.originalPrice)*100)}%</div>` 
            : `<div class="product-badge-float badge badge-primary">${product.type === 'service' ? 'Serviço' : 'Novo'}</div>`}
          <button class="product-fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); App.toggleFavorite('${product.id}')" title="Favoritar">
            ♥
          </button>
        </div>
        <div class="product-body">
          <div class="product-store-meta" onclick="App.navigate('storefront', { storeId: '${product.storeId}' })" style="cursor:pointer;">
            <span>🏪 ${s.name}</span>
            <span class="verified-icon" title="Loja Verificada">✓</span>
          </div>
          <h3 class="product-title" onclick="App.openProductModal('${product.id}')" title="${product.title}">${product.title}</h3>
          <div class="product-rating">
            <span class="rating-stars">★★★★★</span>
            <span style="font-weight:600;">${product.rating}</span>
            <span style="color:var(--text-muted);">(${product.reviewsCount})</span>
          </div>
          <div class="product-price-block">
            ${product.originalPrice > product.price ? `<div class="price-original">${Formatters.currency(product.originalPrice)}</div>` : ''}
            <div class="price-current">
              <span class="price-value">${Formatters.currency(product.price)}</span>
            </div>
            <div class="price-pix">ou ${Formatters.currency(pixPrice)} à vista no PIX (5% OFF)</div>
          </div>
          <div class="product-actions">
            <button class="btn btn-primary btn-sm" onclick="store.addToCart('${product.id}'); CartCheckout.renderCartDrawer();">
              + Carrinho
            </button>
            <button class="btn btn-outline btn-sm" onclick="App.openProductModal('${product.id}')">
              Detalhes
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderStoreCard(storeObj) {
    const favs = store.getFavorites();
    const isFav = favs.stores.includes(storeObj.id);

    return `
      <div class="store-card" onclick="App.navigate('storefront', { storeId: '${storeObj.id}' })" style="cursor:pointer;">
        <div class="store-cover-wrap">
          <img src="${storeObj.banner}" style="width:100%; height:100%; object-fit:cover; opacity:0.75;">
          <img src="${storeObj.logo}" alt="${storeObj.name}" class="store-logo-avatar">
        </div>
        <div class="store-card-body">
          <div class="store-name-row">
            <div class="store-card-name">${storeObj.name}</div>
            <span class="badge badge-success">✓ Verificada</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.4rem;">
            📍 ${storeObj.city}, ${storeObj.state} • Responde em ${storeObj.responseTime}
          </div>
          <p class="store-card-desc">${storeObj.description}</p>
          <div class="store-tags">
            <span class="badge badge-gray">${storeObj.category}</span>
            <span class="badge badge-primary">★ ${storeObj.rating} (${storeObj.reviewCount} avaliações)</span>
          </div>
          <button class="btn btn-outline btn-sm" style="margin-top:auto;" onclick="event.stopPropagation(); App.navigate('storefront', { storeId: '${storeObj.id}' })">
            Visitar Espaço da Loja →
          </button>
        </div>
      </div>
    `;
  },

  renderServiceCard(service) {
    const stores = store.getStores();
    const s = stores.find(st => st.id === service.storeId) || { name: "Especialista" };

    return `
      <div class="product-card">
        <div class="product-thumb-wrap" onclick="App.openProductModal('${service.id}')">
          <img src="${service.image}" alt="${service.title}" class="product-thumb">
          <div class="product-badge-float badge badge-cyan">Serviço & Consultoria</div>
        </div>
        <div class="product-body">
          <div class="product-store-meta">
            <span>Prestador: ${s.name}</span>
          </div>
          <h3 class="product-title" onclick="App.openProductModal('${service.id}')">${service.title}</h3>
          <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.75rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            ${service.description}
          </p>
          <div class="product-price-block">
            <div class="price-current">
              <span class="price-value">${Formatters.currency(service.price)}</span>
            </div>
            <div class="price-pix">Atendimento com garantia e nota fiscal</div>
          </div>
          <div class="product-actions" style="grid-template-columns:1fr;">
            <button class="btn btn-secondary btn-sm" onclick="store.addToCart('${service.id}'); CartCheckout.renderCartDrawer();">
              Contratar Serviço Online
            </button>
          </div>
        </div>
      </div>
    `;
  },

  toggleFavorite(productId) {
    store.toggleFavoriteProduct(productId);
    this.renderHomeVitrines();
  },

  /* ------------------------------------------------------------------------
     Storefront Individual View
     ------------------------------------------------------------------------ */
  renderStorefrontView(storeId) {
    const stores = store.getStores();
    const s = stores.find(item => item.id === storeId) || stores[0];
    const products = store.getProducts().filter(p => p.storeId === s.id);
    const favs = store.getFavorites();
    const isFav = favs.stores.includes(s.id);

    const bannerEl = document.getElementById("sf-banner");
    const avatarEl = document.getElementById("sf-avatar");
    const nameEl = document.getElementById("sf-name");
    const legalEl = document.getElementById("sf-legal-cnpj");
    const descEl = document.getElementById("sf-desc");
    const favBtn = document.getElementById("sf-btn-fav");
    const prodsGrid = document.getElementById("sf-products-grid");

    if (bannerEl) bannerEl.src = s.banner;
    if (avatarEl) avatarEl.src = s.logo;
    if (nameEl) nameEl.textContent = s.name;
    if (legalEl) legalEl.textContent = `${s.legalName} • CNPJ: ${Formatters.cnpj(s.cnpj)} • ${s.city}/${s.state}`;
    if (descEl) descEl.textContent = s.description;

    if (favBtn) {
      favBtn.innerHTML = isFav ? "★ Loja Salva" : "☆ Favoritar Loja";
      favBtn.onclick = () => {
        store.toggleFavoriteStore(s.id);
        this.renderStorefrontView(s.id);
      };
    }

    if (prodsGrid) {
      prodsGrid.innerHTML = products.length > 0 
        ? products.map(p => this.renderProductCard(p)).join("")
        : `<p style="padding:2rem;">Esta loja ainda não publicou produtos no catálogo.</p>`;
    }
  },

  /* ------------------------------------------------------------------------
     Product Details Modal
     ------------------------------------------------------------------------ */
  openProductModal(productId) {
    const products = store.getProducts();
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    const stores = store.getStores();
    const s = stores.find(st => st.id === p.storeId) || { name: "Loja Parceira" };

    document.getElementById("modal-prod-img").src = p.image;
    document.getElementById("modal-prod-title").textContent = p.title;
    document.getElementById("modal-prod-store").textContent = `Vendido e entregue por: ${s.name}`;
    document.getElementById("modal-prod-price").textContent = Formatters.currency(p.price);
    document.getElementById("modal-prod-desc").textContent = p.description;

    // Technical specifications table
    const specsTable = document.getElementById("modal-prod-specs-body");
    if (specsTable && p.specs) {
      specsTable.innerHTML = Object.entries(p.specs).map(([k, v]) => `
        <tr>
          <td style="font-weight:600; width:40%;">${k}</td>
          <td>${v}</td>
        </tr>
      `).join("");
    }

    // Add to cart action from modal
    const buyBtn = document.getElementById("modal-prod-buy-btn");
    if (buyBtn) {
      buyBtn.onclick = () => {
        store.addToCart(p.id, 1);
        App.closeAllModals();
        CartCheckout.renderCartDrawer();
        App.openDrawer("cart-drawer");
      };
    }

    this.openModal("modal-product-detail");
  },

  calculateModalShipping() {
    const cepInput = document.getElementById("modal-shipping-cep").value.trim().replace(/\D/g, "");
    const resultsContainer = document.getElementById("modal-shipping-results");

    if (cepInput.length < 8) {
      store.showToast("Informe um CEP brasileiro válido com 8 dígitos.", "warning");
      return;
    }

    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="shipping-option">
          <span>⚡ Nexus Logística Express (1 a 2 dias úteis)</span>
          <strong>R$ 18,90</strong>
        </div>
        <div class="shipping-option">
          <span>📦 Correios SEDEX (2 a 3 dias úteis)</span>
          <strong>R$ 24,50</strong>
        </div>
        <div class="shipping-option">
          <span>🚚 Correios PAC Econômico (5 a 8 dias úteis)</span>
          <strong>R$ 12,00</strong>
        </div>
      `;
    }
  },

  /* ------------------------------------------------------------------------
     Customer Orders View & Live Tracking
     ------------------------------------------------------------------------ */
  renderMyOrdersView() {
    const orders = store.getOrders();
    const container = document.getElementById("my-orders-list");
    if (!container) return;

    if (orders.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:3rem;">Você ainda não possui pedidos realizados.</div>`;
      return;
    }

    container.innerHTML = orders.map(ord => `
      <div class="policy-card" style="margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:1rem; margin-bottom:1rem; flex-wrap:wrap; gap:1rem;">
          <div>
            <h3>Pedido #${ord.id}</h3>
            <span style="font-size:0.8rem; color:var(--text-muted);">Realizado em ${Formatters.date(ord.date)}</span>
          </div>
          <div>
            <span class="badge badge-success">${ord.status}</span>
            <strong style="margin-left:1rem; font-size:1.1rem;">${Formatters.currency(ord.total)}</strong>
          </div>
        </div>

        <div style="margin-bottom:1rem;">
          <strong>Sub-pedidos por Lojista:</strong>
          <div style="margin-top:0.5rem; display:flex; flex-direction:column; gap:0.5rem;">
            ${ord.subOrders ? ord.subOrders.map(sub => `
              <div style="display:flex; justify-content:space-between; background:var(--bg-surface-elevated); padding:0.6rem 0.85rem; border-radius:var(--radius-sm); font-size:0.85rem;">
                <span>🏪 ${sub.storeName} (${sub.items.length} itens)</span>
                <span>Rastreio: <code style="color:var(--secondary);">${sub.trackingCode}</code></span>
              </div>
            `).join("") : ""}
          </div>
        </div>

        <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick="App.openTrackingModal('${ord.trackingCode}')">
            🔍 Rastrear Entrega em Tempo Real
          </button>
          <button class="btn btn-ghost btn-sm" style="color:var(--warning);" onclick="PoliciesLGPD.simulateCdcReturn('${ord.id}')">
            Devolução Grátis (7 dias - CDC)
          </button>
        </div>
      </div>
    `).join("");
  },

  openTrackingModal(code) {
    document.getElementById("track-modal-code").textContent = code;
    this.openModal("modal-tracking-live");
  },

  /* ------------------------------------------------------------------------
     Search & Predictive Autocomplete
     ------------------------------------------------------------------------ */
  initSearch() {
    const input = document.getElementById("global-search-input");
    const dropdown = document.getElementById("search-predictive-dropdown");
    if (!input || !dropdown) return;

    input.addEventListener("input", (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (query.length < 2) {
        dropdown.classList.remove("active");
        return;
      }

      const products = store.getProducts();
      const stores = store.getStores();

      const matchedProducts = products.filter(p => p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)).slice(0, 4);
      const matchedStores = stores.filter(s => s.name.toLowerCase().includes(query)).slice(0, 2);

      if (matchedProducts.length === 0 && matchedStores.length === 0) {
        dropdown.innerHTML = `<div style="padding:1rem; text-align:center; color:var(--text-muted); font-size:0.85rem;">Nenhum resultado encontrado para "${query}"</div>`;
      } else {
        dropdown.innerHTML = `
          ${matchedProducts.map(p => `
            <div class="search-result-item" onclick="App.openProductModal('${p.id}'); document.getElementById('search-predictive-dropdown').classList.remove('active');">
              <img src="${p.image}" class="search-result-thumb">
              <div class="search-result-info">
                <div class="search-result-title">${p.title}</div>
                <div class="search-result-meta">${Formatters.currency(p.price)} • ${p.type === 'service' ? 'Serviço' : 'Produto'}</div>
              </div>
            </div>
          `).join("")}
          ${matchedStores.map(s => `
            <div class="search-result-item" onclick="App.navigate('storefront', { storeId: '${s.id}' }); document.getElementById('search-predictive-dropdown').classList.remove('active');">
              <img src="${s.logo}" class="search-result-thumb">
              <div class="search-result-info">
                <div class="search-result-title">🏪 Loja: ${s.name}</div>
                <div class="search-result-meta">${s.category} • Nota ${s.rating} ★</div>
              </div>
            </div>
          `).join("")}
        `;
      }
      dropdown.classList.add("active");
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-wrapper")) {
        dropdown.classList.remove("active");
      }
    });
  },

  /* ------------------------------------------------------------------------
     Flash Deal Countdown Timer
     ------------------------------------------------------------------------ */
  initFlashCountdown() {
    let hours = 8;
    let minutes = 42;
    let seconds = 15;

    const hEl = document.getElementById("flash-h");
    const mEl = document.getElementById("flash-m");
    const sEl = document.getElementById("flash-s");

    setInterval(() => {
      seconds--;
      if (seconds < 0) {
        seconds = 59;
        minutes--;
        if (minutes < 0) {
          minutes = 59;
          hours--;
          if (hours < 0) hours = 24;
        }
      }
      if (hEl) hEl.textContent = hours.toString().padStart(2, '0');
      if (mEl) mEl.textContent = minutes.toString().padStart(2, '0');
      if (sEl) sEl.textContent = seconds.toString().padStart(2, '0');
    }, 1000);
  },

  /* ------------------------------------------------------------------------
     Modals & Drawers Control
     ------------------------------------------------------------------------ */
  openModal(modalId) {
    this.closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("active");
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
  },

  closeAllModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
  },

  openDrawer(drawerId) {
    const backdrop = document.getElementById("drawer-backdrop");
    const drawer = document.getElementById(drawerId);
    if (backdrop) backdrop.classList.add("active");
    if (drawer) drawer.classList.add("active");
  },

  closeDrawer(drawerId) {
    const backdrop = document.getElementById("drawer-backdrop");
    const drawer = document.getElementById(drawerId);
    if (backdrop) backdrop.classList.remove("active");
    if (drawer) drawer.classList.remove("active");
  },

  bindGlobalEvents() {
    // Backdrop click to close drawer
    const backdrop = document.getElementById("drawer-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () => {
        document.querySelectorAll(".drawer-panel").forEach(d => d.classList.remove("active"));
        backdrop.classList.remove("active");
      });
    }

    // Modal overlay click outside dialog
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.classList.remove("active");
      });
    });

    // Close user dropdown when clicking outside
    document.addEventListener("click", (e) => {
      const dropdown = document.getElementById("user-dropdown-menu");
      const userMenu = document.getElementById("user-profile-menu");
      if (dropdown && userMenu && !userMenu.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  }
};

// Access Gate - Verificação de E-mail e Celular
const AccessGate = {
  emailCode: null,
  phoneCode: null,
  resendTimer: null,
  resendSeconds: 60,
  userEmail: null,
  userPhone: null,

  init() {
    if (localStorage.getItem("access_gate_verified") === "true") {
      this.hideGate();
      return;
    }
    this.bindEvents();
    this.showGate();
  },

  bindEvents() {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        const bypass = document.getElementById("gate-dev-bypass");
        if (bypass) bypass.style.display = bypass.style.display === "none" ? "block" : "none";
      }
    });
  },

  showGate() {
    const gate = document.getElementById("modal-access-gate");
    if (gate) gate.style.display = "flex";
    document.body.style.overflow = "hidden";
  },

  hideGate() {
    const gate = document.getElementById("modal-access-gate");
    if (gate) gate.style.display = "none";
    document.body.style.overflow = "";
  },

  sendEmailCode(e) {
    e.preventDefault();
    const email = document.getElementById("gate-email-input").value.trim().toLowerCase();
    const phone = document.getElementById("gate-phone-input").value.trim();
    const btnText = document.getElementById("gate-btn-text");
    const btnLoading = document.getElementById("gate-btn-loading");

    if (!email.includes("@") || phone.length < 10) {
      store.showToast("Preencha e-mail e celular válidos.", "warning");
      return;
    }

    this.userEmail = email;
    this.userPhone = phone;

    this.emailCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.phoneCode = Math.floor(100000 + Math.random() * 900000).toString();

    btnText.style.display = "none";
    btnLoading.style.display = "inline";

    setTimeout(() => {
      btnText.style.display = "inline";
      btnLoading.style.display = "none";
      
      document.getElementById("gate-step-email").style.display = "none";
      document.getElementById("gate-step-code").style.display = "block";
      document.getElementById("gate-sent-to-email").textContent = `E-mail: ${this.maskEmail(email)}`;
      document.getElementById("gate-sent-to-phone").textContent = `Celular: ${this.maskPhone(phone)}`;
      
      store.showToast(`Códigos enviados! Verifique seu e-mail e SMS. (Dev: E-mail=${this.emailCode}, SMS=${this.phoneCode})`, "success");
      this.startResendTimer();
    }, 1000);
  },

  maskEmail(email) {
    const [local, domain] = email.split("@");
    return local.charAt(0) + "***@" + domain;
  },

  maskPhone(phone) {
    const digits = phone.replace(/\D/g, "");
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-****`;
  },

  startResendTimer() {
    this.resendSeconds = 60;
    const timerEl = document.getElementById("gate-resend-timer");
    const resendBtn = document.querySelector("#gate-step-code button[onclick*='resend']");
    
    if (resendBtn) resendBtn.disabled = true;
    
    this.resendTimer = setInterval(() => {
      this.resendSeconds--;
      if (timerEl) timerEl.textContent = this.resendSeconds;
      if (this.resendSeconds <= 0) {
        clearInterval(this.resendTimer);
        if (resendBtn) resendBtn.disabled = false;
        if (timerEl) timerEl.textContent = "60";
      }
    }, 1000);
  },

  resendCodes() {
    if (this.resendSeconds > 0) return;
    if (!this.userEmail || !this.userPhone) return;
    
    this.emailCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.phoneCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    store.showToast(`Novos códigos enviados! (Dev: E-mail=${this.emailCode}, SMS=${this.phoneCode})`, "success");
    this.startResendTimer();
  },

  verifyCodes(e) {
    e.preventDefault();
    const codeEmail = document.getElementById("gate-code-email").value.trim();
    const codePhone = document.getElementById("gate-code-phone").value.trim();

    if (codeEmail.length !== 6 || codePhone.length !== 6) {
      store.showToast("Digite os 6 dígitos de ambos os códigos.", "warning");
      return;
    }

    if (codeEmail === this.emailCode && codePhone === this.phoneCode) {
      localStorage.setItem("access_gate_verified", "true");
      localStorage.setItem("access_gate_email", this.userEmail);
      localStorage.setItem("access_gate_phone", this.userPhone);
      localStorage.setItem("access_gate_verified_at", new Date().toISOString());
      
      store.addAuditLog("ACCESS_GATE_VERIFIED", this.userEmail, "Verificação de e-mail e celular concluída com sucesso.");
      store.showToast("Acesso liberado! Bem-vindo à plataforma.", "success");
      
      this.hideGate();
    } else {
      store.showToast("Códigos incorretos. Tente novamente.", "error");
      store.addAuditLog("ACCESS_GATE_FAILED", this.userEmail, "Tentativa de verificação com códigos incorretos.");
    }
  },

  devBypass() {
    localStorage.setItem("access_gate_verified", "true");
    localStorage.setItem("access_gate_dev_bypass", "true");
    store.showToast("Modo desenvolvedor ativado - verificação ignorada.", "warning");
    this.hideGate();
  }
};

// Auto start when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
  AccessGate.init();
});
