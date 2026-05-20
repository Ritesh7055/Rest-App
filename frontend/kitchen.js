// State Variables
let activeOrders = [];
let soundEnabled = true;
const polledOrderIds = new Set();

// DOM Elements
const kitchenGrid = document.getElementById('kitchen-grid');
const soundIcon = document.getElementById('sound-icon');
const soundStatus = document.getElementById('sound-status');
const notificationBanner = document.getElementById('notification-banner');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchPendingOrders();
  // Poll every 10 seconds for new orders
  setInterval(fetchPendingOrders, 10000);
  
  // Update the time elapsed counters every 30 seconds
  setInterval(updateElapsedTimes, 30000);
});

// Fetch active orders with status 'pending'
async function fetchPendingOrders() {
  try {
    const response = await fetch('/api/orders/pending');
    if (!response.ok) {
      throw new Error('Failed to fetch pending orders');
    }
    const orders = await response.json();
    
    // Check if there are any new orders to trigger chime
    let hasNewOrder = false;
    orders.forEach(order => {
      if (!polledOrderIds.has(order.id)) {
        polledOrderIds.add(order.id);
        // Only trigger sound alert if this is not the very first fetch on load
        if (activeOrders.length > 0 || polledOrderIds.size > orders.length) {
          hasNewOrder = true;
        }
      }
    });

    if (hasNewOrder) {
      playNewOrderSound();
      showNotification();
    }

    activeOrders = orders;
    renderKitchenGrid();
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    // Show offline connection dot
    document.querySelector('.connection-indicator').style.backgroundColor = 'var(--color-cancelled)';
  }
}

// Render active orders as ticket cards
function renderKitchenGrid() {
  // Restore connection indicator
  document.querySelector('.connection-indicator').style.backgroundColor = 'var(--color-delivered)';

  if (activeOrders.length === 0) {
    kitchenGrid.innerHTML = `
      <div class="kitchen-empty">
        <div class="kitchen-empty-icon">🍳</div>
        <h3 style="font-size: 1.25rem;">No Active Orders</h3>
        <p style="color: #a8a29e; font-size: 0.9rem; margin-top: 0.25rem;">Orders will appear here as they are placed.</p>
      </div>
    `;
    return;
  }

  kitchenGrid.innerHTML = activeOrders.map(order => {
    const elapsedMinutes = calculateElapsedMinutes(order.timestamp);
    const urgencyClass = elapsedMinutes >= 15 ? 'warning-urgency' : '';
    const tableText = order.table_no ? `Table ${order.table_no}` : 'Takeaway';

    return `
      <div class="order-card ${urgencyClass}" data-order-id="${order.id}">
        <div class="order-card-header">
          <span class="order-table-title">${tableText}</span>
          <span class="order-time" data-timestamp="${order.timestamp}">
            ⏱️ <span class="time-text">${formatElapsedTime(elapsedMinutes)}</span>
          </span>
        </div>
        <div class="order-card-content">
          <ul class="order-items-list">
            ${order.items.map(item => `
              <li class="order-item-detail">
                <span class="order-item-qty">${item.quantity}x</span>
                <span class="order-item-title">${item.menu.name}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        <div class="order-card-footer">
          <button class="btn-action-complete" onclick="markOrderDelivered(${order.id})">
            Mark Delivered
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Calculate elapsed time in minutes
function calculateElapsedMinutes(timestampStr) {
  // Force UTC parsing if timestamp lacks timezone details
  let formattedStr = timestampStr;
  if (!formattedStr.endsWith('Z') && !formattedStr.includes('+')) {
    formattedStr += 'Z';
  }
  
  const orderTime = new Date(formattedStr);
  const now = new Date();
  const diffMs = now - orderTime;
  return Math.max(0, Math.floor(diffMs / 60000));
}

// Format the display string of elapsed time
function formatElapsedTime(minutes) {
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m ago`;
}

// Timer-based function to update UI counters without full polling
function updateElapsedTimes() {
  const timeElements = document.querySelectorAll('.order-time');
  timeElements.forEach(el => {
    const timestampStr = el.getAttribute('data-timestamp');
    const textEl = el.querySelector('.time-text');
    if (timestampStr && textEl) {
      const elapsedMinutes = calculateElapsedMinutes(timestampStr);
      textEl.textContent = formatElapsedTime(elapsedMinutes);
      
      // Update urgency styling dynamically
      const card = el.closest('.order-card');
      if (card) {
        if (elapsedMinutes >= 15) {
          card.classList.add('warning-urgency');
        } else {
          card.classList.remove('warning-urgency');
        }
      }
    }
  });
}

// Complete order status change using PUT request
async function markOrderDelivered(orderId) {
  const btn = document.querySelector(`.order-card[data-order-id="${orderId}"] .btn-action-complete`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Updating...';
  }

  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'delivered' })
    });

    if (!response.ok) {
      throw new Error('Failed to update status');
    }

    // Remove from local array and re-render immediately
    activeOrders = activeOrders.filter(order => order.id !== orderId);
    renderKitchenGrid();
  } catch (error) {
    console.error('Error completing order:', error);
    alert('Failed to complete order. Please try again.');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Mark Delivered';
    }
  }
}

// Sound Controller
function toggleSound() {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    soundIcon.textContent = '🔊';
    soundStatus.textContent = 'Sound Alert: ON';
  } else {
    soundIcon.textContent = '🔇';
    soundStatus.textContent = 'Sound Alert: OFF';
  }
}

// Synthesize a clean double-chime ding when a new order arrives
function playNewOrderSound() {
  if (!soundEnabled) return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    
    // Tone 1: E5
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
    gain1.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);

    // Tone 2: A5 (offset by 150ms)
    setTimeout(() => {
      if (audioCtx.state === 'closed') return;
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime); // A5
      gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      osc2.start(audioCtx.currentTime);
      osc2.stop(audioCtx.currentTime + 0.4);
    }, 150);

  } catch (error) {
    console.warn('Audio Context block / not initialized by user gesture:', error);
  }
}

// Show new order banner
function showNotification() {
  notificationBanner.classList.add('show');
  setTimeout(() => {
    notificationBanner.classList.remove('show');
  }, 3000);
}
