export const environment = {
  production: true,
  apiBaseUrl: 'https://stickerswap.up.railway.app',
  authBaseUrl: 'https://stickerswap.up.railway.app',
  wsUrl: 'wss://stickerswap.up.railway.app/ws',
  oidc: {
    authority: 'https://stickerswap.up.railway.app',
    clientId: 'sticker-swap-web',
    scope: 'openid profile api offline_access',
    redirectUrl: 'https://nikolastrapp.github.io/sticker-swap-frontend/oauth/callback',
    postLogoutRedirectUri: 'https://nikolastrapp.github.io/sticker-swap-frontend/logged-out'
  }
};
