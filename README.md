# Sticker Swap Frontend

SPA Angular para a plataforma Sticker Swap. A aplicação permite cadastro, confirmação de e-mail, recuperação de senha, gerenciamento de coleção, busca de colecionadores, chat, notificações e painel administrativo.

## Stack

- Angular 21 com standalone components e TypeScript strict.
- Angular Material/CDK para UI.
- `angular-auth-oidc-client` para OIDC com Authorization Code + PKCE.
- `@stomp/stompjs` para chat, notificações e eventos de segurança em tempo real.
- Build estático para GitHub Pages, S3/CloudFront ou outro host de SPA.

## Comandos

```bash
npm install
npm start
npm run build
npm run build:prod
npm test
```

`npm start` sobe o dev server em `0.0.0.0:4200`.

## Configuração

A configuração é compilada pelos arquivos de ambiente:

- `src/environments/environment.development.ts`
- `src/environments/environment.ts`

Campos principais:

- `apiBaseUrl`: base da API REST.
- `authBaseUrl`: base dos endpoints de autenticação.
- `wsUrl`: endpoint WebSocket STOMP.
- `oidc.authority`, `clientId`, `scope`, `redirectUrl`, `postLogoutRedirectUri`: configuração OIDC.

O ambiente de desenvolvimento aponta para `http://localhost:8080` e callback `http://localhost:4200/oauth/callback`.

## Rotas Principais

- `/login`: inicia a entrada via OIDC.
- `/oauth/callback`: finaliza o callback OIDC.
- `/logout` e `/logged-out`: saída local/remota e tela pós-saída.
- `/register`: cadastro de usuário.
- `/email-confirmation`: confirmação via chamada de API.
- `/email-confirmed`: tela exibida após confirmação por link de e-mail.
- `/email-confirmation-sent`: instruções após cadastro.
- `/password-reset-request` e `/password-reset`: recuperação de senha.
- `/dashboard`, `/profile`, `/catalog`, `/collection`, `/search`, `/chats`: área autenticada.
- `/admin`: painel administrativo para usuários, catálogo e denúncias.

## Contrato Com O Backend

Todas as chamadas REST ficam centralizadas em `src/app/core/api/api.service.ts` e usam tipos de `api.types.ts`.

O interceptor de autenticação adiciona bearer token somente em chamadas para `apiBaseUrl`, exceto endpoints públicos de cadastro, confirmação de e-mail, recuperação de senha e autenticação.

O interceptor de erros transforma `ApiError` do backend em mensagens de UI em português. Respostas de conta bloqueada/inativa encerram a sessão local e levam o usuário para `/logged-out`.

## Tempo Real

- `NotificationService` mantém notificações do usuário, assina `/user/queue/notifications` e recebe eventos de segurança em `/user/queue/security`.
- `ChatRealtimeService` conecta no `wsUrl`, assina `/topic/chat/{conversationId}` e publica mensagens em `/app/chat/{conversationId}/send`.
- Ambos enviam `Authorization: Bearer <token>` no `STOMP CONNECT`.

## Build E Deploy

```bash
npm run build:prod
```

O build de produção sai em `dist/sticker-swap-frontend/browser`.

Ao hospedar como SPA, configure fallback de rotas para `index.html`. Em CloudFront, veja `infra/aws/cloudfront-spa.md`. Em Nginx, veja `infra/nginx/sticker-swap-backend.conf` para o contexto de proxy/backend.

