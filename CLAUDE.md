# CLAUDE.md

## Stack

- Angular 21 with standalone components and strict TypeScript.
- Angular Material/CDK for UI components.
- `angular-auth-oidc-client` for OAuth2/OIDC Authorization Code + PKCE.
- `@stomp/stompjs` for chat over STOMP/WebSocket.

## Common Commands

```bash
npm install
npm start
npm run build:prod
```

## Runtime Config

Edit `public/assets/config.json` per environment. The SPA reads API, auth, WebSocket, and OIDC values at runtime.

Local defaults:

- API/Auth: `http://localhost:8080`
- WebSocket: `ws://localhost:8080/ws`
- OAuth callback: `http://localhost:4200/oauth/callback`

## Auth Contract

The login page does not receive tokens directly from `POST /oauth2/login`.

Flow:

1. `GET /oauth2/csrf`
2. `POST /oauth2/login` with credentials, `X-XSRF-TOKEN`, and cookies
3. Redirect to `/oauth2/authorize`
4. Callback at `/oauth/callback`
5. Code exchange at `/oauth2/token`
6. REST requests use bearer JWTs

## AWS

Build output is `dist/sticker-swap-frontend/browser`. Deploy it to private S3 behind CloudFront. Keep `assets/config.json` short-lived or invalidate it during deploy.
