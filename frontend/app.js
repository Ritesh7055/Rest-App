// Global State
let menuItems = [];
let cart = [];
let tableNo = null;

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const tableLabel = document.getElementById('table-label');
const cartFloatingBar = document.getElementById('cart-floating-bar');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const modalOverlay = document.getElementById('modal-overlay');
const cartDrawer = document.getElementById('cart-drawer');
const drawerMainContent = document.getElementById('drawer-main-content');
const drawerTotalPrice = document.getElementById('drawer-total-price');
const placeOrderBtn = document.getElementById('place-order-btn');
const drawerFooterContainer = document.getElementById('drawer-footer-container');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  parseTableNumber();
  fetchMenu();
  checkActiveOrder();
});

// Parse table number from URL query parameter (e.g. ?table=5)
function parseTableNumber() {
  const urlParams = new URLSearchParams(window.location.search);
  const tableParam = urlParams.get('table');
  if (tableParam) {
    const parsed = parseInt(tableParam, 10);
    if (!isNaN(parsed)) {
      tableNo = parsed;
      tableLabel.textContent = `Table: ${tableNo}`;
      return;
    }
  }
  tableNo = null;
  tableLabel.textContent = 'Table: Takeaway';
}

// Fetch Menu Items from FastAPI Backend
async function fetchMenu() {
  try {
    const response = await fetch('/api/menu');
    if (!response.ok) {
      throw new Error('Failed to retrieve menu items');
    }
    menuItems = await response.json();
    renderMenu(menuItems);
  } catch (error) {
    console.error('Error fetching menu:', error);
    menuGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Unable to load menu</div>
        <div class="empty-state-subtitle">Please check your internet connection and try again.</div>
      </div>
    `;
  }
}

// Render Menu Cards
function renderMenu(items) {
  if (items.length === 0) {
    menuGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-title">No items found</div>
        <div class="empty-state-subtitle">We couldn't find any items in this category.</div>
      </div>
    `;
    return;
  }

  menuGrid.innerHTML = items.map(item => `
    <div class="menu-card" data-id="${item.id}">
      <div>
        <div class="menu-card-header">
          <h3 class="menu-item-name">${item.name}</h3>
          <span class="menu-item-price">$${item.price.toFixed(2)}</span>
        </div>
        <p class="menu-item-description">${item.description || 'No description available.'}</p>
      </div>
      <div class="menu-card-footer">
        <span class="menu-item-tag">${item.category}</span>
        <button class="add-to-cart-btn" onclick="addToCart(${item.id})">+</button>
      </div>
    </div>
  `).join('');
}

// Category Filter Controller
function filterCategory(category) {
  // Update Active Button Style
  const buttons = document.querySelectorAll('#category-container .category-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Find which button triggered this
  event.target.classList.add('active');

  if (category === 'All') {
    renderMenu(menuItems);
  } else {
    const filtered = menuItems.filter(item => item.category === category);
    renderMenu(filtered);
  }
}

// Add Item to Cart
function addToCart(itemId) {
  const existingItem = cart.find(item => item.id === itemId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    const menuItem = menuItems.find(item => item.id === itemId);
    cart.push({
      ...menuItem,
      quantity: 1
    });
  }
  updateCart();
  animateCartButton(itemId);
}

// Visual click/add animation for cards
function animateCartButton(itemId) {
  const card = document.querySelector(`.menu-card[data-id="${itemId}"]`);
  if (card) {
    card.style.transform = 'scale(0.98)';
    setTimeout(() => {
      card.style.transform = '';
    }, 150);
  }
}

// Toggle Cart Drawer Modal
function toggleCartDrawer(isOpen) {
  if (isOpen) {
    modalOverlay.classList.add('active');
    cartDrawer.classList.add('active');
    renderCartDrawer();
  } else {
    modalOverlay.classList.remove('active');
    cartDrawer.classList.remove('active');
  }
}

// Update Cart Floating Bar state and Badge values
function updateCart() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  cartCount.textContent = totalCount;
  cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
  drawerTotalPrice.textContent = `$${totalPrice.toFixed(2)}`;

  if (totalCount > 0) {
    cartFloatingBar.classList.add('active');
    placeOrderBtn.disabled = false;
  } else {
    cartFloatingBar.classList.remove('active');
    placeOrderBtn.disabled = true;
    toggleCartDrawer(false);
  }
}

