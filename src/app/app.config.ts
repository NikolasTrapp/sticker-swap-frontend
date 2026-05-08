import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { LogLevel, StsConfigLoader, StsConfigStaticLoader, provideAuth } from 'angular-auth-oidc-client';
import { routes } from './app.routes';
import { apiAuthInterceptor } from './core/auth/api-auth.interceptor';
import { apiErrorInterceptor } from './core/auth/api-error.interceptor';
import { RuntimeConfigService } from './core/config/runtime-config.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
    ),
    provideHttpClient(withInterceptors([apiAuthInterceptor, apiErrorInterceptor])),
    provideAnimationsAsync(),
    importProvidersFrom(MatSnackBarModule),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [RuntimeConfigService],
      useFactory: (runtimeConfig: RuntimeConfigService) => () => runtimeConfig.load()
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' }
    },
    provideAuth({
      loader: {
        provide: StsConfigLoader,
        deps: [RuntimeConfigService],
        useFactory: (runtimeConfig: RuntimeConfigService) => {
          const config = runtimeConfig.snapshot();
          return new StsConfigStaticLoader({
            authority: config.oidc.authority,
            redirectUrl: config.oidc.redirectUrl,
            postLogoutRedirectUri: config.oidc.postLogoutRedirectUri,
            clientId: config.oidc.clientId,
            scope: config.oidc.scope,
            responseType: 'code',
            silentRenew: false,
            useRefreshToken: false,
            logLevel: LogLevel.Warn,
            secureRoutes: [config.apiBaseUrl],
            unauthorizedRoute: '/login',
            forbiddenRoute: '/forbidden'
          });
        }
      }
    })
  ]
};
