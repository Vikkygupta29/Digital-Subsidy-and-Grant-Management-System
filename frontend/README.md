# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Backend connection

The application checks `GET /api/health` when it starts and displays the backend status in the lower-left corner. The backend returns `200 OK` with `status: "UP"` only when the Spring Boot application is running.

For local development, Vite proxies `/api` to `http://localhost:8080`. For a separately deployed backend, set `VITE_API_BASE_URL` to the backend API base URL before building the frontend, for example:

```text
VITE_API_BASE_URL=https://api.example.com/api
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
