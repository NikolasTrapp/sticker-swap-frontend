# AGENTS.md

Instruções para agentes trabalhando no frontend Sticker Swap.

## Fonte Da Verdade

Use o código atual como fonte de verdade. Os arquivos mais importantes são:

- `src/app/app.routes.ts`
- `src/app/app.config.ts`
- `src/app/core/api/api.service.ts`
- `src/app/core/api/api.types.ts`
- `src/app/core/auth/auth.facade.ts`
- `src/app/core/auth/api-auth.interceptor.ts`
- `src/app/core/auth/api-error.interceptor.ts`
- `src/environments/environment*.ts`

## Produto

O frontend é uma SPA para troca de figurinhas da Copa. O usuário cadastra conta, confirma e-mail, mantém perfil e coleção, busca outros colecionadores, inicia conversas, recebe notificações e pode bloquear/denunciar usuários. Administradores gerenciam catálogo, denúncias e contas.

## Stack

- Angular 21 com standalone components.
- TypeScript strict.
- Angular Material/CDK.
- OIDC com Authorization Code + PKCE via `angular-auth-oidc-client`.
- STOMP/WebSocket via `@stomp/stompjs`.
- RxJS e Angular signals.

## Comandos

```bash
npm install
npm start
npm run build
npm run build:prod
npm test
```

## Arquitetura

- `core/api`: contrato REST.
- `core/auth`: autenticação, guards e interceptors.
- `core/config`: leitura dos environments.
- `core/layout`: shell da área autenticada.
- `core/notifications`: notificações e eventos de segurança em tempo real.
- `core/realtime`: chat em tempo real.
- `features/*`: telas por domínio.

Prefira manter lógica de integração em `core` e lógica de tela no componente da feature.

## Rotas

Públicas:

- `/login`
- `/register`
- `/oauth/callback`
- `/logout`
- `/logged-out`
- `/email-confirmation`
- `/email-confirmed`
- `/email-confirmation-sent`
- `/password-reset-request`
- `/password-reset`

Autenticadas:

- `/dashboard`
- `/profile`
- `/catalog`
- `/collection`
- `/search`
- `/users/:userId/profile`
- `/chats`
- `/chats/:conversationId`

Admin:

- `/admin`

## Configuração

A configuração vem de `src/environments`, não de arquivo JSON carregado em runtime.

Ambientes atuais:

- Desenvolvimento: API/Auth `http://localhost:8080`, WebSocket `ws://localhost:8080/ws`.
- Produção: backend Railway e frontend GitHub Pages conforme `environment.ts`.

Ao alterar origem, callback ou logout, mantenha backend e frontend sincronizados.

## Contratos De Autenticação

- O app espera JWT com `sub`, `email` e `role`.
- `role=ADMIN` habilita navegação admin e passa no `adminGuard`.
- `apiAuthInterceptor` centraliza bearer token.
- `apiErrorInterceptor` centraliza mensagens e logout local em conta bloqueada/inativa.

Não criar rotas ou serviços que emitam token manualmente.

## Contratos REST

Use `ApiService` para toda comunicação HTTP.

Áreas cobertas:

- Auth: cadastro, confirmação de e-mail, reset de senha.
- Catálogo: álbuns e figurinhas.
- Perfil: perfil próprio, CEP e perfil público.
- Coleção: repetidas, desejadas e conflitos.
- Busca: colecionadores que possuem figurinha.
- Chat: conversas e mensagens.
- Notificações.
- Moderação: bloqueios e denúncias.
- Admin: usuários, catálogo e denúncias.

Ao mudar DTO no backend, atualize `api.types.ts` no mesmo commit.

## Tempo Real

- Chat: `ChatRealtimeService`.
- Notificações e bloqueio de conta: `NotificationService`.
- Todas as conexões STOMP usam `wsUrl` e header `Authorization`.

Bloqueio de conta recebido em `/user/queue/security` deve encerrar a sessão local e levar para `/logged-out`.

## Cuidados

- Não duplicar estado de autenticação fora de `AuthFacade`.
- Não chamar `OidcSecurityService` direto em componentes novos.
- Não expor CEP em telas públicas.
- Não tratar admin apenas por UI; backend também exige `ROLE_ADMIN`.
- Não adicionar dependências de UI sem necessidade.
- Não reescrever padrões visuais globais para uma tela isolada.

## Verificação

Para alterações de código:

```bash
npm run build
```

Para mudanças de autenticação, guards, interceptors ou rotas, confira também o fluxo no navegador.
