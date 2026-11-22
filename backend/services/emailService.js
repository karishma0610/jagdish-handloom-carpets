const nodemailer = require('nodemailer');

let transporter = null;

const resetTransporter = () => {
  transporter = null;
};

const getTransporter = async () => {
  if (transporter) return transporter;

  const host = (process.env.SMTP_HOST || '').trim();
  const user = (process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || '').trim();
  // Strip whitespace from Google App Passwords (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
  const pass = rawPass.replace(/\s+/g, '');
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (user && pass) {
    const lowerUser = user.toLowerCase();
    const lowerHost = (host || '').toLowerCase();

    const isGmail = (!host || lowerHost.includes('gmail')) && lowerUser.includes('gmail');
    const isOutlook = lowerHost.includes('outlook') || lowerHost.includes('office365') || lowerUser.includes('outlook.com') || lowerUser.includes('hotmail.com');
    const isYahoo = lowerHost.includes('yahoo') || lowerUser.includes('yahoo.com');
    const isZoho = lowerHost.includes('zoho') || lowerUser.includes('zoho.');
    
    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
      console.log(`[Email] Configured with Gmail service (${user})`);
    } else if (isOutlook) {
      transporter = nodemailer.createTransport({
        service: 'hotmail',
        auth: { user, pass },
      });
      console.log(`[Email] Configured with Outlook/Hotmail service (${user})`);
    } else if (isYahoo) {
      transporter = nodemailer.createTransport({
        service: 'yahoo',
        auth: { user, pass },
      });
      console.log(`[Email] Configured with Yahoo service (${user})`);
    } else {
      const targetHost = host || (isZoho ? 'smtp.zoho.in' : 'smtp.gmail.com');
      transporter = nodemailer.createTransport({
        host: targetHost,
        port: port || (secure ? 465 : 587),
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
      console.log(`[Email] Configured with custom SMTP host: ${targetHost}:${port}`);
    }
  } else {
    // Safe mock transporter that logs emails to console
    console.log('[Email] Running in simulation/preview mode (set SMTP_USER and SMTP_PASS in .env or admin panel for real Gmail delivery).');
    transporter = {
      isSimulated: true,
      sendMail: async (mailOptions) => {
        console.log('\n================== [OUTGOING EMAIL NOTIFICATION] ==================');
        console.log(`To:      ${mailOptions.to}`);
        console.log(`From:    ${mailOptions.from || process.env.FROM_EMAIL}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log('-------------------------------------------------------------------');
        console.log(mailOptions.text || (mailOptions.html ? mailOptions.html.replace(/<[^>]*>?/gm, ' ').slice(0, 300) : '') + '...');
        console.log('===================================================================\n');
        return { messageId: 'simulated-' + Date.now(), simulated: true };
      },
      verify: async () => true,
    };
  }

  return transporter;
};

const getEmailConfigStatus = () => {
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const notif = (process.env.NOTIFICATION_EMAIL || '').trim();
  const web3Key = (process.env.WEB3FORMS_KEY || '').trim();
  const isWeb3 = Boolean(web3Key);
  const isSmtp = Boolean(user && pass);
  const isConfigured = isSmtp || isWeb3;
  const isGmail = isSmtp && user.toLowerCase().includes('gmail');

  return {
    configured: isConfigured,
    mode: isWeb3 ? 'web3forms_cloud' : (isConfigured ? (isGmail ? 'gmail_live' : 'smtp_live') : 'simulation'),
    user: isWeb3 ? 'Cloud Relay Key' : (user ? user.replace(/(.{2})(.*)(@.*)/, '$1***$3') : ''),
    rawUser: user,
    notificationEmail: notif || user || 'Not set',
    host: isWeb3 ? 'api.web3forms.com (No password needed)' : (process.env.SMTP_HOST || (isGmail ? 'smtp.gmail.com' : 'Not set')),
    web3Key: web3Key ? web3Key.slice(0, 8) + '...' : '',
  };
};

const sendTestNotification = async (targetEmail) => {
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const web3Key = (process.env.WEB3FORMS_KEY || '').trim();
  const to = targetEmail || process.env.NOTIFICATION_EMAIL || user;

  // 1. If Web3Forms Zero-Password Key is provided
  if (web3Key) {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: web3Key,
        subject: '🧪 Test Lead Notification — Jagdish Handloom Carpets',
        from_name: 'Jagdish Handloom Carpets',
        message: 'Your website notification system is now ACTIVE and connected via Web3Forms Cloud Relay! When a customer places an inquiry, you will receive full details here.',
      }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Web3Forms key rejected. Please check your key at web3forms.com.');
    }
    return { success: true, to: 'Your Email (via Cloud Key)', messageId: 'web3forms-' + Date.now() };
  }

  // 2. Standard SMTP / Gmail
  if (!user || !pass) {
    throw new Error('No email credentials found. Please enter your email credentials or a free Web3Forms cloud key.');
  }

  const t = await getTransporter();
  
  // Verify credentials first
  if (t.verify) {
    await t.verify();
  }

  const fromSender = process.env.FROM_EMAIL || `"Jagdish Handloom Carpets" <${user}>`;

  const info = await t.sendMail({
    from: fromSender,
    to,
    subject: '🧪 Test Notification — Jagdish Handloom Carpets',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #DDD4C2; border-radius: 8px; overflow: hidden; background: #FAF7F2;">
        <div style="background-color: #3B2A1A; color: #F8F3EB; padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #C49A45; font-family: Georgia, serif;">Jagdish Handloom Carpets</h2>
          <p style="margin: 6px 0 0; font-size: 13px; letter-spacing: 1px; color: #EDE4D4;">EMAIL NOTIFICATION TEST SUCCESSFUL</p>
        </div>
        <div style="padding: 24px; color: #3B2A1A;">
          <p style="font-size: 16px;"><strong>Greetings!</strong></p>
          <p>Your notification system is now <strong>active and working correctly</strong>.</p>
          <div style="background: #ffffff; padding: 14px 18px; border-left: 4px solid #2E7D32; border-radius: 4px; margin: 18px 0;">
            <p style="margin: 0 0 6px; font-weight: bold; color: #2E7D32;">✔ Real-Time Leads Active</p>
            <p style="margin: 0; font-size: 14px; color: #555;">Whenever a customer submits a contact inquiry or wholesale booking request on your website, you will instantly receive full lead details at this email.</p>
          </div>
          <p style="font-size: 13px; color: #8C7B68; margin-top: 20px;">Sent at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
      </div>
    `,
  });

  return { success: true, to, messageId: info.messageId };
};

// 1. Notify Admin of new Enquiry
const sendEnquiryNotificationToAdmin = async (enquiry) => {
  const web3Key = (process.env.WEB3FORMS_KEY || '').trim();

  // If using Web3Forms Zero-Password Key
  if (web3Key) {
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: web3Key,
          subject: `🧶 New Website Lead: ${enquiry.name} (${enquiry.category})`,
          from_name: 'Jagdish Handloom Carpets',
          'Customer Name': enquiry.name,
          'Company': enquiry.company || 'Direct Buyer',
          'Phone / WhatsApp': enquiry.phone,
          'Email': enquiry.email || 'Not provided',
          'Product Interest': enquiry.category,
          'Quantity Needed': enquiry.quantity || 'Wholesale',
          'Customer Message': enquiry.message || 'No additional note',
          'Admin Dashboard': 'http://localhost:5000/admin',
        }),
      });
      console.log('[Email] Forwarded lead via Web3Forms Cloud Relay');
      return;
    } catch (e) {
      console.error('[Web3Forms Error]', e.message);
    }
  }

  try {
    const t = await getTransporter();
    const adminEmail = process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'jagdishandloom.carpets@email.com';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #DDD4C2; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #3B2A1A; color: #F8F3EB; padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #C49A45; font-family: Georgia, serif;">Jagdish Handloom Carpets</h2>
          <p style="margin: 5px 0 0; font-size: 14px; letter-spacing: 1px;">NEW WEBSITE ENQUIRY RECEIVED</p>
        </div>
        <div style="padding: 24px; background-color: #F8F3EB; color: #3B2A1A;">
          <h3 style="margin-top: 0; color: #A85C38;">Client Details</h3>
          <p><strong>Name:</strong> ${enquiry.name}</p>
          <p><strong>Company:</strong> ${enquiry.company || 'Individual Buyer'}</p>
          <p><strong>Phone / WhatsApp:</strong> <a href="tel:${enquiry.phone}">${enquiry.phone}</a></p>
          <p><strong>Email:</strong> ${enquiry.email ? `<a href="mailto:${enquiry.email}">${enquiry.email}</a>` : 'Not provided'}</p>
          <p><strong>Product Interest:</strong> ${enquiry.category}</p>
          <p><strong>Quantity:</strong> ${enquiry.quantity || 'Not specified'}</p>
          <div style="margin-top: 16px; padding: 14px; background-color: #EDE4D4; border-left: 4px solid #A85C38; border-radius: 4px;">
            <strong>Message / Requirements:</strong>
            <p style="margin: 8px 0 0; white-space: pre-wrap;">${enquiry.message || 'No additional message provided.'}</p>
          </div>
          <div style="margin-top: 24px; text-align: center;">
            <a href="http://localhost:5000/admin" style="background-color: #A85C38; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Open in Admin Panel</a>
          </div>
        </div>
        <div style="background-color: #EDE4D4; padding: 12px; text-align: center; font-size: 12px; color: #8C7B68;">
          Jagdish Handloom Carpets · Panipat / Haryana, India
        </div>
      </div>
    `;

    const smtpUser = (process.env.SMTP_USER || '').trim();
    const defaultFrom = smtpUser ? `"Jagdish Handloom Carpets" <${smtpUser}>` : '"Jagdish Handloom Carpets" <noreply@jagdishcarpets.com>';

    await t.sendMail({
      from: process.env.FROM_EMAIL || defaultFrom,
      to: adminEmail,
      subject: `🧶 New Enquiry from ${enquiry.name} (${enquiry.category})`,
      html,
    });
  } catch (err) {
    console.error('[Email] Failed to send admin enquiry notification:', err.message);
  }
};

// 2. Send confirmation to Customer
const sendEnquiryConfirmationToCustomer = async (enquiry) => {
  if (!enquiry.email) return;

  try {
    const t = await getTransporter();
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #DDD4C2; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #3B2A1A; color: #F8F3EB; padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #C49A45; font-family: Georgia, serif;">Jagdish Handloom Carpets</h2>
          <p style="margin: 5px 0 0; font-size: 13px;">Crafted by Hand, Built to Last</p>
        </div>
        <div style="padding: 24px; background-color: #F8F3EB; color: #3B2A1A;">
          <p>Dear <strong>${enquiry.name}</strong>,</p>
          <p>Thank you for reaching out to <strong>Jagdish Handloom Carpets</strong>. We have received your enquiry regarding <strong>${enquiry.category}</strong>.</p>
          <p>Our team will review your requirements and get in touch with you shortly via phone/WhatsApp (${enquiry.phone}) or email.</p>
          
          <div style="margin: 20px 0; padding: 14px; background-color: #EDE4D4; border-radius: 4px;">
            <p style="margin: 0 0 8px;"><strong>Summary of your enquiry:</strong></p>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Product: ${enquiry.category}</li>
              <li>Quantity: ${enquiry.quantity || 'Wholesale Enquiry'}</li>
            </ul>
          </div>

          <p>For urgent questions or quick samples, feel free to WhatsApp us directly at <strong>+91 9253730103</strong>.</p>
          <p style="margin-top: 24px;">Warm regards,<br/><strong>Jagdish Handloom Team</strong></p>
        </div>
        <div style="background-color: #EDE4D4; padding: 12px; text-align: center; font-size: 12px; color: #8C7B68;">
          © 2026 Jagdish Handloom Carpets · Panipat / Haryana, India
        </div>
      </div>
    `;

    const smtpUser = (process.env.SMTP_USER || '').trim();
    const defaultFrom = smtpUser ? `"Jagdish Handloom Carpets" <${smtpUser}>` : '"Jagdish Handloom Carpets" <noreply@jagdishcarpets.com>';

    await t.sendMail({
      from: process.env.FROM_EMAIL || defaultFrom,
      to: enquiry.email,
      subject: `Thank you for contacting Jagdish Handloom Carpets!`,
      html,
    });
  } catch (err) {
    console.error('[Email] Failed to send customer enquiry confirmation:', err.message);
  }
};