// Render cart items inside slide-up drawer
function renderCartDrawer() {
  if (cart.length === 0) {
    drawerMainContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <div class="empty-state-title">Your cart is empty</div>
        <div class="empty-state-subtitle">Add items from the menu to get started.</div>
      </div>
    `;
    return;
  }

  drawerMainContent.innerHTML = `
    <div class="cart-items-list">
      ${cart.map(item => `
        <div class="cart-item-row">
          <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
          </div>
          <div class="quantity-controls">
            <button class="qty-btn" onclick="changeQuantity(${item.id}, -1)">&minus;</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn" onclick="changeQuantity(${item.id}, 1)">&plus;</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Change item quantity in cart
function changeQuantity(itemId, change) {
  const itemIndex = cart.findIndex(item => item.id === itemId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += change;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
  }
  updateCart();
  renderCartDrawer();
}

// Submit Order to FastAPI Server
async function submitOrder() {
  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = 'Submitting order...';

  const orderPayload = {
    table_no: tableNo,
    items: cart.map(item => ({
      menu_id: item.id,
      quantity: item.quantity
    }))
  };

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    if (!response.ok) {
      const errorMsg = await response.json();
      throw new Error(errorMsg.detail || 'Failed to place order');
    }

    const orderResult = await response.json();
    localStorage.setItem('activeOrderId', orderResult.id);
    showSuccessState(orderResult);
  } catch (error) {
    console.error('Order submission error:', error);
    alert(`Order failed: ${error.message}`);
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = 'Place Order';
  }
}

// Render Checkmark Animation and Order Confirmation ID
function showSuccessState(order) {
  // Clear the Cart
  cart = [];
  updateCart();

  // Hide the drawer footer elements temporarily
  drawerFooterContainer.style.display = 'none';

  drawerMainContent.innerHTML = `
    <div class="success-screen">
      <div class="success-icon">✓</div>
      <h2>Order Placed!</h2>
      <p>Your order (ID: #${order.id}) has been sent to the kitchen. Please wait at your table.</p>
      <button class="place-order-btn" style="margin-top: 1rem;" onclick="closeSuccessDrawer()">
        Order More Items
      </button>
    </div>
  `;
}

// Close success screen and restore drawer state
function closeSuccessDrawer() {
  toggleCartDrawer(false);
  // Restore footer view for future orders
  setTimeout(() => {
    drawerFooterContainer.style.display = 'block';
    drawerMainContent.innerHTML = '';
    checkActiveOrder();
  }, 300);
}

// --- Real-time Order Tracking System ---
let trackingInterval = null;

function checkActiveOrder() {
  const activeOrderId = localStorage.getItem('activeOrderId');
  if (activeOrderId) {
    showTrackingView(activeOrderId);
  } else {
    hideTrackingView();
  }
}

function showTrackingView(orderId) {
  const trackingContainer = document.getElementById('order-status-container');
  const welcomeHero = document.querySelector('.welcome-hero');
  const categoryContainer = document.getElementById('category-container');

  if (trackingContainer) trackingContainer.style.display = 'block';
  if (welcomeHero) welcomeHero.style.opacity = '0.5';
  if (categoryContainer) categoryContainer.style.opacity = '0.5';
  
  if (menuGrid) {
    menuGrid.style.opacity = '0.35';
    menuGrid.style.pointerEvents = 'none';
  }

  // Clear existing interval if any
  if (trackingInterval) clearInterval(trackingInterval);

  // Poll immediately and start interval every 8 seconds
  pollOrderStatus(orderId);
  trackingInterval = setInterval(() => pollOrderStatus(orderId), 8000);
}

function hideTrackingView() {
  const trackingContainer = document.getElementById('order-status-container');
  const welcomeHero = document.querySelector('.welcome-hero');
  const categoryContainer = document.getElementById('category-container');

  if (trackingContainer) trackingContainer.style.display = 'none';
  if (welcomeHero) welcomeHero.style.opacity = '1';
  if (categoryContainer) categoryContainer.style.opacity = '1';

  if (menuGrid) {
    menuGrid.style.opacity = '1';
    menuGrid.style.pointerEvents = 'auto';
  }

  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
}

async function pollOrderStatus(orderId) {
  try {
    const response = await fetch(`/api/orders/${orderId}`);
    if (!response.ok) {
      if (response.status === 404) {
        clearActiveOrder();
      }
      throw new Error('Order not found or tracking failed');
    }
    const order = await response.json();

    // Update ID
    document.getElementById('tracking-id').textContent = order.id;

    // Update Status Badge
    const badge = document.getElementById('tracking-status-badge');
    badge.textContent = order.status;
    badge.className = `status-badge ${order.status}`;

    // Render items list
    const itemsList = document.getElementById('tracking-items-list');
    itemsList.innerHTML = order.items.map(item => `
      <div class="tracking-item">
        <span><span class="tracking-qty">${item.quantity}x</span>${item.menu.name}</span>
        <span>$${(item.menu.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    // Update Total Price
    document.getElementById('tracking-total-price').textContent = `$${order.total_price.toFixed(2)}`;

    // Show action area if order is delivered
    const actionArea = document.getElementById('tracking-action-area');
    if (order.status === 'delivered') {
      actionArea.style.display = 'block';
    } else {
      actionArea.style.display = 'none';
    }
  } catch (error) {
    console.error('Error tracking order status:', error);
  }
}

function clearActiveOrder() {
  localStorage.removeItem('activeOrderId');
  hideTrackingView();
}

