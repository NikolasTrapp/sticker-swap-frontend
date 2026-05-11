# CLAUDE.md

Instruções para trabalhar neste frontend.

## Stack

- Angular 21, standalone components e TypeScript strict.
- Angular Material/CDK.
- `angular-auth-oidc-client` para OIDC com Authorization Code + PKCE.
- `@stomp/stompjs` para WebSocket/STOMP.

## Comandos

```bash
npm install
npm start
npm run build
npm run build:prod
npm test
```

Use `./node_modules/.bin/ng ...` quando precisar chamar Angular CLI diretamente.

## Estrutura

- `src/app/app.routes.ts`: rotas da SPA.
- `src/app/app.config.ts`: providers, router, interceptors, Material e OIDC.
- `src/app/core/api`: cliente REST e tipos.
- `src/app/core/auth`: facade, guards e interceptors.
- `src/app/core/realtime` e `src/app/core/notifications`: STOMP para chat, notificações e eventos de segurança.
- `src/app/core/layout`: shell autenticado.
- `src/app/features`: telas por domínio.

## Configuração

Não há `assets/config.json` em runtime. A configuração vem dos arquivos:

- `src/environments/environment.development.ts`
- `src/environments/environment.ts`

Mantenha `apiBaseUrl`, `authBaseUrl`, `wsUrl` e `oidc.*` alinhados com o backend e com os redirect URIs registrados para o client `sticker-swap-web`.

## Autenticação

- `AuthFacade` é a única camada que deve falar diretamente com `OidcSecurityService`.
- `LoginComponent` apenas inicia a entrada.
- `OAuthCallbackComponent` chama `checkAuth()` e redireciona para `/dashboard` ou `/login`.
- `authGuard` protege rotas autenticadas.
- `adminGuard` exige claim `role` igual a `ADMIN`.
- O perfil local é decodificado do JWT e espera `sub`, `email` e `role`.

Não criar armazenamento paralelo de token nem anexar bearer token manualmente fora do interceptor.

## API E Erros

Adicione endpoints em `ApiService` e seus tipos em `api.types.ts`.

O `apiAuthInterceptor` adiciona `Authorization` somente em chamadas para `apiBaseUrl`, respeitando a lista de endpoints públicos.

O `apiErrorInterceptor` exibe mensagens amigáveis e trata conta bloqueada/inativa encerrando a sessão local.

## Telas Atuais

- Autenticação: cadastro, confirmação de e-mail, e-mail confirmado, recuperação de senha, callback, logout e acesso negado.
- Área autenticada: dashboard, perfil, catálogo, coleção, busca, perfil público, lista de chats e sala de chat.
- Admin: usuários, álbuns, figurinhas e denúncias.

## Tempo Real

- Chat usa `/topic/chat/{conversationId}` e publica em `/app/chat/{conversationId}/send`.
- Notificações usam `/user/queue/notifications`.
- Eventos de bloqueio usam `/user/queue/security`.
- Conexões STOMP devem enviar `Authorization: Bearer <token>`.

## UI

Siga os padrões já existentes:

- Componentes standalone.
- Angular Material.
- Signals para estado local.
- `app-auth-page`, `page`, `panel`, `outlined-card` e classes globais de `src/styles.scss`.
- Texto em português.

## Verificação

Para mudanças de código, rode pelo menos:

```bash
npm run build
```

O build de produção pode avisar sobre orçamento inicial se o bundle passar do limite configurado em `angular.json`.