// 3. Notify Admin of new Order/Booking
const sendOrderNotificationToAdmin = async (order) => {
  const web3Key = (process.env.WEB3FORMS_KEY || '').trim();
  if (web3Key) {
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: web3Key,
          subject: `📦 New Order Booking #${order.orderNumber} - ${order.customer.name}`,
          from_name: 'Jagdish Handloom Carpets',
          'Order Number': '#' + order.orderNumber,
          'Customer Name': order.customer.name,
          'Phone': order.customer.phone,
          'City': order.customer.address ? `${order.customer.address.city}, ${order.customer.address.state}` : 'N/A',
          'Quantity': order.totalQuantity + ' pcs',
          'Admin Dashboard': 'http://localhost:5000/admin',
        }),
      });
      console.log('[Email] Forwarded order booking via Web3Forms');
      return;
    } catch (e) {
      console.error('[Web3Forms Order Error]', e.message);
    }
  }

  try {
    const t = await getTransporter();
    const adminEmail = process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'jagdishandloom.carpets@email.com';

    const itemsHtml = order.items
      .map(
        (it) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #DDD4C2;">${it.productTitle}</td>
          <td style="padding: 8px; border-bottom: 1px solid #DDD4C2;">${it.size}</td>
          <td style="padding: 8px; border-bottom: 1px solid #DDD4C2; text-align: center;">${it.quantity}</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #DDD4C2; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #3B2A1A; color: #F8F3EB; padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #C49A45; font-family: Georgia, serif;">Jagdish Handloom Carpets</h2>
          <p style="margin: 5px 0 0; font-size: 14px; letter-spacing: 1px;">NEW ORDER / QUOTE REQUEST #${order.orderNumber}</p>
        </div>
        <div style="padding: 24px; background-color: #F8F3EB; color: #3B2A1A;">
          <h3 style="margin-top: 0; color: #A85C38;">Customer Details</h3>
          <p><strong>Name:</strong> ${order.customer.name}</p>
          <p><strong>Company:</strong> ${order.customer.company || 'N/A'}</p>
          <p><strong>Phone:</strong> <a href="tel:${order.customer.phone}">${order.customer.phone}</a></p>
          <p><strong>Email:</strong> ${order.customer.email || 'N/A'}</p>
          <p><strong>Shipping Location:</strong> ${order.customer.address ? `${order.customer.address.city}, ${order.customer.address.state}` : 'N/A'}</p>

          <h3 style="color: #A85C38; margin-top: 20px;">Ordered Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
            <thead>
              <tr style="background-color: #EDE4D4; text-align: left;">
                <th style="padding: 8px;">Carpet</th>
                <th style="padding: 8px;">Size</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 24px; text-align: center;">
            <a href="http://localhost:5000/admin" style="background-color: #A85C38; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Manage in Admin</a>
          </div>
        </div>
      </div>
    `;

    const smtpUser = (process.env.SMTP_USER || '').trim();
    const defaultFrom = smtpUser ? `"Jagdish Handloom Carpets" <${smtpUser}>` : '"Jagdish Handloom Carpets" <noreply@jagdishcarpets.com>';

    await t.sendMail({
      from: process.env.FROM_EMAIL || defaultFrom,
      to: adminEmail,
      subject: `📦 New Order Request #${order.orderNumber} from ${order.customer.name}`,
      html,
    });
  } catch (err) {
    console.error('[Email] Failed to send admin order notification:', err.message);
  }
};

