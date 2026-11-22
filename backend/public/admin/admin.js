// State
const state = {
  token: localStorage.getItem('carpet_admin_token') || '',
  admin: JSON.parse(localStorage.getItem('carpet_admin_user') || 'null'),
  currentTab: 'overview',
  enquiries: [],
  orders: [],
  products: [],
};

const API_BASE = '/api';

// Toast Notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// API Helper
async function apiCall(endpoint, options = {}) {
  const headers = options.headers || {};
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  // If body is FormData, do not set Content-Type
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      handleLogout();
      throw new Error('Session expired. Please log in again.');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  }
}

// Check Auth
function checkAuth() {
  const loginScreen = document.getElementById('login-screen');
  if (!state.token) {
    loginScreen.classList.remove('hidden');
  } else {
    loginScreen.classList.add('hidden');
    if (state.admin) {
      document.getElementById('current-user-name').textContent = state.admin.name || 'Admin';
      document.getElementById('current-user-email').textContent = state.admin.email || '';
    }
    loadAllData();
  }
}

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');

  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    state.token = data.data.token;
    state.admin = data.data;
    localStorage.setItem('carpet_admin_token', state.token);
    localStorage.setItem('carpet_admin_user', JSON.stringify(state.admin));

    showToast('Signed in successfully!', 'success');
    checkAuth();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In to Dashboard →';
  }
});

// Logout
function handleLogout() {
  state.token = '';
  state.admin = null;
  localStorage.removeItem('carpet_admin_token');
  localStorage.removeItem('carpet_admin_user');
  document.getElementById('login-screen').classList.remove('hidden');
}
document.getElementById('logout-btn').addEventListener('click', handleLogout);

// Tab Navigation
function switchTab(tabId) {
  state.currentTab = tabId;
  document.querySelectorAll('.sidebar-nav .nav-item').forEach((el) => {
    el.classList.toggle('active', el.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach((el) => {
    el.classList.toggle('active', el.id === `tab-${tabId}`);
  });

  const titles = {
    overview: ['Dashboard Overview', 'Real-time store statistics, customer leads, and bookings.'],
    enquiries: ['Enquiries & Customer Leads', 'Review and follow up on wholesale and retail inquiries.'],
    orders: ['Orders & Bookings', 'Track orders, bespoke carpet specifications, and production timelines.'],
    products: ['Product Catalog Management', 'Add, update, or remove carpets displayed on your showcase website.'],
    settings: ['Admin Settings', 'Account security and business contact configuration.'],
  };

  if (titles[tabId]) {
    document.getElementById('page-title').textContent = titles[tabId][0];
    document.getElementById('page-subtitle').textContent = titles[tabId][1];
  }

  if (tabId === 'settings') {
    loadEmailSettings();
  }
}

document.querySelectorAll('.sidebar-nav .nav-item').forEach((item) => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = item.getAttribute('data-tab');
    switchTab(tab);
  });
});

// Refresh button
document.getElementById('refresh-btn').addEventListener('click', () => {
  loadAllData();
  showToast('Data refreshed', 'info');
});

// Load All Data
async function loadAllData() {
  checkHealth();
  loadStats();
  loadEnquiries();
  loadOrders();
  loadProducts();
  loadEmailSettings();
}

// Health Check
async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    const dot = document.getElementById('db-dot');
    const text = document.getElementById('db-status-text');

    dot.className = 'dot dot-green';
    if (data.database === 'mongodb_connected') {
      text.textContent = 'MongoDB Online';
    } else {
      text.textContent = 'Database Online (Local Storage)';
    }
  } catch {
    document.getElementById('db-dot').className = 'dot dot-red';
    document.getElementById('db-status-text').textContent = 'Backend Offline';
  }
}

let previousEnquiryTotal = null;

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch (e) {
    // AudioContext blocked or unsupported
  }
}

