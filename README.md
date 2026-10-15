# Digital Subsidy and Grant Management System

An end-to-end web platform for managing government subsidies and grants. The system supports beneficiary registration, scheme management, multi-level verification, approval workflows, staged disbursements, compliance monitoring, notifications, reporting, and audit tracking.

## Features

- Beneficiary registration and secure login
- Cloudflare Turnstile CAPTCHA protection
- Role-based dashboards and protected APIs
- Subsidy and grant scheme management
- Beneficiary profile and document management
- Application submission and status tracking
- Multi-level verification workflow
- Rejection notices, resubmission, and appeals
- Staged disbursement and milestone tracking
- Compliance proof submission and review
- Finance approval and fund release
- Dashboard analytics and reports
- Notifications
- Audit logs for administrator review
- Optional AI-assisted recommendations and application audits
- MySQL persistence with JPA/Hibernate
- BCrypt password hashing and JWT authentication

## User Roles

| Role | Main responsibilities |
|---|---|
| `BENEFICIARY` | Register, manage profile, apply for schemes, upload documents, track applications, submit appeals and compliance proof |
| `FIELD_OFFICER` | Perform field-level verification and review application information |
| `DISTRICT_OFFICER` | Perform district-level review and workflow decisions |
| `FINANCE_APPROVER` | Review approved applications and release eligible funds |
| `ADMIN` | Manage schemes, view analytics and audit logs, and create officer accounts |

The database stores role values such as `ADMIN` and `BENEFICIARY`. Spring Security internally uses the corresponding authority names `ROLE_ADMIN` and `ROLE_BENEFICIARY`.

## Technology Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- Recharts
- Lucide React
- Cloudflare Turnstile

### Backend

- Java 21
- Spring Boot 3.3
- Spring Web
- Spring Data JPA/Hibernate
- Spring Security
- JWT
- MySQL
- BCrypt
- Cloudinary
- Maven

## Repository Structure

```text
backend/
  src/main/java/com/infosys/subsidy/
    config/       Security and startup configuration
    controller/   REST API controllers
    entity/       JPA entities and role enum
    repository/   Spring Data repositories
    security/     JWT authentication filter
    service/      Business services
  src/main/resources/
    application.properties
    application.properties.example
  pom.xml

frontend/
  src/
    components/  Dashboards and feature views
    services/    API clients and frontend helpers
    App.jsx
  package.json
  vite.config.js
```

## Local Development

### Prerequisites

- Java 21
- Maven, or the included Maven wrapper
- Node.js and npm
- MySQL
- Cloudinary account for document uploads
- Cloudflare Turnstile site and secret keys

### Start the backend

From the repository root:

```powershell
cd backend
copy src\main\resources\application.properties.example src\main\resources\application.properties
.\mvnw.cmd spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

### Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

During local development, Vite proxies `/api` requests to `http://localhost:8080`.

## Environment Variables

### Backend

Configure these in the backend environment. Do not commit real values or secrets.

```text
PORT=8080
DATABASE_URL=jdbc:mysql://localhost:3306/subsidy_db
DATABASE_USERNAME=your-database-user
DATABASE_PASSWORD=your-database-password
JWT_SECRET=your-long-random-jwt-secret
TURNSTILE_SECRET_KEY=your-cloudflare-turnstile-secret
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

The complete property mapping is available in [backend/src/main/resources/application.properties.example](backend/src/main/resources/application.properties.example).

### Frontend

Create `frontend/.env.local` for local development:

```text
VITE_API_BASE_URL=/api
VITE_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key
```

For a separately deployed backend, use the backend public URL and include `/api`:

```text
VITE_API_BASE_URL=https://your-backend-domain.example/api
```

Vite variables are embedded during the frontend build. Redeploy the frontend after changing them.

## Creating the First Administrator

Public signup is intentionally limited to beneficiary accounts. To create the first administrator, temporarily add these variables to the **backend deployment service**:

```text
BOOTSTRAP_ADMIN_USERNAME=admin
BOOTSTRAP_ADMIN_PASSWORD=choose-a-strong-temporary-password
BOOTSTRAP_ADMIN_FULL_NAME=System Administrator
BOOTSTRAP_ADMIN_EMAIL=admin@example.gov
```

Restart or redeploy the backend. The application creates the administrator only if the username does not already exist. It does not overwrite an existing account.

Look for one of these startup log messages:

```text
Created bootstrap administrator account 'admin'
```

or:

```text
Bootstrap admin 'admin' already exists; leaving the existing account unchanged.
```

After the first successful login, remove the bootstrap username and password variables and redeploy. If the account already exists, changing the bootstrap password does not change its database password; update the password through the application’s supported administration process or database operations.

## Creating Officer Accounts

1. Log in using an `ADMIN` account.
2. Open **Officer Accounts**.
3. Enter the officer’s name, username, password, email, role, and region.
4. Select `FIELD_OFFICER`, `DISTRICT_OFFICER`, or `FINANCE_APPROVER`.
5. Create the account.
6. The officer signs in through the same portal login page.

The backend endpoint for officer creation is protected and accepts requests only from an administrator.

## Deployment

### Backend on Railway

1. Create a Railway service connected to the repository.
2. Configure the backend service root or build settings so Maven runs from `backend`.
3. Provide the backend environment variables.
4. Use the service public domain as the frontend API base URL.
5. Confirm the health endpoint:

```text
https://your-backend-domain.example/api/health
```

Expected response:

```json
{
  "message": "Backend is successfully running",
  "status": "UP"
}
```

### Frontend on Vercel

1. Import the repository into Vercel.
2. Set the project root directory to `frontend`.
3. Add:

```text
VITE_API_BASE_URL=https://your-backend-domain.example/api
VITE_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key
```

4. Deploy or redeploy after saving environment variables.
5. Add the Vercel hostname to the Cloudflare Turnstile widget allowed domains.
6. Set the backend `FRONTEND_URL` to the exact deployed frontend origin.

The login request should be sent to:

```text
POST https://your-backend-domain.example/api/auth/login
```

## Demo Flow

1. Open the portal and complete the CAPTCHA.
2. Register or sign in as a beneficiary.
3. View schemes and submit or track an application.
4. Sign out and sign in as an administrator.
5. Show dashboard metrics and scheme management.
6. Open **Officer Accounts** and create an officer.
7. Show verification, staged disbursement, compliance, notifications, and audit modules.
8. Explain role-based access control and the application lifecycle.

## API Health Check

```text
GET /api/health
```

## Testing and Build

### Backend

```powershell
cd backend
.\mvnw.cmd clean package
.\mvnw.cmd test
```

The backend integration test requires the test environment configuration and any required service placeholders used by the application context.

### Frontend

```powershell
cd frontend
npm install
npm run lint
npm run build
```

## Security Notes

- Never commit database credentials, JWT secrets, Cloudinary secrets, or Turnstile secret keys.
- Use a strong random `JWT_SECRET` in production.
- Remove bootstrap admin credentials after the first successful administrator setup.
- Keep `TURNSTILE_SECRET_KEY` on the backend only.
- Keep `VITE_TURNSTILE_SITE_KEY` on the frontend only.
- Use HTTPS for deployed frontend and backend services.
- Do not expose database services publicly unless required by the deployment provider.

## License

Add the project license and attribution details here before publishing the repository for external use.
