# Sticker Swap Frontend

Angular mobile-first SPA for the Sticker Swap backend.

## Stack

- Angular 21, standalone components, strict TypeScript.
- Angular Material/CDK for accessible professional UI primitives.
- OAuth2/OIDC Authorization Code + PKCE through Spring Authorization Server.
- REST over JSON plus STOMP/WebSocket for chat.
- AWS S3 + CloudFront static hosting.

## Local Run

```bash
npm install
npm start
```

The default runtime config is in `public/assets/config.json` and points to `http://localhost:8080`.

## Auth Flow

The login screen posts credentials to `POST /oauth2/login` with a CSRF token from `GET /oauth2/csrf`. That endpoint creates the Authorization Server browser session only. Tokens are still obtained through the standard PKCE redirect flow:

1. Angular calls `/oauth2/login`.
2. Angular redirects to `/oauth2/authorize`.
3. Backend redirects back to `/oauth/callback`.
4. The OIDC client exchanges the authorization code at `/oauth2/token`.
5. API calls use `Authorization: Bearer <access_token>`.

## Deployment

Build with:

```bash
npm run build:prod
```

Upload `dist/sticker-swap-frontend/browser` to the private S3 bucket behind CloudFront. Keep `assets/config.json` environment-specific so API, auth, and WebSocket URLs can change without rebuilding the bundle.
