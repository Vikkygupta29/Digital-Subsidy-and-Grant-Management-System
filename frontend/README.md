# Digital Subsidy and Grant Management System — Frontend

The frontend is a React and Vite application for the Digital Subsidy and Grant Management System. It provides role-based dashboards for beneficiaries, administrators, field officers, district officers, and finance approvers.

## Local development

Install dependencies and start the development server:

```powershell
npm install
npm run dev
```

The development server runs on `http://localhost:5173`. Vite proxies `/api` requests to `http://localhost:8080`.

## Environment variables

Create `frontend/.env.local` for local development:

```text
VITE_API_BASE_URL=/api
VITE_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key
```

The application checks `GET /api/health` when it starts and displays the backend status in the lower-left corner.

## Production deployment

For a separately deployed backend, set these variables in the frontend hosting service under the **Production** environment:

```text
VITE_API_BASE_URL=https://your-backend-domain.example/api
VITE_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key
```

The API URL must:

- Use the public HTTPS backend URL
- End with `/api`
- Not contain quotes or trailing spaces

After adding or changing `VITE_*` variables, trigger a new production deployment. Vite embeds these variables during the build, so changing them without rebuilding does not update the deployed application.

The production login request should use:

```text
POST https://your-backend-domain.example/api/auth/login
```

The Cloudflare Turnstile widget must allow the deployed frontend hostname. Keep the Turnstile site key in the frontend service only; the Turnstile secret key belongs in the backend service.

## Production build

```powershell
npm run lint
npm run build
npm run preview
```

The production build is generated in `dist/`.

## Deployment checklist

- Set `VITE_API_BASE_URL` in the hosting provider's **Production** environment.
- Set `VITE_TURNSTILE_SITE_KEY` in the same environment.
- Redeploy after saving environment variables.
- Confirm `https://your-backend-domain.example/api/health` returns a healthy response.
- Confirm the browser Network tab sends login requests to the backend domain, not the frontend domain.
- Add the frontend hostname to the Cloudflare Turnstile allowed domains.

## Project commands

```text
npm run dev       Start the local development server
npm run lint      Run Oxlint
npm run build     Create the production bundle
npm run preview   Preview the production bundle locally
```

## Main libraries

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- Recharts
- Lucide React
- Cloudflare Turnstile
