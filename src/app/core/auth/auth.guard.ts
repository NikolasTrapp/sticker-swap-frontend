import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthFacade } from './auth.facade';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  if (auth.authenticated()) {
    return true;
  }

  return auth
    .checkAuth()
    .pipe(map((authenticated) => authenticated || router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })));
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  if (auth.isAdmin()) {
    return true;
  }
  return auth.checkAuth().pipe(map(() => (auth.isAdmin() ? true : router.createUrlTree(['/forbidden']))));
};
