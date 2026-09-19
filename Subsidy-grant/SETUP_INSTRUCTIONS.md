# JanLabh DBT & Subsidy Portal - Local Setup & Configuration Guide

This document contains step-by-step instructions on how to set up, configure, and run the project on your local machine after downloading and unzipping the project archive.

---

## 1. Authentication Architecture: Yes, JWT is Applied!

The application implements full **JSON Web Token (JWT)** based authentication:

- **Backend Signing (`server/apiRouter.ts`)**:
  - When a user logs in (`POST /api/auth/login`) or registers (`POST /api/auth/register`), passwords are verified using `bcryptjs`.
  - A cryptographically signed JWT token is issued with a **12-hour expiry**, containing the user's `id`, `email`, `role`, `name`, and `district`.
  - Signed using `JWT_SECRET` (configured via `.env`).
- **Client-Side Authorization Interceptor (`src/services/api.ts`)**:
  - Upon login, the token is saved into `localStorage.getItem('auth_token')`.
  - An Axios HTTP request interceptor automatically attaches the header:
    ```http
    Authorization: Bearer <your-jwt-token>
    ```
- **Protected Endpoints (`authMiddleware` & `requireRoles`)**:
  - All protected routes (e.g. submitting applications, approving at L1/L2/L3 levels, updating schemes, reviewing audit logs) verify the token on every request.
  - Returns `401 Unauthorized` if no token is provided or if expired.
  - Returns `403 Forbidden` if the user role does not have required permissions for that specific operation.

---

## 2. Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js**: Version `18.x`, `20.x`, or higher ([Download Node.js](https://nodejs.org/))
- **npm**: Comes bundled with Node.js (`npm -v` to verify)

---

## 3. Step-by-Step Local Setup

### Step 1: Unzip the Project
Extract the downloaded ZIP file into a folder on your computer, then open your terminal (Terminal on Mac/Linux or PowerShell / Command Prompt on Windows) in that folder.

```bash
cd path/to/unzipped-project
```

---

### Step 2: Install Dependencies
Run the following command to install all frontend and backend dependencies:

```bash
npm install
```

---

### Step 3: Create and Configure `.env` File
In the project root folder, copy `.env.example` to create a new file named `.env`:

```bash
# On Linux / macOS / Git Bash:
cp .env.example .env

# On Windows (PowerShell):
Copy-Item .env.example .env

# Or simply create a new file named .env and copy the contents
```

#### Fields and Values to Replace in `.env`:

| Field Name | Description | Example / Recommended Value | Required? |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Your Google Gemini API Key for the AI Sahayak assistant & eligibility scoring | Obtain free from [Google AI Studio](https://aistudio.google.com/app/apikey) | Recommended (app works without it, but AI assistant features will require it) |
| `JWT_SECRET` | Secret key used to sign and verify JWT authentication tokens | Replace with any long random string (e.g., `my-super-secure-production-jwt-key-999`) | Optional (has development fallback) |
| `PORT` | Local port for the full-stack server | `3000` | Optional (defaults to `3000`) |

---

### Step 4: (Optional) Customizing Initial Data (`server/data.ts`)

If you want to customize the initial user accounts, names, schemes, or districts before starting:

1. Open `server/data.ts`.
2. Locate `initialUsers`:
   - **Citizen / Beneficiary**: You can change the name, email (e.g., your own email: `vikkykumargupta7667@gmail.com`), phone number, Aadhaar number, or landholding.
   - **Department Officers**: You can update the names, officer designations, or districts.
3. Locate `initialSchemes`:
   - You can add or modify subsidy amounts, eligibility criteria (e.g., max land acreage, max annual income), and required documents.

---

### Step 5: Run the Application Locally

Start the local development server:

```bash
npm run dev
```

Once started, open your browser and navigate to:
```
http://localhost:3000
```

---

## 4. Production Build & Execution

To test the optimized production build locally:

```bash
# Build both frontend Vite assets and backend server bundle
npm run build

# Run the compiled production server
npm start
```

---

## 5. Default User Accounts (For Testing Roles)

All pre-configured accounts share the default password: **`Gov@1234`**

| Role | Email | Password | What This Account Can Do |
| :--- | :--- | :--- | :--- |
| **Citizen (Beneficiary)** | `ramesh.kumar@beneficiary.in` *(or register your own)* | `Gov@1234` | Browse schemes, apply with land & bank details, track status, AI assistance. |
| **Field Officer (L1)** | `field.officer@gov.in` | `Gov@1234` | Inspect submitted applications, review documents, approve or request re-application. |
| **District Officer (L2)** | `district.officer@gov.in` | `Gov@1234` | District scrutiny, verify budget limits, approve for treasury disbursement. |
| **Finance Approver (L3)** | `finance.officer@gov.in` | `Gov@1234` | Authorize PFMS / e-Kuber treasury payouts and milestone fund releases. |
| **Portal Administrator** | `admin@gov.in` | `Gov@1234` | Manage schemes, system parameters, audit logs, and global reports. |

---

## 6. Project Architecture Overview

```text
├── server.ts              # Express server + Vite middleware
├── server/
│   ├── apiRouter.ts       # REST APIs, JWT issuance & authMiddleware, scoring logic
│   ├── data.ts            # Data store & schemas (Users, Schemes, Applications, Audits)
│   └── scoring.ts         # Multi-criteria eligibility assessment engine
├── src/
│   ├── context/
│   │   ├── AuthContext.tsx         # JWT token management & user session state
│   │   └── NotificationContext.tsx # Toast notifications
│   ├── services/
│   │   └── api.ts         # Axios client with JWT request interceptor
│   ├── pages/
│   │   ├── auth/Login.tsx          # Clean government login page with CAPTCHA
│   │   ├── auth/Register.tsx       # Citizen registration portal
│   │   └── dashboard/Dashboard.tsx # Role-aware dashboard (Citizen vs Officer desks)
│   └── components/        # Subsidies list, Application modal, AI Sahayak modal, etc.
└── package.json           # Dependencies, scripts (dev, build, start, lint)
```

---

## 7. Troubleshooting

- **Port 3000 already in use?**
  Run `PORT=3001 npm run dev` or stop the existing process using port 3000.
- **Token expired or 401 errors?**
  Click Logout in the UI or clear `auth_token` in browser `localStorage`.
- **Need to reset all sample data to default?**
  Restart the dev server (`Ctrl + C` then `npm run dev`) since the server reinitializes memory from `server/data.ts`.
