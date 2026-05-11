import { Route } from '@angular/router';
import { routes } from './app.routes';
import { adminGuard, authGuard } from './core/auth/auth.guard';
import { ShellComponent } from './core/layout/shell.component';

async function loadEveryComponent(routeList: Route[]): Promise<unknown[]> {
  const loaded: unknown[] = [];
  for (const route of routeList) {
    if (route.loadComponent) {
      loaded.push(await route.loadComponent());
    }
    if (route.children) {
      loaded.push(...(await loadEveryComponent(route.children)));
    }
  }
  return loaded;
}

describe('routes', () => {
  describe('Dado o mapa de rotas da SPA', () => {
    it('Então mantém rotas públicas, autenticadas, admin e fallback esperados', () => {
      // Arrange
      const shell = routes.find((route) => route.path === '');
      const children = shell?.children ?? [];

      // Act
      const publicPaths = routes.filter((route) => route.path !== '' && route.path !== '**').map((route) => route.path);
      const privatePaths = children.map((route) => route.path);
      const admin = children.find((route) => route.path === 'admin');
      const fallback = routes.find((route) => route.path === '**');

      // Assert
      expect(publicPaths).toEqual([
        'login',
        'register',
        'oauth/callback',
        'logout',
        'logged-out',
        'email-confirmation',
        'email-confirmed',
        'email-confirmation-sent',
        'password-reset-request',
        'password-reset'
      ]);
      expect(shell?.component).toBe(ShellComponent);
      expect(privatePaths).toContain('dashboard');
      expect(privatePaths).toContain('profile');
      expect(privatePaths).toContain('catalog');
      expect(privatePaths).toContain('collection');
      expect(privatePaths).toContain('search');
      expect(privatePaths).toContain('users/:userId/profile');
      expect(privatePaths).toContain('chats');
      expect(privatePaths).toContain('chats/:conversationId');
      expect(admin?.canActivate).toEqual([authGuard, adminGuard]);
      expect(fallback?.redirectTo).toBe('dashboard');
    });

    it('Então todos os lazy components resolvem para uma classe', async () => {
      // Arrange

      // Act
      const components = await loadEveryComponent(routes);

      // Assert
      expect(components.length).toBeGreaterThan(0);
      expect(components.every(Boolean)).toBeTrue();
    });
  });
});
