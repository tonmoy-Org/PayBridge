# PayBridge

PayBridge is a multi-gateway payment processing application built with Node.js, Express, MongoDB, React, and Vite. It provides standardized integrations for bKash, SSLCommerz, and Stripe, alongside transaction tracking and user authentication.

---

## Features

- **Payment Gateways**:
  - **bKash**: Tokenized checkout (grant token, create payment, callback execution, and refund).
  - **SSLCommerz**: Session initiation, transaction validation, callback handling (success, fail, cancel), and IPN support.
  - **Stripe**: Hosted Checkout session creation and completion handling.
- **Transaction Tracker**: Audit log of payment events, transaction statuses, and payer metadata.
- **Authentication**: JWT-based authentication with role-based access control.
- **Monorepo Architecture**: Integrated frontend and backend services structured for independent development and unified deployment.

---

## Project Structure

```text
PayBridge/
├── backend/                # Express.js REST API
│   ├── config/             # Configuration helpers
│   ├── controller/         # Payment gateway and auth controllers
│   ├── middleware/         # Authentication and request middlewares
│   ├── model/              # MongoDB/Mongoose schemas
│   ├── routes/             # API route definitions
│   ├── server.js           # Express application entry point
│   └── .env.example        # Backend environment variables template
├── frontend/               # React + Vite application
│   ├── src/                # UI components, pages, hooks, contexts
│   ├── index.html          # HTML entry point
│   ├── vite.config.js      # Vite build configuration
│   └── .env.development   # Local environment configuration
├── package.json            # Workspace scripts and dependencies
├── vercel.json             # Multi-service routing configuration
└── README.md               # Project documentation
```

---

## Prerequisites

- Node.js (v18 or higher)
- MongoDB instance (local or MongoDB Atlas)
- Relevant merchant/sandbox credentials for bKash, SSLCommerz, or Stripe

---

## Environment Setup

### 1. Backend Configuration

Create a `.env` file in the `backend/` directory based on `.env.example`:

```bash
cp backend/.env.example backend/.env
```

Key environment variables:
- `PORT`: API server port (default: `5000`)
- `MONGODB_URI` / `DB_URL`: MongoDB connection string
- `FRONTEND_URL`: Client application URL (default: `http://localhost:3000`)
- `BKASH_*`: bKash API credentials and endpoint URLs
- `SSLCOMMERZ_*`: Store ID, Store Password, and mode (`SSLCOMMERZ_LIVE_MODE=false`)
- `STRIPE_*`: Publishable and secret keys

### 2. Frontend Configuration

Create a `.env` file in the `frontend/` directory (or use `.env.development` for local development):

```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## Installation and Local Development

### 1. Install Dependencies

Install all dependencies across the workspace:

```bash
npm install
```

The post-install script automatically installs dependencies for both `backend` and `frontend`.

### 2. Run the Application

Start both services in development mode:

**Backend:**
```bash
npm run dev:backend
```
The API server will run at `http://localhost:5000`.

**Frontend:**
```bash
npm run dev:frontend
```
The frontend application will run at `http://localhost:3000` (or the configured Vite port).

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **Authentication** | | |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate user and issue JWT |
| `GET` | `/api/auth/check-user` | Verify current user session |
| **bKash** | | |
| `POST` | `/api/bkash/payment/create` | Create a bKash payment request |
| `GET` | `/api/bkash/payment/callback` | Handle bKash payment callback |
| `GET` | `/api/bkash/payment/refund/:trxID` | Process a refund for a transaction |
| **SSLCommerz** | | |
| `POST` | `/api/sslcommerz/payment/init` | Initiate SSLCommerz payment session |
| `POST` / `GET` | `/api/sslcommerz/payment/success` | Handle successful payment redirect |
| `POST` / `GET` | `/api/sslcommerz/payment/fail` | Handle failed payment redirect |
| `POST` / `GET` | `/api/sslcommerz/payment/cancel` | Handle cancelled payment redirect |
| `POST` | `/api/sslcommerz/payment/ipn` | Instant Payment Notification webhook |
| **Stripe** | | |
| `POST` | `/api/stripe/payment/create` | Create a Stripe Checkout session |
| `GET` | `/api/stripe/payment/success` | Handle successful Stripe checkout |
| `GET` | `/api/stripe/payment/cancel` | Handle cancelled Stripe checkout |
| **Transaction Tracker** | | |
| `GET` | `/api/tracker/history` | Retrieve transaction history (requires auth) |
| `GET` | `/api/tracker/:id` | Retrieve single transaction details (requires auth) |

---

## Deployment

The repository is configured for deployment on Vercel using `vercel.json` with multi-service routing:

- All `/api/(.*)` requests route to the Express backend service.
- All other requests `/(.*)` route to the Vite frontend static build.

---

## License

ISC
