import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { StsConfigLoader } from 'angular-auth-oidc-client';
import { appConfig } from './app.config';
import { RuntimeConfig, RuntimeConfigService } from './core/config/runtime-config.service';

const runtimeConfig: RuntimeConfig = {
  apiBaseUrl: 'https://api.test.local',
  authBaseUrl: 'https://auth.test.local',
  wsUrl: 'wss://api.test.local/ws',
  oidc: {
    authority: 'https://auth.test.local',
    clientId: 'sticker-swap',
    scope: 'openid profile email',
    redirectUrl: 'https://front.test.local/oauth/callback',
    postLogoutRedirectUri: 'https://front.test.local/logged-out'
  }
};

function findProviderByToken(
  value: unknown,
  token: unknown,
  seen = new WeakSet<object>()
): Record<PropertyKey, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if (seen.has(value)) {
    return null;
  }
  seen.add(value);

  const record = value as Record<PropertyKey, unknown>;
  if (record['provide'] === token) {
    return record;
  }

  for (const key of Reflect.ownKeys(record)) {
    const child = record[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findProviderByToken(item, token, seen);
        if (found) {
          return found;
        }
      }
    } else if (child && typeof child === 'object') {
      const found = findProviderByToken(child, token, seen);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

describe('appConfig', () => {
  describe('Dado a configuração standalone da aplicação', () => {
    it('Então registra providers globais esperados', () => {
      // Arrange
      const providers = (appConfig.providers ?? []) as Array<Record<string, unknown>>;

      // Act
      const formFieldProvider = providers.find((provider) => provider['provide'] === MAT_FORM_FIELD_DEFAULT_OPTIONS);
      const paginatorProvider = providers.find((provider) => provider['provide'] === MatPaginatorIntl);

      // Assert
      expect(formFieldProvider?.['useValue']).toEqual({ appearance: 'outline' });
      expect(paginatorProvider?.['useFactory']).toEqual(jasmine.any(Function));
    });

    it('Então factory OIDC usa RuntimeConfigService como fonte de configuração', () => {
      // Arrange
      const providers = (appConfig.providers ?? []) as Array<Record<string, unknown>>;
      const authProvider = findProviderByToken(providers, StsConfigLoader);
      const runtimeConfigService = jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['snapshot']);
      runtimeConfigService.snapshot.and.returnValue(runtimeConfig);

      // Act
      const loader = (authProvider?.['useFactory'] as (config: RuntimeConfigService) => StsConfigLoader)(runtimeConfigService);

      // Assert
      expect(authProvider?.['deps']).toEqual([RuntimeConfigService]);
      expect(runtimeConfigService.snapshot).toHaveBeenCalledTimes(1);
      expect(loader).toBeTruthy();
    });
  });
});
