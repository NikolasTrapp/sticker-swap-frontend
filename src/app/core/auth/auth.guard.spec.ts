import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthFacade } from './auth.facade';
import { adminGuard, authGuard } from './auth.guard';

function fakeState(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

describe('authGuard', () => {
  let fakeAuth: { authenticated: jasmine.Spy; checkAuth: jasmine.Spy };
  let router: Router;

  beforeEach(() => {
    fakeAuth = {
      authenticated: jasmine.createSpy('authenticated').and.returnValue(false),
      checkAuth: jasmine.createSpy('checkAuth').and.returnValue(of(false))
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: fakeAuth }
      ]
    });

    router = TestBed.inject(Router);
  });

  it('retorna true imediatamente quando sinal authenticated é verdadeiro', () => {
    fakeAuth.authenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, fakeState('/dashboard'))
    );

    expect(result).toBe(true);
    expect(fakeAuth.checkAuth).not.toHaveBeenCalled();
  });

  it('retorna true via checkAuth quando usuário está autenticado', (done) => {
    fakeAuth.authenticated.and.returnValue(false);
    fakeAuth.checkAuth.and.returnValue(of(true));

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, fakeState('/dashboard'))
    ) as Observable<boolean | UrlTree>;

    result.subscribe((value) => {
      expect(value).toBe(true);
      done();
    });
  });

  it('retorna UrlTree para /login com returnUrl quando não autenticado', (done) => {
    fakeAuth.authenticated.and.returnValue(false);
    fakeAuth.checkAuth.and.returnValue(of(false));

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, fakeState('/dashboard'))
    ) as Observable<boolean | UrlTree>;

    result.subscribe((value) => {
      expect(value instanceof UrlTree).toBe(true);
      expect(router.serializeUrl(value as UrlTree)).toBe('/login?returnUrl=%2Fdashboard');
      done();
    });
  });

  it('chama checkAuth quando não está autenticado pelo sinal', (done) => {
    fakeAuth.authenticated.and.returnValue(false);
    fakeAuth.checkAuth.and.returnValue(of(false));

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, fakeState('/collection'))
    ) as Observable<boolean | UrlTree>;

    result.subscribe(() => {
      expect(fakeAuth.checkAuth).toHaveBeenCalledTimes(1);
      done();
    });
  });
});

describe('adminGuard', () => {
  let fakeAuth: { isAdmin: jasmine.Spy; checkAuth: jasmine.Spy };
  let router: Router;

  beforeEach(() => {
    fakeAuth = {
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false),
      checkAuth: jasmine.createSpy('checkAuth').and.returnValue(of(false))
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: fakeAuth }
      ]
    });

    router = TestBed.inject(Router);
  });

  it('retorna true imediatamente quando isAdmin é verdadeiro', () => {
    fakeAuth.isAdmin.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(true);
    expect(fakeAuth.checkAuth).not.toHaveBeenCalled();
  });

  it('retorna UrlTree para /forbidden quando não é admin após checkAuth', (done) => {
    fakeAuth.isAdmin.and.returnValue(false);
    fakeAuth.checkAuth.and.returnValue(of(true));

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ) as Observable<boolean | UrlTree>;

    result.subscribe((value) => {
      expect(value instanceof UrlTree).toBe(true);
      expect(router.serializeUrl(value as UrlTree)).toBe('/forbidden');
      done();
    });
  });

  it('retorna true quando se torna admin após checkAuth', (done) => {
    fakeAuth.isAdmin.and.returnValues(false, true);
    fakeAuth.checkAuth.and.returnValue(of(true));

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ) as Observable<boolean | UrlTree>;

    result.subscribe((value) => {
      expect(value).toBe(true);
      done();
    });
  });

  it('retorna UrlTree para /forbidden quando checkAuth retorna false', (done) => {
    fakeAuth.isAdmin.and.returnValue(false);
    fakeAuth.checkAuth.and.returnValue(of(false));

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ) as Observable<boolean | UrlTree>;

    result.subscribe((value) => {
      expect(value instanceof UrlTree).toBe(true);
      expect(router.serializeUrl(value as UrlTree)).toBe('/forbidden');
      done();
    });
  });
});
