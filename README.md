# Jagdish Handloom Carpets — Full Stack System

Complete, production-ready website and backend management system for **Jagdish Handloom Carpets** (Handloom Manufacturer, Haryana, India).

---

## 🌟 System Features

### 1. Client Showcase Website (`/` & `index.html`)
- **Heritage Design**: Warm luxury aesthetic featuring Playfair Display typography and authentic handloom visuals.
- **Dynamic Carpet Catalog**: Auto-loads live products from the database (`/api/products`).
- **Interactive Enquiries**: Contact and bulk inquiry form connected to `POST /api/enquiries` with real-time validation and feedback toasts.
- **One-Click Quote / Booking Modal**: Customers can request bespoke or wholesale quotes by selecting sizes, quantities, and delivery cities.

### 2. Powerful Admin Portal (`/admin`)
- **Direct Link**: [http://localhost:5000/admin](http://localhost:5000/admin)
- **Secure Authentication**: JWT-based session protection with bcrypt hashed passwords.
- **Default Login**:
  - **Email**: `admin@jagdishcarpets.com`
  - **Password**: `Admin@12345`
- **Dashboard Overview**: Key metrics (total inquiries, pending bookings, active carpets) and recent activity feed.
- **Enquiry Manager**:
  - Filter by status (`New`, `Contacted`, `In Progress`, `Closed`).
  - Search by client name, phone, message, or company.
  - **Direct WhatsApp button**: Generates an instant WhatsApp message to the customer.
  - Add internal admin notes and update statuses with auto-save.
- **Orders & Bookings Manager**:
  - Manage wholesale quotes and orders with item quantities, customer address, and specs.
  - Track progression (`Pending` → `Confirmed` → `In Production` → `Dispatched` → `Delivered`).
- **Product Catalog Manager**:
  - Add new carpets with photo uploads or external image URLs.
  - Set wholesale price ranges, materials, tags (`Wholesale Available`, `Custom Sizes`, etc.), and toggle in-stock status.
- **Settings**: Update admin password and configure loom business details.

### 3. Automated Email Service (Nodemailer)
- **Customer Confirmation**: Sends receipt and reference number to customer inbox upon inquiry/order submission.
- **Owner Notification**: Alerts business email (`jagdishandloom.carpets@email.com`) immediately when a new lead or quote request arrives.
- **Safe Simulation Mode**: If SMTP is not yet configured, emails are cleanly formatted and logged in the terminal with full headers and body preview without throwing errors.

---

## 🚀 How to Run

### Quick Start (Windows)
Double-click `start-website.bat` in the root folder to start the server and automatically launch the website in your browser.

Alternatively, you can run `start-backend.bat` or run via terminal:

```bash
cd backend
npm install
node server.js
```

The server runs on **http://localhost:5000**:
- **Website**: [http://localhost:5000/](http://localhost:5000/)
- **Admin Portal**: [http://localhost:5000/admin](http://localhost:5000/admin)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## ⚙️ Environment Configuration (`backend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Web server port | `5000` |
| `MONGO_URI` | MongoDB Connection String | `mongodb://127.0.0.1:27017/carpet_db` |
| `JWT_SECRET` | Secret key for admin JWT tokens | Configured |
| `ADMIN_EMAIL` | Default seeded admin email | `admin@jagdishcarpets.com` |
| `ADMIN_PASSWORD` | Default seeded admin password | `Admin@12345` |
| `SMTP_HOST` | Email SMTP Server (e.g. smtp.gmail.com) | *(Optional)* |
| `SMTP_PORT` | SMTP Port (587 or 465) | `587` |
| `SMTP_USER` | Email username/address | *(Optional)* |
| `SMTP_PASS` | Email password/app password | *(Optional)* |
| `NOTIFICATION_EMAIL` | Admin alert destination email | `jagdishandloom.carpets@email.com` |

---

## 📡 REST API Reference

### Public Endpoints
- `GET /api/health` — Check server & database status
- `GET /api/products` — Retrieve active carpet catalog
- `GET /api/products/:id` — Retrieve single carpet detail
- `POST /api/enquiries` — Submit new customer inquiry
- `POST /api/orders` — Place new quote/booking request

### Admin Endpoints (Require `Authorization: Bearer <token>`)
- `POST /api/auth/login` — Admin login & token generation
- `GET /api/auth/me` — Verify active admin session
- `PUT /api/auth/update-password` — Change password
- `GET /api/admin/stats` — Dashboard metrics & recent feeds
- `GET /api/enquiries` — List inquiries (with status/search filters)
- `PATCH /api/enquiries/:id` — Update inquiry status & internal notes
- `DELETE /api/enquiries/:id` — Remove inquiry
- `GET /api/orders` — List orders (with status/search filters)
- `PATCH /api/orders/:id` — Update order status & payment status
- `DELETE /api/orders/:id` — Remove order
- `POST /api/products` — Add new carpet (supports image upload)
- `PUT /api/products/:id` — Edit carpet details & image
- `DELETE /api/products/:id` — Delete carpet from catalog
