import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthFacade } from './auth.facade';
import { apiErrorInterceptor } from './api-error.interceptor';

const API_URL = 'https://api.test.local';

describe('apiErrorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let auth: jasmine.SpyObj<AuthFacade>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    auth = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['logoutLocal']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBar },
        { provide: AuthFacade, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('exibe snackbar com mensagem de sessão expirada para erro 401', () => {
    http.get(`${API_URL}/me/profile`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/me/profile`);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'Sua sessão expirou. Entre novamente.',
      'Fechar',
      { duration: 6000 }
    );
  });

  it('exibe snackbar com mensagem de erro de rede para status 0', () => {
    http.get(`${API_URL}/me/profile`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/me/profile`);
    req.error(new ProgressEvent('error'));

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'Não foi possível conectar ao servidor.',
      'Fechar',
      { duration: 6000 }
    );
  });

  it('exibe snackbar com mensagem genérica para erro 500', () => {
    http.get(`${API_URL}/me/profile`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/me/profile`);
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'Tivemos um problema inesperado. Tente novamente em instantes.',
      'Fechar',
      { duration: 6000 }
    );
  });

  it('exibe mensagem de recurso não encontrado para erro 404', () => {
    http.get(`${API_URL}/me/profile`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/me/profile`);
    req.flush(null, { status: 404, statusText: 'Not Found' });

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'Não encontramos esse recurso.',
      'Fechar',
      { duration: 6000 }
    );
  });

  it('exibe mensagem de sem permissão para erro 403 genérico', () => {
    http.get(`${API_URL}/admin/users`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/admin/users`);
    req.flush({ message: 'access denied', fieldErrors: [] }, { status: 403, statusText: 'Forbidden' });

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'Você não tem permissão para acessar esta área.',
      'Fechar',
      { duration: 6000 }
    );
  });

  it('exibe mensagem de muitas tentativas para erro 429', () => {
    http.get(`${API_URL}/auth/password-reset-requests`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/auth/password-reset-requests`);
    req.flush(null, { status: 429, statusText: 'Too Many Requests' });

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'Muitas tentativas. Aguarde um pouco e tente novamente.',
      'Fechar',
      { duration: 6000 }
    );
  });

  it('exibe mensagem de campo inválido quando fieldErrors está presente', () => {
    http.get(`${API_URL}/auth/register`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/auth/register`);
    req.flush(
      { fieldErrors: [{ field: 'email', message: 'must be a well-formed email address' }] },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'E-mail: informe um e-mail válido.',
      'Fechar',
      { duration: 6000 }
    );
  });

  it('exibe mensagem de senha inválida para campo password', () => {
    http.get(`${API_URL}/auth/password-reset`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/auth/password-reset`);
    req.flush(
      { fieldErrors: [{ field: 'password', message: 'must not be blank' }] },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'Senha: preencha este campo.',
      'Fechar',
      { duration: 6000 }
    );
  });

  it('exibe mensagem de e-mail duplicado para 409 em /auth/register', () => {
    http.get(`${API_URL}/auth/register`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/auth/register`);
    req.flush(
      { fieldErrors: [] },
      { status: 409, statusText: 'Conflict' }
    );

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'Este e-mail já está cadastrado.',
      'Fechar',
      { duration: 6000 }
    );
  });

  it('encerra sessão local e navega para /logged-out quando conta está bloqueada (403)', () => {
    http.get(`${API_URL}/me/profile`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/me/profile`);
    req.flush(
      { message: 'Account is blocked', fieldErrors: [] },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(auth.logoutLocal).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/logged-out');
  });

  it('encerra sessão local e navega para /logged-out quando conta está inativa', () => {
    http.get(`${API_URL}/me/profile`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/me/profile`);
    req.flush(
      { message: 'Account is inactive', fieldErrors: [] },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(auth.logoutLocal).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/logged-out');
  });

  it('não encerra sessão local para 403 genérico (sem mensagem de bloqueio)', () => {
    http.get(`${API_URL}/admin/users`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/admin/users`);
    req.flush(
      { message: 'access denied', fieldErrors: [] },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(auth.logoutLocal).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('não exibe snackbar para erros em assets/config.json', () => {
    http.get('/assets/config.json').subscribe({ error: () => {} });

    const req = controller.expectOne('/assets/config.json');
    req.flush(null, { status: 404, statusText: 'Not Found' });

    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('re-lança o erro para o assinante tratar', (done) => {
    http.get(`${API_URL}/me/profile`).subscribe({
      error: (err: { status: number }) => {
        expect(err.status).toBe(404);
        done();
      }
    });

    const req = controller.expectOne(`${API_URL}/me/profile`);
    req.flush(null, { status: 404, statusText: 'Not Found' });
  });

  it('exibe mensagem de link inválido para /auth/email-confirmations', () => {
    http.get(`${API_URL}/auth/email-confirmations/confirm`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/auth/email-confirmations/confirm`);
    req.flush(null, { status: 400, statusText: 'Bad Request' });

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'Este link de confirmação expirou ou já foi usado.',
      'Fechar',
      { duration: 6000 }
    );
  });

  it('exibe mensagem de link inválido para /auth/password-resets', () => {
    http.get(`${API_URL}/auth/password-resets`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/auth/password-resets`);
    req.flush(null, { status: 400, statusText: 'Bad Request' });

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'Este link de recuperação expirou ou já foi usado.',
      'Fechar',
      { duration: 6000 }
    );
  });

  it('exibe mensagem de e-mail não encontrado para /auth/password-reset-requests com 404', () => {
    http.get(`${API_URL}/auth/password-reset-requests`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/auth/password-reset-requests`);
    req.flush(null, { status: 404, statusText: 'Not Found' });

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'Não encontramos uma conta com esse e-mail.',
      'Fechar',
      { duration: 6000 }
    );
  });

  it('exibe Campo com fallback quando fieldError não informa campo nem mensagem', () => {
    http.get(`${API_URL}/me/profile`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/me/profile`);
    req.flush({ fieldErrors: [{}] }, { status: 400, statusText: 'Bad Request' });

    expect(snackBar.open).toHaveBeenCalledOnceWith('Campo: revise este campo.', 'Fechar', { duration: 6000 });
  });

  ([
    ['brazilian zip code', 'CEP: informe um CEP com 8 dígitos.'],
    ['required', 'Nome: preencha este campo.'],
    ['size must be between 2 and 50', 'Descrição: confira o tamanho informado.'],
    ['must match "[A-Z]{2}"', 'UF: use o formato esperado.'],
    ['mensagem customizada', 'Código: mensagem customizada']
  ] as Array<[string, string]>).forEach(([backendMessage, expected]) => {
    it(`exibe validação amigável para "${backendMessage}"`, () => {
      http.get(`${API_URL}/me/profile`).subscribe({ error: () => {} });

      const req = controller.expectOne(`${API_URL}/me/profile`);
      req.flush(
        { fieldErrors: [{ field: backendMessage === 'required' ? 'name' : backendMessage === 'must match "[A-Z]{2}"' ? 'state' : backendMessage === 'size must be between 2 and 50' ? 'description' : backendMessage === 'mensagem customizada' ? 'code' : 'cep', message: backendMessage }] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(snackBar.open).toHaveBeenCalledOnceWith(expected, 'Fechar', { duration: 6000 });
    });
  });

  ([
    ['Bad credentials', 422, 'E-mail ou senha incorretos.'],
    ['Invalid or expired token', 422, 'Este link expirou ou já foi usado.'],
    ['Quantity must be zero or positive', 409, 'A quantidade não pode ser negativa.'],
    ['Album is not active', 409, 'Este álbum não está disponível no momento.'],
    ['Sticker code already exists', 409, 'Já existe uma figurinha com esse código neste álbum.'],
    ['Email already registered', 409, 'Este e-mail já está cadastrado.'],
    ['CEP não encontrado', 422, 'Não encontramos esse CEP.'],
    ['Validation failed', 422, 'Revise os campos destacados e tente novamente.'],
    ['No resource at /missing', 404, 'Não encontramos esse recurso.'],
    ['Unauthorized', 422, 'Sua sessão expirou. Entre novamente.'],
    ['Internal Server Error', 422, 'Tivemos um problema inesperado. Tente novamente em instantes.']
  ] as Array<[string, number, string]>).forEach(([message, status, expected]) => {
    it(`exibe mensagem de corpo amigável para "${message}"`, () => {
      http.get(`${API_URL}/me/profile`).subscribe({ error: () => {} });

      const req = controller.expectOne(`${API_URL}/me/profile`);
      req.flush({ message, fieldErrors: [] }, { status, statusText: 'Error' });

      expect(snackBar.open).toHaveBeenCalledOnceWith(expected, 'Fechar', { duration: 6000 });
    });
  });

  it('exibe fallback de conflito quando 409 não possui mensagem amigável', () => {
    http.get(`${API_URL}/albums`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/albums`);
    req.flush(null, { status: 409, statusText: 'Conflict' });

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'Não foi possível concluir porque já existe um registro parecido.',
      'Fechar',
      { duration: 6000 }
    );
  });

  it('exibe fallback de validação quando 422 não possui mensagem amigável', () => {
    http.get(`${API_URL}/albums`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/albums`);
    req.flush(null, { status: 422, statusText: 'Unprocessable Entity' });

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'Revise as informações e tente novamente.',
      'Fechar',
      { duration: 6000 }
    );
  });

  it('exibe mensagem do backend quando não há fallback mais específico', () => {
    http.get(`${API_URL}/albums`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/albums`);
    req.flush({ message: 'Mensagem de domínio', fieldErrors: [] }, { status: 400, statusText: 'Bad Request' });

    expect(snackBar.open).toHaveBeenCalledOnceWith('Mensagem de domínio', 'Fechar', { duration: 6000 });
  });

  it('exibe fallback genérico quando erro não possui corpo', () => {
    http.get(`${API_URL}/albums`).subscribe({ error: () => {} });

    const req = controller.expectOne(`${API_URL}/albums`);
    req.flush(null, { status: 418, statusText: 'Teapot' });

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      'Não foi possível concluir a ação. Tente novamente.',
      'Fechar',
      { duration: 6000 }
    );
  });
});
