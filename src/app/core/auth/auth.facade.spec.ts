import { fakeAsync, tick } from '@angular/core/testing';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable, Subject, of, throwError } from 'rxjs';
import { AuthFacade } from './auth.facade';

function jwt(payload: Record<string, unknown>): string {
  const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${encoded}.signature`;
}

describe('AuthFacade', () => {
  let oidc: jasmine.SpyObj<OidcSecurityService>;
  let facade: AuthFacade;

  beforeEach(() => {
    oidc = jasmine.createSpyObj<OidcSecurityService>('OidcSecurityService', [
      'authorize',
      'checkAuth',
      'getAccessToken',
      'logoff',
      'logoffAndRevokeTokens',
      'logoffLocal'
    ]);

    facade = new AuthFacade(oidc);
  });

  describe('Dado que o OIDC confirma uma sessão autenticada', () => {
    it('Então atualiza sinais de autenticação e perfil do usuário', (done) => {
      // Arrange
      oidc.checkAuth.and.returnValue(of({ isAuthenticated: true, accessToken: jwt({ sub: 'u1', email: 'u@test.local', role: 'USER' }) }) as Observable<never>);

      // Act
      facade.checkAuth().subscribe((authenticated) => {
        // Assert
        expect(authenticated).toBeTrue();
        expect(facade.authenticated()).toBeTrue();
        expect(facade.profile()).toEqual({ sub: 'u1', email: 'u@test.local', role: 'USER' });
        expect(facade.isAdmin()).toBeFalse();
        done();
      });
    });

    it('Então marca administrador quando o token possui role ADMIN', (done) => {
      // Arrange
      oidc.checkAuth.and.returnValue(of({ isAuthenticated: true, accessToken: jwt({ sub: 'admin', email: 'a@test.local', role: 'ADMIN' }) }) as Observable<never>);

      // Act
      facade.checkAuth().subscribe(() => {
        // Assert
        expect(facade.profile()).toEqual({ sub: 'admin', email: 'a@test.local', role: 'ADMIN' });
        expect(facade.isAdmin()).toBeTrue();
        done();
      });
    });

    it('Então usa null para email e role ausentes no token', (done) => {
      // Arrange
      oidc.checkAuth.and.returnValue(of({ isAuthenticated: true, accessToken: jwt({ sub: 'u2' }) }) as Observable<never>);

      // Act
      facade.checkAuth().subscribe(() => {
        // Assert
        expect(facade.profile()).toEqual({ sub: 'u2', email: null, role: null });
        expect(facade.isAdmin()).toBeFalse();
        done();
      });
    });
  });

  describe('Dado que o OIDC não confirma sessão', () => {
    it('Então limpa o perfil quando não existe accessToken', (done) => {
      // Arrange
      facade.profile.set({ sub: 'old', email: 'old@test.local', role: 'ADMIN' });
      facade.authenticated.set(true);
      oidc.checkAuth.and.returnValue(of({ isAuthenticated: false }) as Observable<never>);

      // Act
      facade.checkAuth().subscribe((authenticated) => {
        // Assert
        expect(authenticated).toBeFalse();
        expect(facade.authenticated()).toBeFalse();
        expect(facade.profile()).toBeNull();
        done();
      });
    });

    it('Então define perfil null quando o token não tem payload', (done) => {
      // Arrange
      oidc.checkAuth.and.returnValue(of({ isAuthenticated: true, accessToken: 'invalid-token' }) as Observable<never>);

      // Act
      facade.checkAuth().subscribe(() => {
        // Assert
        expect(facade.authenticated()).toBeTrue();
        expect(facade.profile()).toBeNull();
        done();
      });
    });
  });

  describe('Dado que checkAuth é chamado em paralelo', () => {
    it('Então compartilha a mesma requisição até ela finalizar', fakeAsync(() => {
      // Arrange
      const result$ = new Subject<{ isAuthenticated: boolean; accessToken?: string }>();
      const values: boolean[] = [];
      oidc.checkAuth.and.returnValue(result$ as unknown as ReturnType<OidcSecurityService['checkAuth']>);

      // Act
      facade.checkAuth().subscribe((value) => values.push(value));
      facade.checkAuth().subscribe((value) => values.push(value));
      result$.next({ isAuthenticated: true, accessToken: jwt({ sub: 'u1', role: 'USER' }) });
      result$.complete();
      tick();

      // Assert
      expect(oidc.checkAuth).toHaveBeenCalledTimes(1);
      expect(values).toEqual([true, true]);
    }));

    it('Então permite nova requisição depois do finalize', fakeAsync(() => {
      // Arrange
      oidc.checkAuth.and.returnValues(
        of({ isAuthenticated: false }) as Observable<never>,
        of({ isAuthenticated: true, accessToken: jwt({ sub: 'u3' }) }) as Observable<never>
      );

      // Act
      facade.checkAuth().subscribe();
      tick();
      facade.checkAuth().subscribe();
      tick();

      // Assert
      expect(oidc.checkAuth).toHaveBeenCalledTimes(2);
      expect(facade.authenticated()).toBeTrue();
    }));
  });

  describe('Dado que o usuário inicia ou encerra sessão', () => {
    it('Então startLogin delega para authorize', () => {
      // Arrange

      // Act
      facade.startLogin();

      // Assert
      expect(oidc.authorize).toHaveBeenCalledTimes(1);
    });

    it('Então logout chama logoff e limpa a sessão local no sucesso', () => {
      // Arrange
      facade.profile.set({ sub: 'u1', email: 'u@test.local', role: 'USER' });
      facade.authenticated.set(true);
      oidc.logoff.and.returnValue(of(null) as Observable<never>);

      // Act
      facade.logout();

      // Assert
      expect(oidc.logoff).toHaveBeenCalledTimes(1);
      expect(oidc.logoffLocal).toHaveBeenCalledTimes(1);
      expect(facade.authenticated()).toBeFalse();
      expect(facade.profile()).toBeNull();
    });

    it('Então logoutLocal limpa sinais e storage local do OIDC', () => {
      // Arrange
      facade.profile.set({ sub: 'u1', email: 'u@test.local', role: 'USER' });
      facade.authenticated.set(true);

      // Act
      facade.logoutLocal();

      // Assert
      expect(facade.profile()).toBeNull();
      expect(facade.authenticated()).toBeFalse();
      expect(oidc.logoffLocal).toHaveBeenCalledTimes(1);
    });

    it('Então logoutAndRevoke controla busy e limpa sessão no sucesso', (done) => {
      // Arrange
      facade.authenticated.set(true);
      oidc.logoffAndRevokeTokens.and.returnValue(of(null) as Observable<never>);

      // Act
      const result$ = facade.logoutAndRevoke();

      // Assert
      expect(facade.busy()).toBeTrue();
      result$.subscribe(() => {
        expect(oidc.logoffAndRevokeTokens).toHaveBeenCalledTimes(1);
        expect(oidc.logoffLocal).toHaveBeenCalledTimes(1);
        expect(facade.authenticated()).toBeFalse();
        expect(facade.busy()).toBeFalse();
        done();
      });
    });

    it('Então logoutAndRevoke reseta busy mesmo quando o OIDC falha', (done) => {
      // Arrange
      oidc.logoffAndRevokeTokens.and.returnValue(throwError(() => new Error('oidc down')));

      // Act
      facade.logoutAndRevoke().subscribe({
        error: () => {
          // Assert
          expect(facade.busy()).toBeFalse();
          expect(oidc.logoffLocal).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('Dado que um token de acesso é solicitado', () => {
    it('Então accessToken delega para o serviço OIDC', (done) => {
      // Arrange
      oidc.getAccessToken.and.returnValue(of('token') as Observable<never>);

      // Act
      facade.accessToken().subscribe((token) => {
        // Assert
        expect(token).toBe('token');
        expect(oidc.getAccessToken).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
