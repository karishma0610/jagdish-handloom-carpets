// Jagdish Handloom Carpets — Client Integration Script
(function () {
  const API_BASE = window.location.origin.includes('localhost')
    ? window.location.origin + '/api'
    : 'http://localhost:5000/api';

  // Inject Toast Notification Container and Order Modal into document
  window.addEventListener('DOMContentLoaded', () => {
    setupUIElements();
    setupEnquiryForm();
    loadDynamicProducts();
  });

  function setupUIElements() {
    // 1. Toast container
    if (!document.getElementById('client-toast-container')) {
      const toastContainer = document.createElement('div');
      toastContainer.id = 'client-toast-container';
      toastContainer.style.cssText = `
        position: fixed; top: 24px; right: 24px; z-index: 99999;
        display: flex; flex-direction: column; gap: 12px; pointer-events: none;
      `;
      document.body.appendChild(toastContainer);
    }

    // 2. Order Modal
    if (!document.getElementById('order-quote-modal')) {
      const modal = document.createElement('div');
      modal.id = 'order-quote-modal';
      modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(36,25,15,0.7); backdrop-filter: blur(6px);
        display: none; align-items: center; justify-content: center; z-index: 9999; padding: 20px;
      `;
      modal.innerHTML = `
        <div style="background: #F8F3EB; max-width: 520px; width: 100%; border-radius: 6px; border: 1px solid #DDD4C2; box-shadow: 0 20px 40px rgba(0,0,0,0.3); overflow: hidden; font-family: 'Jost', sans-serif;">
          <div style="padding: 1.2rem 1.6rem; background: #1A1108; color: #fff; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 0.65rem; color: #F7D26D; letter-spacing: 2px; text-transform: uppercase;">Wholesale & Custom Booking</span>
              <h3 id="modal-product-name" style="font-family: 'Playfair Display', serif; font-size: 1.3rem; margin-top: 2px; color: #F8F3EB;">Request Carpet Quote</h3>
            </div>
            <button id="close-order-modal" style="background: none; border: none; color: #EDE4D4; font-size: 1.8rem; cursor: pointer; line-height: 1;">&times;</button>
          </div>
          <form id="order-booking-form" style="padding: 1.6rem; display: flex; flex-direction: column; gap: 14px; max-height: 80vh; overflow-y: auto;">
            <input type="hidden" id="order-product-id" />
            <input type="hidden" id="order-product-title" />
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: #1A1209;">Your Name *</label>
                <input type="text" id="order-cust-name" required placeholder="Full Name" style="width: 100%; padding: 8px 12px; border: 1px solid #DDD4C2; border-radius: 3px; font-size: 0.9rem;" />
              </div>
              <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: #1A1209;">Phone / WhatsApp *</label>
                <input type="tel" id="order-cust-phone" required placeholder="+91 ..." style="width: 100%; padding: 8px 12px; border: 1px solid #DDD4C2; border-radius: 3px; font-size: 0.9rem;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: #1A1209;">Company / Firm</label>
                <input type="text" id="order-cust-company" placeholder="Business Name" style="width: 100%; padding: 8px 12px; border: 1px solid #DDD4C2; border-radius: 3px; font-size: 0.9rem;" />
              </div>
              <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: #1A1209;">Email Address</label>
                <input type="email" id="order-cust-email" placeholder="email@domain.com" style="width: 100%; padding: 8px 12px; border: 1px solid #DDD4C2; border-radius: 3px; font-size: 0.9rem;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: #1A1209;">Carpet Size</label>
                <select id="order-carpet-size" style="width: 100%; padding: 8px 12px; border: 1.5px solid #DDD4C2; border-radius: 3px; font-size: 0.9rem; background: #fff; color: #1A1209; font-weight: 500;">
                  <option value="2x6 Feet">2 × 6 Feet (Runner / Accent)</option>
                  <option value="3x5 Feet">3 × 5 Feet</option>
                  <option value="4x6 Feet">4 × 6 Feet</option>
                  <option value="5x7 Feet">5 × 7 Feet</option>
                  <option value="5x8 Feet" selected>5 × 8 Feet (Most Popular)</option>
                  <option value="6x8 Feet">6 × 8 Feet</option>
                  <option value="6x9 Feet">6 × 9 Feet</option>
                  <option value="7x10 Feet">7 × 10 Feet</option>
                  <option value="8x10 Feet">8 × 10 Feet (Living / Dining)</option>
                  <option value="8x11 Feet">8 × 11 Feet</option>
                  <option value="9x12 Feet">9 × 12 Feet (Grand Room)</option>
                  <option value="10x12 Feet">10 × 12 Feet</option>
                  <option value="10x13 Feet">10 × 13 Feet</option>
                  <option value="10x14 Feet">10 × 14 Feet</option>
                  <option value="12x15 Feet">12 × 15 Feet (Villa / Lobby)</option>
                  <option value="12x18 Feet">12 × 18 Feet (Grand Suite)</option>
                  <option value="Custom Size" style="color: #B84A28; font-weight: 700;">✦ Custom Size (Any Dimension)</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: #1A1209;">Quantity (Pieces) *</label>
                <input type="number" id="order-qty" min="1" value="1" required style="width: 100%; padding: 8px 12px; border: 1px solid #DDD4C2; border-radius: 3px; font-size: 0.9rem;" />
              </div>
            </div>

            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #1A1209;">Delivery City & State</label>
              <input type="text" id="order-city-state" placeholder="e.g. Delhi, NCR" style="width: 100%; padding: 8px 12px; border: 1px solid #DDD4C2; border-radius: 3px; font-size: 0.9rem;" />
            </div>

            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #1A1209;">Special Weave / Color Requirements</label>
              <textarea id="order-notes" rows="2" placeholder="Custom color motif, wool blend, urgency..." style="width: 100%; padding: 8px 12px; border: 1px solid #DDD4C2; border-radius: 3px; font-size: 0.9rem; resize: vertical;"></textarea>
            </div>

            <button type="submit" id="order-submit-btn" style="background: #A85C38; color: #fff; padding: 12px 20px; border: none; border-radius: 3px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 8px;">
              Submit Booking / Quote Request →
            </button>
          </form>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('close-order-modal').addEventListener('click', () => {
        modal.style.display = 'none';
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });

      // Submit Order Booking
      document.getElementById('order-booking-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('order-submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting Request...';

        const payload = {
          customer: {
            name: document.getElementById('order-cust-name').value,
            company: document.getElementById('order-cust-company').value,
            phone: document.getElementById('order-cust-phone').value,
            email: document.getElementById('order-cust-email').value,
            address: {
              city: document.getElementById('order-city-state').value,
            },
          },
          items: [
            {
              productId: document.getElementById('order-product-id').value || null,
              productTitle: document.getElementById('order-product-title').value,
              size: document.getElementById('order-carpet-size').value,
              quantity: parseInt(document.getElementById('order-qty').value, 10) || 1,
              specialInstructions: document.getElementById('order-notes').value,
            },
          ],
          totalQuantity: parseInt(document.getElementById('order-qty').value, 10) || 1,
        };

        try {
          const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to submit order');

          modal.style.display = 'none';
          document.getElementById('order-booking-form').reset();
          showClientToast(`🎉 Order Request #${data.data.orderNumber} placed!`, 'success');
          showEnquirySuccessModal(
            payload.customer.name,
            payload.customer.phone,
            payload.items[0]?.productTitle || 'Custom Carpet Quote',
            (payload.items[0]?.quantity || 1) + ' pcs',
            payload.items[0]?.specialInstructions || ('Order Ref #' + (data.data?.orderNumber || ''))
          );
        } catch (err) {
          showClientToast(err.message, 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Booking / Quote Request →';
        }
      });
    }
  }

  // Toast Function
  function showClientToast(message, type = 'info') {
    const container = document.getElementById('client-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#2E7D32' : type === 'error' ? '#C62828' : '#3B2A1A';
    toast.style.cssText = `
      background: ${bgColor}; color: #fff; padding: 14px 22px; border-radius: 4px;
      font-size: 0.95rem; font-family: 'Jost', sans-serif; box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      border-left: 4px solid #C49A45; pointer-events: auto; animation: fadeUp 0.3s ease;
      max-width: 380px; line-height: 1.4;
    `;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  // Instant WhatsApp Lead Forwarding Modal
  function showEnquirySuccessModal(name, phone, category, quantity, message) {
    const waText = encodeURIComponent(
      `Hello Jagdish Handloom Carpets,\n\nI have submitted an inquiry on your website:\n` +
      `👤 Name: ${name}\n` +
      `📞 Phone: ${phone}\n` +
      `🧶 Interested In: ${category || 'Handloom Carpets'}\n` +
      (quantity ? `📦 Quantity: ${quantity}\n` : '') +
      (message ? `📝 Requirements: ${message}\n` : '')
    );
    const waUrl = `https://wa.me/919253730103?text=${waText}`;

    const old = document.getElementById('enquiry-success-modal');
    if (old) old.remove();

    const safeName = (name || 'Customer').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safePhone = (phone || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const modal = document.createElement('div');
    modal.id = 'enquiry-success-modal';
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(36,25,15,0.78); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center; z-index: 100000; padding: 20px;
    `;
    modal.innerHTML = `
      <div style="background: #F8F3EB; max-width: 480px; width: 100%; border-radius: 8px; border: 1px solid #DDD4C2; box-shadow: 0 20px 45px rgba(0,0,0,0.35); padding: 28px 24px; text-align: center; position: relative;">
        <div style="width: 58px; height: 58px; background: #e8f5e9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; font-size: 28px; border: 2px solid #81c784;">
          ✔
        </div>
        <h3 style="font-family: 'Playfair Display', Georgia, serif; font-size: 1.55rem; color: #1A1209; margin-bottom: 8px;">Enquiry Received!</h3>
        <p style="font-size: 0.92rem; color: #665; line-height: 1.6; margin-bottom: 18px;">
          Thank you, <strong>${safeName}</strong>! Your inquiry is safely recorded with our Panipat works.
        </p>
        <div style="background: #EDE4D4; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; text-align: left; font-size: 0.86rem; color: #1A1209; border-left: 4px solid #A85C38;">
          <p style="margin: 0 0 4px;"><strong>📞 Phone / WhatsApp:</strong> ${safePhone}</p>
          <p style="margin: 0;"><strong>🧶 Carpet Interest:</strong> ${category || 'Handloom Carpets'}</p>
        </div>
        <a href="${waUrl}" target="_blank" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: #25D366; color: #fff; text-decoration: none; padding: 14px 20px; border-radius: 6px; font-weight: 600; font-size: 1rem; margin-bottom: 12px; box-shadow: 0 6px 18px rgba(37,211,102,0.35);">
          <span>💬</span> Send Details to Factory WhatsApp (+91 9253730103)
        </a>
        <button type="button" class="close-enq-modal-btn" style="background: transparent; border: none; color: #8C7B68; font-size: 0.85rem; cursor: pointer; text-decoration: underline;">Close window</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.close-enq-modal-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // Hook into Contact Form
  function setupEnquiryForm() {
    const contactSection = document.getElementById('contact');
    if (!contactSection) return;

    const formContainer = contactSection.querySelector('.contact-form');
    if (!formContainer) return;

    const btn = formContainer.querySelector('button');
    if (!btn) return;

    const inputs = formContainer.querySelectorAll('input');
    const select = formContainer.querySelector('select');
    const textarea = formContainer.querySelector('textarea');

    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      const name = inputs[0] ? inputs[0].value.trim() : '';
      const company = inputs[1] ? inputs[1].value.trim() : '';
      const phone = inputs[2] ? inputs[2].value.trim() : '';
      const email = inputs[3] ? inputs[3].value.trim() : '';
      const category = select ? select.value : '';
      const quantity = inputs[4] ? inputs[4].value.trim() : '';
      const message = textarea ? textarea.value.trim() : '';

      if (!name) {
        showClientToast('Please enter your name.', 'error');
        if (inputs[0]) inputs[0].focus();
        return;
      }

      if (!phone) {
        showClientToast('Please enter your Phone or WhatsApp number.', 'error');
        if (inputs[2]) inputs[2].focus();
        return;
      }

      btn.disabled = true;
      const originalText = btn.textContent;
      btn.textContent = 'Sending Enquiry...';

      try {
        const res = await fetch(`${API_BASE}/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            company,
            phone,
            email,
            category: category || 'General Wholesale Inquiry',
            quantity,
            message,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Submission error');

        showClientToast(data.message || 'Thank you! Your enquiry has been received.', 'success');
        showEnquirySuccessModal(name, phone, category, quantity, message);

        // Reset form inputs
        inputs.forEach((input) => (input.value = ''));
        if (select) select.selectedIndex = 0;
        if (textarea) textarea.value = '';
      } catch (err) {
        showClientToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }

  // Load Products dynamically from Backend
  async function loadDynamicProducts() {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;

    try {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) return; // Keep static products if backend isn't ready
      const data = await res.json();

      if (data.success && data.data && data.data.length > 0) {
        function getCategorySlug(p) {
          const str = ((p.category || '') + ' ' + (p.title || '')).toLowerCase();
          if (str.includes('tufted') || str.includes('cut-pile')) return 'tufted';
          if (str.includes('prayer') || str.includes('janamaz')) return 'prayer';
          if (str.includes('runner') || str.includes('stair') || str.includes('corridor')) return 'runners';
          if (str.includes('dhurrie') || str.includes('flatweave')) return 'dhurrie';
          if (str.includes('jacquard') || str.includes('chenille')) return 'jacquard';
          if (str.includes('bespoke') || str.includes('custom')) return 'custom';
          if (str.includes('wool') || str.includes('traditional') || str.includes('persian') || str.includes('heriz') || str.includes('oushak')) return 'traditional';
          return 'traditional';
        }

        grid.innerHTML = data.data
          .map((p) => {
            const catSlug = getCategorySlug(p);
            const sizesList = Array.isArray(p.sizesAvailable) && p.sizesAvailable.length > 0
              ? p.sizesAvailable.join(' · ')
              : '4×6 · 5×8 · 6×9 · 8×10 ft · Custom';

            const rawImg = p.imageUrl || 'carpet1.jpg';
            const safeTitle = escapeAttr(p.title);
            const safeDesc = escapeAttr(p.description || 'Handcrafted quality wool & dhurrie handloom carpet.');
            const safeMat = escapeAttr(p.material || 'Authentic Handloom Yarn');
            const safeSizes = escapeAttr(sizesList);
            const safePrice = escapeAttr(p.priceRange || 'Contact for Wholesale Price');
            const safeTag = escapeAttr(p.tag || 'Wholesale Available');

            return `
          <div class="product-card" data-category="${catSlug}">
            <div class="product-img-wrap" onclick="window.openCarpetLightbox('${escapeAttr(rawImg)}', '${safeTitle}', '${safeTag}', '${safeDesc}', '${safeSizes}', '${safeMat}', '${safePrice}', '${p._id}')" title="Click to view full uncropped carpet">
              <span class="product-img-badge">${safeTag}</span>
              <img class="product-img" src="${rawImg}" alt="${safeTitle}" onerror="this.src='carpet1.jpg'"/>
              <span class="product-zoom-hint">🔍 View Full Carpet</span>
            </div>
            <div class="product-info">
              <div class="product-header">
                <h3>${p.title}</h3>
              </div>
              <p class="product-desc">${p.description || 'Handcrafted quality wool & dhurrie handloom carpets.'}</p>
              
              <div class="product-specs">
                <div class="spec-row">
                  <span class="spec-label">Sizes:</span>
                  <span class="spec-val">${sizesList}</span>
                </div>
                <div class="spec-row">
                  <span class="spec-label">Material:</span>
                  <span class="spec-val">${p.material || 'Handloom Yarn'}</span>
                </div>
                <div class="spec-row">
                  <span class="spec-label">Price:</span>
                  <span class="spec-val price">${p.priceRange || 'Wholesale Tier'}</span>
                </div>
              </div>

              <div class="product-card-actions">
                <button type="button" class="btn-view-full" onclick="window.openCarpetLightbox('${escapeAttr(rawImg)}', '${safeTitle}', '${safeTag}', '${safeDesc}', '${safeSizes}', '${safeMat}', '${safePrice}', '${p._id}')">
                  🔍 Full View
                </button>
                <button type="button" class="btn-order-quote order-quote-trigger" data-id="${p._id}" data-title="${safeTitle}">
                  Order / Quote →
                </button>
              </div>
            </div>
          </div>`;
          })
          .join('');

        // Attach quote modal triggers
        grid.querySelectorAll('.order-quote-trigger').forEach((button) => {
          button.addEventListener('click', (e) => {
            e.stopPropagation();
            const pId = button.getAttribute('data-id');
            const pTitle = button.getAttribute('data-title');
            openOrderModal(pId, pTitle);
          });
        });
      }
    } catch (err) {
      console.log('[Products] Using static fallback catalog:', err.message);
    }
  }

  // Full Carpet Lightbox Viewer
  function openCarpetLightbox(imgUrl, title, tag, desc, sizes, material, price, productId) {
    let modal = document.getElementById('carpet-lightbox-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'carpet-lightbox-modal';
      modal.className = 'lightbox-modal';
      modal.innerHTML = `
        <div class="lightbox-content">
          <div class="lightbox-header">
            <div class="lightbox-title-wrap">
              <span id="lb-tag">HANDLOOM COLLECTION</span>
              <h3 id="lb-title">Carpet Title</h3>
            </div>
            <button class="lightbox-close" onclick="window.closeCarpetLightbox()" aria-label="Close Preview">&times;</button>
          </div>
          <div class="lightbox-body">
            <div class="lightbox-img-area">
              <img id="lb-img" src="" alt="Full Carpet View" />
            </div>
            <div class="lightbox-details">
              <div class="lightbox-desc" id="lb-desc"></div>
              <div class="lightbox-specs-table">
                <div class="lightbox-spec-item">
                  <strong>Available Sizes:</strong>
                  <span id="lb-sizes"></span>
                </div>
                <div class="lightbox-spec-item">
                  <strong>Weave Material:</strong>
                  <span id="lb-material"></span>
                </div>
                <div class="lightbox-spec-item">
                  <strong>Wholesale Rate:</strong>
                  <span id="lb-price" style="color:#A85C38; font-weight:700;"></span>
                </div>
              </div>
              <div class="lightbox-actions">
                <button type="button" class="btn-order-quote" id="lb-order-btn" style="flex:1; padding:11px 18px; font-size:0.92rem; background:#A85C38; color:#fff; border:none; border-radius:3px; cursor:pointer; font-weight:600;">
                  Request Quote / Order This Carpet →
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) window.closeCarpetLightbox();
      });
      document.body.appendChild(modal);
    }

    document.getElementById('lb-img').src = imgUrl;
    document.getElementById('lb-title').textContent = title || 'Carpet';
    document.getElementById('lb-tag').textContent = tag || 'AUTHENTIC HANDLOOM';
    document.getElementById('lb-desc').textContent = desc || '';
    document.getElementById('lb-sizes').textContent = sizes || '4×6, 5×8, 6×9, 8×10 ft, Custom';
    document.getElementById('lb-material').textContent = material || 'Pure Handloom Yarn';
    document.getElementById('lb-price').textContent = price || 'Contact for Price';

    const orderBtn = document.getElementById('lb-order-btn');
    orderBtn.onclick = () => {
      window.closeCarpetLightbox();
      openOrderModal(productId, title);
    };

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCarpetLightbox() {
    const modal = document.getElementById('carpet-lightbox-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  window.openCarpetLightbox = openCarpetLightbox;
  window.closeCarpetLightbox = closeCarpetLightbox;

  // Handle ESC key to close any modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCarpetLightbox();
      const quoteModal = document.getElementById('order-quote-modal');
      if (quoteModal) quoteModal.style.display = 'none';
    }
  });

  // Open Order Modal
  function openOrderModal(productId, productTitle) {
    const modal = document.getElementById('order-quote-modal');
    if (!modal) return;

    document.getElementById('order-product-id').value = productId || '';
    document.getElementById('order-product-title').value = productTitle || 'Custom Carpet Order';
    document.getElementById('modal-product-name').textContent = productTitle || 'Request Carpet Quote';
    modal.style.display = 'flex';
  }

  // Expose helper globally
  window.openCarpetOrderModal = openOrderModal;

  function escapeAttr(str) {
    return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
})();
