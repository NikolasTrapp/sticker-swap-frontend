import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { switchMap, take } from 'rxjs';
import { RuntimeConfigService } from '../config/runtime-config.service';

const AUTH_EXCLUSIONS = [
  '/.well-known/',
  '/oauth2/',
  '/userinfo',
  '/login',
  '/auth/register',
  '/auth/email-confirmations',
  '/auth/password-reset'
];

export const apiAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(RuntimeConfigService);
  const oidc = inject(OidcSecurityService);

  if (!config.isApiRequest(request.url) || AUTH_EXCLUSIONS.some((path) => request.url.includes(path))) {
    return next(request);
  }

  return oidc.getAccessToken().pipe(
    take(1),
    switchMap((token) => {
      if (!token) {
        return next(request);
      }
      return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
    })
  );
};
