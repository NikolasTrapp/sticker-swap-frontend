import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { of } from 'rxjs';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { apiAuthInterceptor } from './api-auth.interceptor';

const TEST_API_BASE = 'https://api.test.local';

describe('apiAuthInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let oidcSpy: jasmine.SpyObj<OidcSecurityService>;
  let configSpy: jasmine.SpyObj<RuntimeConfigService>;

  beforeEach(() => {
    oidcSpy = jasmine.createSpyObj<OidcSecurityService>('OidcSecurityService', ['getAccessToken']);
    configSpy = jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['isApiRequest']);

    oidcSpy.getAccessToken.and.returnValue(of('test-token'));
    configSpy.isApiRequest.and.callFake((url: string) => url.startsWith(TEST_API_BASE));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiAuthInterceptor])),
        provideHttpClientTesting(),
        { provide: OidcSecurityService, useValue: oidcSpy },
        { provide: RuntimeConfigService, useValue: configSpy }
      ]
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('adiciona header Authorization para requisições à API', () => {
    http.get(`${TEST_API_BASE}/albums`).subscribe();

    const req = controller.expectOne(`${TEST_API_BASE}/albums`);
    req.flush([]);

    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('não adiciona header Authorization para URLs externas', () => {
    http.get('https://external.example.com/resource').subscribe();

    const req = controller.expectOne('https://external.example.com/resource');
    req.flush([]);

    expect(req.request.headers.get('Authorization')).toBeNull();
  });

  it('não adiciona header Authorization quando token está vazio', () => {
    oidcSpy.getAccessToken.and.returnValue(of(''));

    http.get(`${TEST_API_BASE}/albums`).subscribe();

    const req = controller.expectOne(`${TEST_API_BASE}/albums`);
    req.flush([]);

    expect(req.request.headers.get('Authorization')).toBeNull();
  });

  it('não adiciona header Authorization para rota /.well-known/', () => {
    http.get(`${TEST_API_BASE}/.well-known/openid-configuration`).subscribe();

    const req = controller.expectOne(`${TEST_API_BASE}/.well-known/openid-configuration`);
    req.flush({});

    expect(req.request.headers.get('Authorization')).toBeNull();
  });

  it('não adiciona header Authorization para /oauth2/', () => {
    http.get(`${TEST_API_BASE}/oauth2/token`).subscribe();

    const req = controller.expectOne(`${TEST_API_BASE}/oauth2/token`);
    req.flush({});

    expect(req.request.headers.get('Authorization')).toBeNull();
  });

  it('não adiciona header Authorization para /auth/register', () => {
    http.get(`${TEST_API_BASE}/auth/register`).subscribe();

    const req = controller.expectOne(`${TEST_API_BASE}/auth/register`);
    req.flush({});

    expect(req.request.headers.get('Authorization')).toBeNull();
  });

  it('não adiciona header Authorization para /auth/email-confirmations', () => {
    http.get(`${TEST_API_BASE}/auth/email-confirmations/confirm`).subscribe();

    const req = controller.expectOne(`${TEST_API_BASE}/auth/email-confirmations/confirm`);
    req.flush({});

    expect(req.request.headers.get('Authorization')).toBeNull();
  });

  it('não adiciona header Authorization para /auth/password-reset', () => {
    http.get(`${TEST_API_BASE}/auth/password-reset`).subscribe();

    const req = controller.expectOne(`${TEST_API_BASE}/auth/password-reset`);
    req.flush({});

    expect(req.request.headers.get('Authorization')).toBeNull();
  });

  it('não adiciona header Authorization para /login', () => {
    http.get(`${TEST_API_BASE}/login`).subscribe();

    const req = controller.expectOne(`${TEST_API_BASE}/login`);
    req.flush({});

    expect(req.request.headers.get('Authorization')).toBeNull();
  });

  it('não adiciona header Authorization para /userinfo', () => {
    http.get(`${TEST_API_BASE}/userinfo`).subscribe();

    const req = controller.expectOne(`${TEST_API_BASE}/userinfo`);
    req.flush({});

    expect(req.request.headers.get('Authorization')).toBeNull();
  });

  it('usa apenas a primeira emissão do access token', () => {
    oidcSpy.getAccessToken.and.returnValue(of('first-token', 'second-token'));

    http.get(`${TEST_API_BASE}/albums`).subscribe();

    const req = controller.expectOne(`${TEST_API_BASE}/albums`);
    req.flush([]);

    expect(req.request.headers.get('Authorization')).toBe('Bearer first-token');
  });

  it('não chama getAccessToken para URLs não-API', () => {
    http.get('https://external.example.com/resource').subscribe();

    controller.expectOne('https://external.example.com/resource').flush([]);

    expect(oidcSpy.getAccessToken).not.toHaveBeenCalled();
  });
});
