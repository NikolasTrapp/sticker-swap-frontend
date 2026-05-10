import { Injectable, computed, signal } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable, finalize, map, tap } from 'rxjs';

export interface AuthProfile {
  sub: string;
  email: string | null;
  role: 'USER' | 'ADMIN' | null;
}

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  readonly authenticated = signal(false);
  readonly profile = signal<AuthProfile | null>(null);
  readonly busy = signal(false);
  readonly isAdmin = computed(() => this.profile()?.role === 'ADMIN');

  constructor(private readonly oidc: OidcSecurityService) {}

  checkAuth(): Observable<boolean> {
    return this.oidc.checkAuth().pipe(
      tap((result: { isAuthenticated: boolean; accessToken?: string }) => {
        this.authenticated.set(result.isAuthenticated);
        this.profile.set(result.accessToken ? decodeProfile(result.accessToken) : null);
      }),
      map((result: { isAuthenticated: boolean }) => result.isAuthenticated)
    );
  }

  startLogin(): void {
    this.oidc.authorize();
  }

  logout(): void {
    this.oidc.logoff().subscribe(() => this.logoutLocal());
  }

  logoutAndRevoke(): Observable<unknown> {
    this.busy.set(true);
    return this.oidc.logoffAndRevokeTokens().pipe(
      tap(() => this.logoutLocal()),
      finalize(() => this.busy.set(false))
    );
  }

  logoutLocal(): void {
    this.profile.set(null);
    this.authenticated.set(false);
    this.oidc.logoffLocal();
  }

  accessToken(): Observable<string> {
    return this.oidc.getAccessToken();
  }
}

function decodeProfile(accessToken: string): AuthProfile | null {
  const payload = accessToken.split('.')[1];
  if (!payload) {
    return null;
  }
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const json = JSON.parse(atob(normalized)) as { sub: string; email?: string; role?: 'USER' | 'ADMIN' };
  return {
    sub: json.sub,
    email: json.email ?? null,
    role: json.role ?? null
  };
}
