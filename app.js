(() => {
  'use strict';

  const CLP = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  });

  const STORAGE_KEY = 'velunix-pos-cart-v1';
  const body = document.body;
  const whatsappNumber = (body.dataset.whatsapp || '').replace(/\D/g, '');
  const cartDrawer = document.querySelector('.cart-drawer');
  const overlay = document.querySelector('[data-overlay]');
  const cartItemsEl = document.querySelector('.cart-items');
  const cartEmptyEl = document.querySelector('.cart-empty');
  const cartSummaryEl = document.querySelector('.cart-summary');
  const cartSubtotalEl = document.querySelector('.cart-subtotal');
  const cartCountEl = document.querySelector('.cart-count');
  const checkoutModal = document.getElementById('checkout-modal');
  const toast = document.querySelector('.toast');
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');

  let cart = loadCart();
  let toastTimer;

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function formatPrice(price, type = 'purchase') {
    return type === 'quote' || Number(price) === 0 ? 'Precio a cotizar' : CLP.format(price);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function openCart() {
    cartDrawer.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');
    body.classList.add('no-scroll');
  }

  function closeCart() {
    cartDrawer.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('active');
    body.classList.remove('no-scroll');
  }

  function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    renderCart();
    showToast(`${product.name} agregado al carrito`);
    openCart();
  }

  function updateQuantity(id, delta) {
    const item = cart.find(product => product.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) cart = cart.filter(product => product.id !== id);
    saveCart();
    renderCart();
  }

  function removeItem(id) {
    cart = cart.filter(product => product.id !== id);
    saveCart();
    renderCart();
    showToast('Producto eliminado');
  }

  function renderCart() {
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = cart.reduce((acc, item) => {
      return item.type === 'quote' ? acc : acc + item.price * item.quantity;
    }, 0);

    cartCountEl.textContent = String(count);
    cartSubtotalEl.textContent = CLP.format(subtotal);
    cartItemsEl.innerHTML = '';

    const isEmpty = cart.length === 0;
    cartEmptyEl.classList.toggle('hidden', !isEmpty);
    cartSummaryEl.classList.toggle('hidden', isEmpty);

    cart.forEach(item => {
      const article = document.createElement('article');
      article.className = 'cart-item';
      article.innerHTML = `
        <div class="cart-item-visual" aria-hidden="true">${item.type === 'quote' ? '⭐' : '🧾'}</div>
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <div class="item-price">${formatPrice(item.price, item.type)}</div>
          <div class="item-controls" aria-label="Cantidad de ${escapeHtml(item.name)}">
            <button type="button" data-action="decrease" data-id="${escapeHtml(item.id)}" aria-label="Disminuir cantidad">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-action="increase" data-id="${escapeHtml(item.id)}" aria-label="Aumentar cantidad">+</button>
          </div>
        </div>
        <button class="remove-item" type="button" data-action="remove" data-id="${escapeHtml(item.id)}" aria-label="Eliminar ${escapeHtml(item.name)}">×</button>
      `;
      cartItemsEl.appendChild(article);
    });

    document.querySelectorAll('.add-to-cart').forEach(button => {
      const item = cart.find(product => product.id === button.dataset.id);
      button.classList.toggle('added', Boolean(item));
      if (item) {
        button.textContent = `En carrito (${item.quantity})`;
      } else {
        button.textContent = button.dataset.type === 'quote' ? 'Agregar para cotizar' : 'Agregar al carrito';
      }
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function buildOrderMessage(formData) {
    const lines = [
      'Hola, quiero solicitar el siguiente pedido de Velunix POS:',
      '',
      ...cart.map(item => {
        const lineTotal = item.type === 'quote'
          ? 'A cotizar'
          : CLP.format(item.price * item.quantity);
        return `• ${item.name} x${item.quantity} — ${lineTotal}`;
      }),
      '',
      `Subtotal conocido: ${CLP.format(cart.reduce((sum, item) => item.type === 'quote' ? sum : sum + item.price * item.quantity, 0))}`,
      'Despacho e instalación: por coordinar',
      '',
      `Nombre: ${formData.get('customerName')}`,
      `Teléfono: ${formData.get('customerPhone')}`,
      `Ciudad/comuna: ${formData.get('customerCity')}`,
      `Comentario: ${formData.get('customerNote') || 'Sin comentarios'}`
    ];
    return lines.join('\n');
  }

  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
      addToCart({
        id: button.dataset.id,
        name: button.dataset.name,
        price: Number(button.dataset.price),
        type: button.dataset.type
      });
    });
  });

  document.querySelectorAll('.cart-button, .footer-cart').forEach(button => {
    button.addEventListener('click', openCart);
  });
  document.querySelector('.close-cart').addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  document.querySelector('.close-cart-and-shop').addEventListener('click', () => {
    closeCart();
    document.getElementById('kits').scrollIntoView({ behavior: 'smooth' });
  });

  cartItemsEl.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const id = button.dataset.id;
    if (button.dataset.action === 'increase') updateQuantity(id, 1);
    if (button.dataset.action === 'decrease') updateQuantity(id, -1);
    if (button.dataset.action === 'remove') removeItem(id);
  });

  document.querySelector('.clear-cart').addEventListener('click', () => {
    if (!cart.length) return;
    cart = [];
    saveCart();
    renderCart();
    showToast('Carrito vaciado');
  });

  document.querySelector('.checkout-button').addEventListener('click', () => {
    if (!cart.length) return;
    closeCart();
    checkoutModal.showModal();
  });

  document.querySelector('.modal-close').addEventListener('click', () => checkoutModal.close());
  checkoutModal.addEventListener('click', event => {
    const rect = checkoutModal.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) checkoutModal.close();
  });

  document.getElementById('checkout-form').addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = buildOrderMessage(formData);

    if (!whatsappNumber || whatsappNumber === '56900000000') {
      navigator.clipboard?.writeText(message).catch(() => {});
      showToast('Pedido copiado. Configura tu número de WhatsApp en index.html.');
      checkoutModal.close();
      return;
    }

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  document.getElementById('lead-form').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [
      'Hola, quiero solicitar una demostración de Velunix POS.',
      '',
      `Nombre: ${data.get('name')}`,
      `Negocio: ${data.get('business')}`,
      `Teléfono: ${data.get('phone')}`
    ].join('\n');

    if (!whatsappNumber || whatsappNumber === '56900000000') {
      navigator.clipboard?.writeText(message).catch(() => {});
      showToast('Solicitud copiada. Configura tu WhatsApp en index.html.');
      return;
    }

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  });

  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && cartDrawer.classList.contains('open')) closeCart();
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

  document.getElementById('year').textContent = new Date().getFullYear();
  renderCart();
})();