// 1. STATS
async function loadStats() {
  try {
    const res = await apiCall('/admin/stats');
    const d = res.data;

    document.getElementById('stat-total-enquiries').textContent = d.enquiries.total;
    document.getElementById('stat-new-enquiries').textContent = `${d.enquiries.new} New leads`;
    document.getElementById('stat-total-orders').textContent = d.orders.total;
    document.getElementById('stat-pending-orders').textContent = `${d.orders.pending} Pending review`;
    document.getElementById('stat-total-products').textContent = d.products.total;

    // Badges in sidebar
    const badgeEnq = document.getElementById('badge-new-enquiries');
    if (d.enquiries.new > 0) {
      badgeEnq.textContent = d.enquiries.new;
      badgeEnq.classList.remove('hidden');
    } else {
      badgeEnq.classList.add('hidden');
    }

    const badgeOrd = document.getElementById('badge-pending-orders');
    if (d.orders.pending > 0) {
      badgeOrd.textContent = d.orders.pending;
      badgeOrd.classList.remove('hidden');
    } else {
      badgeOrd.classList.add('hidden');
    }

    // Play chime and show toast if a new lead arrived while admin is open
    if (previousEnquiryTotal !== null && d.enquiries.total > previousEnquiryTotal) {
      playNotificationChime();
      const latest = d.recentEnquiries && d.recentEnquiries[0];
      const name = latest ? latest.name : 'A new customer';
      showToast(`🔔 New Inquiry received from ${name}!`, 'success');
      const activeTab = document.querySelector('.tab-pane.active');
      if (activeTab && activeTab.id === 'tab-enquiries') {
        loadEnquiries();
      }
    }
    previousEnquiryTotal = d.enquiries.total;

    // Render overview quick tables
    renderOverviewTables(d.recentEnquiries, d.recentOrders);
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

function renderOverviewTables(enquiries, orders) {
  const enqBody = document.getElementById('overview-enquiries-tbody');
  if (!enquiries || enquiries.length === 0) {
    enqBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding:2rem;">No inquiries recorded yet.</td></tr>';
  } else {
    enqBody.innerHTML = enquiries
      .map(
        (e) => `
      <tr>
        <td>
          <div class="client-cell">
            <span class="client-avatar">${escapeHtml((e.name || 'C').charAt(0).toUpperCase())}</span>
            <div>
              <strong class="cell-primary">${escapeHtml(e.name)}</strong>
              <small class="cell-secondary">${escapeHtml(e.company || 'Direct Buyer')}</small>
            </div>
          </div>
        </td>
        <td>
          <a href="https://wa.me/${cleanPhone(e.phone)}" target="_blank" class="whatsapp-cell-link" title="Open WhatsApp chat with client">
            <span class="wa-dot"></span>${escapeHtml(e.phone)}
          </a>
        </td>
        <td><span class="product-badge">${escapeHtml(e.category)}</span></td>
        <td><span class="status-pill status-${e.status.toLowerCase().replace(' ', '-')}">${e.status}</span></td>
      </tr>
    `
      )
      .join('');
  }

  const ordBody = document.getElementById('overview-orders-tbody');
  if (!orders || orders.length === 0) {
    ordBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding:2rem;">No wholesale orders placed yet.</td></tr>';
  } else {
    ordBody.innerHTML = orders
      .map(
        (o) => `
      <tr>
        <td><strong class="order-code">#${o.orderNumber}</strong></td>
        <td>
          <strong class="cell-primary">${escapeHtml(o.customer?.name || 'Wholesale Client')}</strong>
          <small class="cell-secondary">${escapeHtml(o.customer?.company || o.customer?.address?.city || 'India')}</small>
        </td>
        <td><span class="qty-badge">${o.totalQuantity || 1} pcs</span></td>
        <td><span class="status-pill status-${(o.status || 'pending').toLowerCase().replace(' ', '-')}">${o.status || 'Pending'}</span></td>
      </tr>
    `
      )
      .join('');
  }
}

// 2. ENQUIRIES
async function loadEnquiries() {
  const status = document.getElementById('filter-enquiry-status').value;
  const search = document.getElementById('search-enquiry').value.trim();

  let url = `/enquiries?status=${status}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  try {
    const res = await apiCall(url);
    state.enquiries = res.data;
    document.getElementById('enquiry-count-label').textContent = `${res.total} enquiries found`;
    renderEnquiriesTable(res.data);
  } catch (err) {
    console.error('Error loading enquiries:', err);
  }
}

document.getElementById('filter-enquiry-status').addEventListener('change', loadEnquiries);
document.getElementById('search-enquiry').addEventListener('input', debounce(loadEnquiries, 300));

function renderEnquiriesTable(enquiries) {
  const tbody = document.getElementById('enquiries-tbody');
  if (!enquiries || enquiries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No matching enquiries found.</td></tr>';
    return;
  }

  tbody.innerHTML = enquiries
    .map((e) => {
      const dateStr = new Date(e.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const waNumber = cleanPhone(e.phone);

      return `
      <tr>
        <td><small class="text-muted">${dateStr}</small></td>
        <td>
          <strong>${escapeHtml(e.name)}</strong>
          ${e.company ? `<br/><small class="text-muted">🏢 ${escapeHtml(e.company)}</small>` : ''}
        </td>
        <td>
          <a href="tel:${escapeHtml(e.phone)}" class="btn-link">📞 ${escapeHtml(e.phone)}</a>
          <br/>
          <a href="https://wa.me/${waNumber}?text=${encodeURIComponent('Hello ' + e.name + ', greeting from Jagdish Handloom Carpets regarding your inquiry for ' + e.category)}" target="_blank" style="color:#25D366; text-decoration:none; font-size:0.8rem; font-weight:500;">
            💬 WhatsApp
          </a>
          ${e.email ? `<br/><a href="mailto:${escapeHtml(e.email)}" class="text-muted" style="font-size:0.78rem;">✉️ ${escapeHtml(e.email)}</a>` : ''}
        </td>
        <td>
          <strong>${escapeHtml(e.category)}</strong>
          ${e.quantity ? `<br/><small class="text-muted">Qty: ${escapeHtml(e.quantity)}</small>` : ''}
        </td>
        <td style="max-width: 250px;">
          <small>${escapeHtml(e.message || 'No additional notes.')}</small>
          ${e.adminNotes ? `<div style="margin-top:4px; font-size:0.75rem; color:var(--rust); background:#EDE4D4; padding:2px 6px; border-radius:3px;"><strong>Internal:</strong> ${escapeHtml(e.adminNotes)}</div>` : ''}
        </td>
        <td>
          <select class="form-select form-select-sm" onchange="updateEnquiryStatus('${e._id}', this.value)" style="width: auto; padding: 4px 8px; font-size: 0.8rem;">
            <option value="New" ${e.status === 'New' ? 'selected' : ''}>New</option>
            <option value="Contacted" ${e.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
            <option value="In Progress" ${e.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Closed" ${e.status === 'Closed' ? 'selected' : ''}>Closed</option>
          </select>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn-action-icon" title="Add internal note" onclick="openNotesModal('${e._id}', 'enquiry', '${escapeQuotes(e.adminNotes || '')}')">📝</button>
            <button class="btn-action-icon" title="Delete enquiry" onclick="deleteEnquiryRecord('${e._id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');
}

async function updateEnquiryStatus(id, status) {
  try {
    await apiCall(`/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    showToast(`Status updated to ${status}`, 'success');
    loadStats();
  } catch (err) {
    console.error(err);
  }
}

async function deleteEnquiryRecord(id) {
  if (!confirm('Are you sure you want to delete this enquiry?')) return;
  try {
    await apiCall(`/enquiries/${id}`, { method: 'DELETE' });
    showToast('Enquiry deleted', 'info');
    loadEnquiries();
    loadStats();
  } catch (err) {
    console.error(err);
  }
}

// 3. ORDERS
async function loadOrders() {
  const status = document.getElementById('filter-order-status').value;
  const search = document.getElementById('search-orders').value.trim();

  let url = `/orders?status=${status}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  try {
    const res = await apiCall(url);
    state.orders = res.data;
    document.getElementById('order-count-label').textContent = `${res.total} orders found`;
    renderOrdersTable(res.data);
  } catch (err) {
    console.error('Error loading orders:', err);
  }
}

document.getElementById('filter-order-status').addEventListener('change', loadOrders);
document.getElementById('search-orders').addEventListener('input', debounce(loadOrders, 300));

function renderOrdersTable(orders) {
  const tbody = document.getElementById('orders-tbody');
  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No orders or quote requests found.</td></tr>';
    return;
  }

  tbody.innerHTML = orders
    .map((o) => {
      const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const itemsList = o.items
        .map((i) => `<div>• <strong>${escapeHtml(i.productTitle)}</strong> (${escapeHtml(i.size)}) × ${i.quantity}</div>`)
        .join('');

      return `
      <tr>
        <td><strong>#${o.orderNumber}</strong></td>
        <td><small class="text-muted">${dateStr}</small></td>
        <td>
          <strong>${escapeHtml(o.customer.name)}</strong>
          ${o.customer.company ? `<br/><small class="text-muted">🏢 ${escapeHtml(o.customer.company)}</small>` : ''}
          <br/><a href="tel:${escapeHtml(o.customer.phone)}" class="btn-link">📞 ${escapeHtml(o.customer.phone)}</a>
          ${o.customer.address && o.customer.address.city ? `<br/><small class="text-muted">📍 ${escapeHtml(o.customer.address.city)}, ${escapeHtml(o.customer.address.state || '')}</small>` : ''}
        </td>
        <td style="max-width: 250px;"><small>${itemsList}</small></td>
        <td><strong>${o.totalQuantity} pcs</strong></td>
        <td>
          <select class="form-select form-select-sm" onchange="updateOrderStatus('${o._id}', this.value)" style="width: auto; padding: 4px 8px; font-size: 0.8rem;">
            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="In Production" ${o.status === 'In Production' ? 'selected' : ''}>In Production</option>
            <option value="Dispatched" ${o.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn-action-icon" title="Add internal note" onclick="openNotesModal('${o._id}', 'order', '${escapeQuotes(o.adminNotes || '')}')">📝</button>
            <button class="btn-action-icon" title="Delete order" onclick="deleteOrderRecord('${o._id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');
}

async function updateOrderStatus(id, status) {
  try {
    await apiCall(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    showToast(`Order status updated to ${status}`, 'success');
    loadStats();
  } catch (err) {
    console.error(err);
  }
}

async function deleteOrderRecord(id) {
  if (!confirm('Are you sure you want to delete this order?')) return;
  try {
    await apiCall(`/orders/${id}`, { method: 'DELETE' });
    showToast('Order deleted', 'info');
    loadOrders();
    loadStats();
  } catch (err) {
    console.error(err);
  }
}

// 4. PRODUCTS
async function loadProducts() {
  try {
    const res = await apiCall('/products');
    state.products = res.data;
    renderProductsGrid(res.data);
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

function renderProductsGrid(products) {
  const container = document.getElementById('products-admin-grid');
  if (!products || products.length === 0) {
    container.innerHTML = '<p class="text-muted text-center" style="grid-column: 1/-1;">No carpets in catalog yet. Click "+ Add New Carpet" to add one.</p>';
    return;
  }

  container.innerHTML = products
    .map(
      (p) => `
    <div class="product-admin-card">
      <img src="${p.imageUrl}" alt="${escapeHtml(p.title)}" class="product-admin-img" onerror="this.src='/images/carpet1.jpg'" />
      <div class="product-admin-body">
        <h4 class="product-admin-title">${escapeHtml(p.title)}</h4>
        <div class="product-admin-meta">${escapeHtml(p.category)} · ${escapeHtml(p.tag || '')}</div>
        <p class="product-admin-desc">${escapeHtml(p.description || '')}</p>
        <div style="font-size:0.85rem; font-weight:600; color:var(--brown); margin-bottom: 8px;">
          🏷️ ${escapeHtml(p.priceRange || 'Contact for price')}
        </div>
        <div class="product-admin-footer">
          <label style="font-size: 0.78rem; display: flex; align-items: center; gap: 4px; cursor: pointer;">
            <input type="checkbox" ${p.inStock ? 'checked' : ''} onchange="toggleProductStock('${p._id}', this.checked)" />
            In Stock
          </label>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="openEditProductModal('${p._id}')">Edit</button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteProductRecord('${p._id}')">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

// Product Modal & Form
const productModal = document.getElementById('product-modal');
document.getElementById('open-product-modal-btn').addEventListener('click', () => {
  document.getElementById('modal-product-title').textContent = 'Add New Carpet Product';
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = '';
  document.getElementById('prod-in-stock').checked = true;
  document.getElementById('prod-is-featured').checked = true;
  productModal.classList.remove('hidden');
});

document.getElementById('close-product-modal').addEventListener('click', () => productModal.classList.add('hidden'));
document.getElementById('cancel-product-modal').addEventListener('click', () => productModal.classList.add('hidden'));

function openEditProductModal(id) {
  const p = state.products.find((item) => item._id === id);
  if (!p) return;

  document.getElementById('modal-product-title').textContent = 'Edit Carpet Product';
  document.getElementById('product-id').value = p._id;
  document.getElementById('prod-title').value = p.title;
  document.getElementById('prod-category').value = p.category;
  document.getElementById('prod-price-range').value = p.priceRange || '';
  document.getElementById('prod-tag').value = p.tag || '';
  document.getElementById('prod-material').value = p.material || '';
  document.getElementById('prod-sizes').value = (p.sizesAvailable || []).join(', ');
  document.getElementById('prod-description').value = p.description || '';
  document.getElementById('prod-image-url').value = p.imageUrl || '';
  document.getElementById('prod-in-stock').checked = p.inStock;
  document.getElementById('prod-is-featured').checked = p.isFeatured;

  productModal.classList.remove('hidden');
}

document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('product-id').value;
  const isEdit = Boolean(id);

  const formData = new FormData();
  formData.append('title', document.getElementById('prod-title').value);
  formData.append('category', document.getElementById('prod-category').value);
  formData.append('priceRange', document.getElementById('prod-price-range').value);
  formData.append('tag', document.getElementById('prod-tag').value);
  formData.append('material', document.getElementById('prod-material').value);
  formData.append('sizesAvailable', document.getElementById('prod-sizes').value);
  formData.append('description', document.getElementById('prod-description').value);
  formData.append('inStock', document.getElementById('prod-in-stock').checked);
  formData.append('isFeatured', document.getElementById('prod-is-featured').checked);

  const fileInput = document.getElementById('prod-file');
  if (fileInput.files.length > 0) {
    formData.append('image', fileInput.files[0]);
  } else {
    const imgUrl = document.getElementById('prod-image-url').value.trim();
    if (imgUrl) formData.append('imageUrl', imgUrl);
  }

  const btn = document.getElementById('save-product-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    if (isEdit) {
      await apiCall(`/products/${id}`, {
        method: 'PUT',
        body: formData,
      });
      showToast('Product updated successfully', 'success');
    } else {
      await apiCall('/products', {
        method: 'POST',
        body: formData,
      });
      showToast('New carpet added to catalog!', 'success');
    }
    productModal.classList.add('hidden');
    loadProducts();
    loadStats();
  } catch (err) {
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Product';
  }
});

async function toggleProductStock(id, inStock) {
  try {
    await apiCall(`/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inStock }),
    });
    showToast(`Stock status updated`, 'success');
  } catch (err) {
    console.error(err);
  }
}

async function deleteProductRecord(id) {
  if (!confirm('Are you sure you want to remove this carpet from the catalog?')) return;
  try {
    await apiCall(`/products/${id}`, { method: 'DELETE' });
    showToast('Product removed from catalog', 'info');
    loadProducts();
    loadStats();
  } catch (err) {
    console.error(err);
  }
}

// 5. NOTES MODAL
const notesModal = document.getElementById('notes-modal');
function openNotesModal(id, type, existingNotes) {
  document.getElementById('notes-target-id').value = id;
  document.getElementById('notes-target-type').value = type;
  document.getElementById('notes-textarea').value = existingNotes;
  notesModal.classList.remove('hidden');
}

document.getElementById('close-notes-modal').addEventListener('click', () => notesModal.classList.add('hidden'));
document.getElementById('cancel-notes-modal').addEventListener('click', () => notesModal.classList.add('hidden'));

document.getElementById('save-notes-btn').addEventListener('click', async () => {
  const id = document.getElementById('notes-target-id').value;
  const type = document.getElementById('notes-target-type').value;
  const notes = document.getElementById('notes-textarea').value;

  try {
    const endpoint = type === 'enquiry' ? `/enquiries/${id}` : `/orders/${id}`;
    await apiCall(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({ adminNotes: notes }),
    });
    showToast('Notes saved successfully', 'success');
    notesModal.classList.add('hidden');
    if (type === 'enquiry') loadEnquiries();
    else loadOrders();
  } catch (err) {
    console.error(err);
  }
});

// 6. PASSWORD UPDATE (Settings)
document.getElementById('password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const curr = document.getElementById('curr-password').value;
  const newPass = document.getElementById('new-password').value;
  const conf = document.getElementById('confirm-new-password').value;

  if (newPass !== conf) {
    showToast('New passwords do not match', 'error');
    return;
  }

  try {
    await apiCall('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword: curr, newPassword: newPass }),
    });
    showToast('Admin password changed successfully!', 'success');
    document.getElementById('password-form').reset();
  } catch (err) {
    console.error(err);
  }
});

// Utilities
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeQuotes(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function cleanPhone(phone) {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 10) clean = '91' + clean;
  return clean;
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Toggle Password Visibility
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  const showIcon = btn.querySelector('.eye-show');
  const hideIcon = btn.querySelector('.eye-hide');
  if (showIcon && hideIcon) {
    showIcon.style.display = isPassword ? 'none' : 'block';
    hideIcon.style.display = isPassword ? 'block' : 'none';
  }
}
window.togglePasswordVisibility = togglePasswordVisibility;

// 7. EMAIL SETTINGS (Gmail Notification Setup)
async function loadEmailSettings() {
  try {
    const res = await apiCall('/admin/email-status');
    const d = res.data;
    if (!d) return;

    const dot = document.getElementById('email-status-dot');
    const text = document.getElementById('email-status-text');
    const banner = document.getElementById('email-status-banner');
    const infoNotif = document.getElementById('info-notification-email');

    if (infoNotif) {
      infoNotif.textContent = d.notificationEmail || 'Not configured';
    }

    const userInput = document.getElementById('smtp-user');
    const notifInput = document.getElementById('notification-email');
    if (userInput && d.rawUser && !userInput.value) {
      userInput.value = d.rawUser;
    }
    if (notifInput && d.notificationEmail && d.notificationEmail !== 'Not set' && !notifInput.value) {
      notifInput.value = d.notificationEmail;
    }

    if (d.configured) {
      if (dot) dot.className = 'dot dot-green';
      if (text) text.textContent = 'Gmail Delivery Active';
      if (banner) {
        banner.className = 'alert alert-success';
        banner.style.borderLeft = '4px solid #16a34a';
        banner.innerHTML = `
          <strong>✔ Live Delivery Active:</strong> Incoming leads & wholesale requests are sent to <strong>${escapeHtml(d.notificationEmail)}</strong> via <code>${escapeHtml(d.user)}</code>.
        `;
      }
    } else {
      if (dot) dot.className = 'dot dot-amber';
      if (text) text.textContent = 'Simulation Mode (No Real Email)';
      if (banner) {
        banner.className = 'alert alert-info';
        banner.style.borderLeft = '4px solid #f59e0b';
        banner.innerHTML = `
          <strong>⚠️ Notification Delivery Inactive:</strong> Inquiries are currently only logged to the server terminal. Enter your Gmail and 16-character Google App Password below to activate live email notifications.
        `;
      }
    }
  } catch (err) {
    console.error('Failed to load email settings:', err);
  }
}

// Email Provider Dropdown Handler
const providerSelect = document.getElementById('email-provider');
if (providerSelect) {
  providerSelect.addEventListener('change', () => {
    const val = providerSelect.value;
    const passLabel = document.getElementById('smtp-pass-label');
    const passHint = document.getElementById('smtp-pass-hint');
    const customFields = document.getElementById('custom-smtp-fields');
    const web3Fields = document.getElementById('web3forms-fields');
    const smtpFields = document.getElementById('smtp-credential-fields');
    const userInput = document.getElementById('smtp-user');
    const passInput = document.getElementById('smtp-pass');

    if (val === 'web3forms') {
      if (web3Fields) web3Fields.style.display = 'block';
      if (smtpFields) smtpFields.style.display = 'none';
      if (customFields) customFields.style.display = 'none';
      if (userInput) userInput.required = false;
      if (passInput) passInput.required = false;
    } else {
      if (web3Fields) web3Fields.style.display = 'none';
      if (smtpFields) smtpFields.style.display = 'block';
      if (userInput) userInput.required = true;
      if (passInput) passInput.required = true;

      if (val === 'gmail') {
        if (passLabel) passLabel.textContent = 'Google App Password (16 Letters)';
        if (passHint) passHint.textContent = 'For Gmail, generate a 16-letter Google App Password (not normal login password).';
        if (userInput) userInput.placeholder = 'e.g. yourbusiness@gmail.com';
        if (customFields) customFields.style.display = 'none';
      } else if (val === 'outlook') {
        if (passLabel) passLabel.textContent = 'Outlook Account Password';
        if (passHint) passHint.textContent = 'Enter your Microsoft Outlook / Hotmail password.';
        if (userInput) userInput.placeholder = 'e.g. jagdishhandloom@outlook.com';
        if (customFields) customFields.style.display = 'none';
      } else if (val === 'zoho') {
        if (passLabel) passLabel.textContent = 'Zoho Mail Password / App Password';
        if (passHint) passHint.textContent = 'Enter your Zoho Mail account password or app-specific password.';
        if (userInput) userInput.placeholder = 'e.g. orders@yourdomain.com or user@zoho.in';
        if (customFields) customFields.style.display = 'none';
      } else if (val === 'yahoo') {
        if (passLabel) passLabel.textContent = 'Yahoo App Password';
        if (passHint) passHint.textContent = 'Generate an App Password from your Yahoo Account Security settings.';
        if (userInput) userInput.placeholder = 'e.g. yourbusiness@yahoo.com';
        if (customFields) customFields.style.display = 'none';
      } else if (val === 'custom') {
        if (passLabel) passLabel.textContent = 'Mailbox Password';
        if (passHint) passHint.textContent = 'Enter the password for your webmail inbox, plus server host and port.';
        if (userInput) userInput.placeholder = 'e.g. info@jagdishcarpets.com';
        if (customFields) customFields.style.display = 'block';
      }
    }
  });
}

// Save Email Settings
const emailForm = document.getElementById('email-settings-form');
if (emailForm) {
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-email-btn');
    const origText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const smtpUser = document.getElementById('smtp-user').value.trim();
    const smtpPass = document.getElementById('smtp-pass').value.trim();
    const notificationEmail = document.getElementById('notification-email').value.trim();
    const hostInput = document.getElementById('smtp-host');
    const portInput = document.getElementById('smtp-port');
    const smtpHost = hostInput ? hostInput.value.trim() : '';
    const smtpPort = portInput ? portInput.value.trim() : '';
    const web3Input = document.getElementById('web3-key');
    const web3Key = web3Input ? web3Input.value.trim() : '';

    try {
      const res = await apiCall('/admin/email-settings', {
        method: 'POST',
        body: JSON.stringify({ smtpUser, smtpPass, notificationEmail, smtpHost, smtpPort, web3Key }),
      });
      showToast(res.message || 'Notification settings saved!', 'success');
      loadEmailSettings();
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = origText;
    }
  });
}

// Test Email Notification Button
const testEmailBtn = document.getElementById('test-email-btn');
if (testEmailBtn) {
  testEmailBtn.addEventListener('click', async () => {
    const origText = testEmailBtn.textContent;
    testEmailBtn.disabled = true;
    testEmailBtn.textContent = '⏳ Testing Gmail Connection...';

    const notifEmail = document.getElementById('notification-email').value.trim() || document.getElementById('smtp-user').value.trim();

    try {
      const res = await apiCall('/admin/test-email', {
        method: 'POST',
        body: JSON.stringify({ targetEmail: notifEmail }),
      });
      showToast(res.message || `Test email sent to ${notifEmail}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send test email', 'error');
      if (err.data && err.data.help) {
        alert('⚠️ Google Gmail Notice:\n\n' + err.data.help);
      }
    } finally {
      testEmailBtn.disabled = false;
      testEmailBtn.textContent = origText;
    }
  });
}

// Initial Boot
checkAuth();

// Auto-Poll new leads every 12 seconds when logged in
setInterval(() => {
  if (authToken) {
    loadStats();
  }
}, 12000);