// 4. Send Order Confirmation to Customer
const sendOrderConfirmationToCustomer = async (order) => {
  if (!order.customer.email) return;

  try {
    const t = await getTransporter();
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #DDD4C2; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #3B2A1A; color: #F8F3EB; padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #C49A45; font-family: Georgia, serif;">Jagdish Handloom Carpets</h2>
          <p style="margin: 5px 0 0; font-size: 13px;">Crafted by Hand, Built to Last</p>
        </div>
        <div style="padding: 24px; background-color: #F8F3EB; color: #3B2A1A;">
          <p>Dear <strong>${order.customer.name}</strong>,</p>
          <p>Thank you for placing your order/booking request with <strong>Jagdish Handloom Carpets</strong>.</p>
          <p>Your Order Reference Number is: <strong style="color: #A85C38; font-size: 16px;">#${order.orderNumber}</strong></p>
          <p>Our team will confirm stock/production timelines and coordinate delivery details with you shortly.</p>
          <p>Feel free to reach out to us on WhatsApp at <strong>+91 9253730103</strong> quoting your order number.</p>
          <p style="margin-top: 24px;">Warm regards,<br/><strong>Jagdish Handloom Team</strong></p>
        </div>
      </div>
    `;

    const smtpUser = (process.env.SMTP_USER || '').trim();
    const defaultFrom = smtpUser ? `"Jagdish Handloom Carpets" <${smtpUser}>` : '"Jagdish Handloom Carpets" <noreply@jagdishcarpets.com>';

    await t.sendMail({
      from: process.env.FROM_EMAIL || defaultFrom,
      to: order.customer.email,
      subject: `Order Request Confirmation #${order.orderNumber} - Jagdish Handloom Carpets`,
      html,
    });
  } catch (err) {
    console.error('[Email] Failed to send customer order confirmation:', err.message);
  }
};

module.exports = {
  sendEnquiryNotificationToAdmin,
  sendEnquiryConfirmationToCustomer,
  sendOrderNotificationToAdmin,
  sendOrderConfirmationToCustomer,
  resetTransporter,
  getEmailConfigStatus,
  sendTestNotification,
};
