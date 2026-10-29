# PayBridge 💳

PayBridge is a multi-gateway payment processing platform built with a **Node.js/Express** backend and a **React + Vite + Tailwind CSS** frontend. It enables seamless integration and testing for popular Bangladeshi and global payment gateways including **bKash**, **SSLCommerz**, and **Stripe**.

---

## 🚀 Features

- **Multi-Gateway Support**:
  - **bKash**: Tokenized checkout (grant token, create payment, callback verification, refund).
  - **SSLCommerz**: Session initialization, success, fail, cancel, and IPN (Instant Payment Notification) handling.
  - **Stripe**: Hosted Checkout Sessions creation, success, and cancellation handling.
- **Transaction Tracker & History**: Record and inspect transaction details, customer info, and status.
- **Authentication & User Management**: User registration, login with JWT, and role-based permissions.
- **Monorepo Setup**: Unified repository with frontend and backend services configured for local development and unified Vercel deployment.

---

## 📁 Project Structure

```text
PayBridge/
├── backend/                # Express.js REST API
│   ├── config/             # Configuration helpers
│   ├── controller/         # Payment gateway & auth controllers
│   ├── middleware/         # Auth & gateway middlewares
│   ├── model/              # MongoDB/Mongoose schemas
│   ├── routes/             # API routes definition
│   ├── server.js           # Server entry point
│   └── .env.example        # Backend environment variables template
├── frontend/               # React + Vite application
│   ├── src/                # UI components, pages, hooks, contexts
│   ├── index.html          # HTML entry point
│   ├── vite.config.js      # Vite build configuration
│   └── .env.development   # Frontend local environment variables
├── package.json            # Root workspace scripts & dependencies
├── vercel.json             # Vercel multi-service routing configuration
└── README.md               # Project documentation
```

---

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)
- Merchant/Sandbox credentials for bKash, SSLCommerz, and/or Stripe

---

## ⚙️ Environment Configuration

### 1. Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```bash
cp backend/.env.example backend/.env
```

Key variables:
- `PORT`: Server port (default: `5000`)
- `MONGODB_URI` / `DB_URL`: MongoDB connection string
- `FRONTEND_URL`: Client application URL (e.g., `http://localhost:3000`)
- `BKASH_*`: bKash API credentials and endpoints
- `SSLCOMMERZ_*`: Store ID, Store Password, and mode (`SSLCOMMERZ_LIVE_MODE=false`)
- `STRIPE_*`: Publishable and secret keys

### 2. Frontend (`frontend/.env`)

For local development:
```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 💻 Getting Started

### 1. Install Dependencies

Install root, backend, and frontend dependencies at once:

```bash
npm install
```

*(This automatically triggers `postinstall` to install dependencies in both `./backend` and `./frontend`)*.

### 2. Run in Development Mode

Run backend and frontend concurrently (in separate terminals or using root scripts):

**Start Backend:**
```bash
npm run dev:backend
# or cd backend && npm run dev
```
Backend will run at `http://localhost:5000`.

**Start Frontend:**
```bash
npm run dev:frontend
# or cd frontend && npm run dev
```
Frontend will run at `http://localhost:3000` (or the port specified by Vite).

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **Auth** | | |
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login user and receive JWT |
| `GET` | `/api/auth/check-user` | Check authentication status |
| **bKash** | | |
| `POST` | `/api/bkash/payment/create` | Initialize bKash payment |
| `GET` | `/api/bkash/payment/callback` | Callback URL for bKash |
| `GET` | `/api/bkash/payment/refund/:trxID` | Issue refund for bKash transaction |
| **SSLCommerz** | | |
| `POST` | `/api/sslcommerz/payment/init` | Initialize SSLCommerz session |
| `POST/GET` | `/api/sslcommerz/payment/success` | SSLCommerz success return handler |
| `POST/GET` | `/api/sslcommerz/payment/fail` | SSLCommerz failure return handler |
| `POST/GET` | `/api/sslcommerz/payment/cancel` | SSLCommerz cancellation handler |
| `POST` | `/api/sslcommerz/payment/ipn` | Instant Payment Notification (IPN) |
| **Stripe** | | |
| `POST` | `/api/stripe/payment/create` | Create Stripe Checkout Session |
| `GET` | `/api/stripe/payment/success` | Stripe success redirect handler |
| `GET` | `/api/stripe/payment/cancel` | Stripe cancel redirect handler |
| **Tracker** | | |
| `GET` | `/api/tracker/history` | Get payment transaction history |
| `GET` | `/api/tracker/:id` | Get specific transaction details |

---

## 🚢 Deployment

The project is configured for deployment on [Vercel](https://vercel.com/) via `vercel.json` with multi-service routing:

- Requests to `/api/(.*)` are forwarded to the **Express Backend**.
- All other requests `/(.*)` are served by the **Vite React Frontend**.

---

## 📄 License

ISC
