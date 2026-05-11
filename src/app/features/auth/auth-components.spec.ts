import { FormBuilder } from '@angular/forms';
import { convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { UserResponse } from '../../core/api/api.types';
import { AuthFacade } from '../../core/auth/auth.facade';
import { EmailConfirmationSentComponent } from './email-confirmation-sent.component';
import { EmailConfirmationComponent } from './email-confirmation.component';
import { EmailConfirmedComponent } from './email-confirmed.component';
import { ForbiddenComponent } from './forbidden.component';
import { LoggedOutComponent } from './logged-out.component';
import { LoginComponent } from './login.component';
import { LogoutComponent } from './logout.component';
import { OAuthCallbackComponent } from './oauth-callback.component';
import { PasswordResetRequestComponent } from './password-reset-request.component';
import { PasswordResetComponent } from './password-reset.component';
import { RegisterComponent } from './register.component';

const user: UserResponse = {
  id: 'user-1',
  email: 'user@test.local',
  role: 'USER',
  status: 'ACTIVE',
  emailVerified: false,
  createdAt: '2026-01-01T10:00:00Z'
};

function routeWithQuery(params: Record<string, string>) {
  return {
    snapshot: {
      queryParamMap: convertToParamMap(params)
    }
  };
}

describe('Componentes de autenticação', () => {
  let originalPathname: string;

  beforeEach(() => {
    originalPathname = window.location.pathname;
  });

  afterEach(() => {
    history.pushState(null, '', originalPathname);
  });

  describe('Dado LoginComponent', () => {
    it('Então inicia o login ao montar', () => {
      // Arrange
      const auth = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['startLogin']);
      const component = new LoginComponent(auth);

      // Act
      component.ngOnInit();

      // Assert
      expect(auth.startLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dado OAuthCallbackComponent', () => {
    it('Então mostra sucesso e navega para dashboard quando autenticado', () => {
      // Arrange
      const auth = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['checkAuth']);
      const router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
      auth.checkAuth.and.returnValue(of(true));
      const component = new OAuthCallbackComponent(auth, router);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.message()).toBe('Entrada concluída.');
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/dashboard');
    });

    it('Então mostra erro e navega para login quando não autenticado', () => {
      // Arrange
      const auth = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['checkAuth']);
      const router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
      auth.checkAuth.and.returnValue(of(false));
      const component = new OAuthCallbackComponent(auth, router);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.message()).toBe('Não foi possível entrar.');
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/login');
    });
  });

  describe('Dado LogoutComponent', () => {
    it('Então confirma logout e navega para logged-out no sucesso', () => {
      // Arrange
      const auth = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['logoutAndRevoke', 'logoutLocal']);
      const router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
      auth.logoutAndRevoke.and.returnValue(of(null));
      const component = new LogoutComponent(auth, router);

      // Act
      component.confirm();

      // Assert
      expect(auth.logoutAndRevoke).toHaveBeenCalledTimes(1);
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/logged-out');
      expect(component.state()).toBe('working');
    });

    it('Então exibe estado de erro quando revogação falha', () => {
      // Arrange
      const auth = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['logoutAndRevoke', 'logoutLocal']);
      const router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
      auth.logoutAndRevoke.and.returnValue(throwError(() => new Error('fail')));
      const component = new LogoutComponent(auth, router);

      // Act
      component.confirm();

      // Assert
      expect(component.state()).toBe('error');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('Então fallback local limpa sessão e navega para logged-out', () => {
      // Arrange
      const auth = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['logoutAndRevoke', 'logoutLocal']);
      const router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
      const component = new LogoutComponent(auth, router);

      // Act
      component.logoutLocal();

      // Assert
      expect(auth.logoutLocal).toHaveBeenCalledTimes(1);
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/logged-out');
    });
  });

  describe('Dado RegisterComponent', () => {
    it('Então não envia cadastro quando formulário é inválido', () => {
      // Arrange
      const api = jasmine.createSpyObj<ApiService>('ApiService', ['register']);
      const router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
      const component = new RegisterComponent(api, new FormBuilder(), router);

      // Act
      component.submit();

      // Assert
      expect(api.register).not.toHaveBeenCalled();
    });

    it('Então cadastra e navega para tela de confirmação enviada', () => {
      // Arrange
      const api = jasmine.createSpyObj<ApiService>('ApiService', ['register']);
      const router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
      api.register.and.returnValue(of(user));
      const component = new RegisterComponent(api, new FormBuilder(), router);
      component.form.setValue({ email: 'user@test.local', password: 'secret123' });

      // Act
      component.submit();

      // Assert
      expect(api.register).toHaveBeenCalledOnceWith('user@test.local', 'secret123');
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/email-confirmation-sent', {
        state: { email: 'user@test.local' }
      });
      expect(component.saving()).toBeFalse();
    });
  });

  describe('Dado EmailConfirmationComponent', () => {
    it('Então sinaliza erro quando token está ausente', () => {
      // Arrange
      const api = jasmine.createSpyObj<ApiService>('ApiService', ['confirmEmail']);
      const component = new EmailConfirmationComponent(api, routeWithQuery({}) as never);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.state()).toBe('error');
      expect(component.message()).toContain('incompleto');
      expect(api.confirmEmail).not.toHaveBeenCalled();
    });

    it('Então confirma e-mail quando token é válido', () => {
      // Arrange
      const api = jasmine.createSpyObj<ApiService>('ApiService', ['confirmEmail']);
      api.confirmEmail.and.returnValue(of(user));
      const component = new EmailConfirmationComponent(api, routeWithQuery({ token: 'token-1' }) as never);

      // Act
      component.ngOnInit();

      // Assert
      expect(api.confirmEmail).toHaveBeenCalledOnceWith('token-1');
      expect(component.state()).toBe('success');
      expect(component.message()).toContain('sucesso');
    });

    it('Então sinaliza erro quando confirmação falha', () => {
      // Arrange
      const api = jasmine.createSpyObj<ApiService>('ApiService', ['confirmEmail']);
      api.confirmEmail.and.returnValue(throwError(() => new Error('expired')));
      const component = new EmailConfirmationComponent(api, routeWithQuery({ token: 'token-1' }) as never);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.state()).toBe('error');
      expect(component.message()).toContain('expirou');
    });
  });

  describe('Dado PasswordResetRequestComponent', () => {
    it('Então não solicita reset quando formulário é inválido', () => {
      // Arrange
      const api = jasmine.createSpyObj<ApiService>('ApiService', ['requestPasswordReset']);
      const component = new PasswordResetRequestComponent(api, new FormBuilder());

      // Act
      component.submit();

      // Assert
      expect(api.requestPasswordReset).not.toHaveBeenCalled();
    });

    it('Então solicita reset, marca concluído e desabilita o formulário', () => {
      // Arrange
      const api = jasmine.createSpyObj<ApiService>('ApiService', ['requestPasswordReset']);
      api.requestPasswordReset.and.returnValue(of(void 0));
      const component = new PasswordResetRequestComponent(api, new FormBuilder());
      component.form.setValue({ email: 'user@test.local' });

      // Act
      component.submit();

      // Assert
      expect(api.requestPasswordReset).toHaveBeenCalledOnceWith('user@test.local');
      expect(component.done()).toBeTrue();
      expect(component.saving()).toBeFalse();
      expect(component.form.disabled).toBeTrue();
    });
  });

  describe('Dado PasswordResetComponent', () => {
    it('Então guarda token da query string ao montar', () => {
      // Arrange
      const api = jasmine.createSpyObj<ApiService>('ApiService', ['resetPassword']);
      const component = new PasswordResetComponent(api, new FormBuilder(), routeWithQuery({ token: 'token-1' }) as never);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.token()).toBe('token-1');
    });

    it('Então não envia reset sem token ou com form inválido', () => {
      // Arrange
      const api = jasmine.createSpyObj<ApiService>('ApiService', ['resetPassword']);
      const component = new PasswordResetComponent(api, new FormBuilder(), routeWithQuery({}) as never);
      component.ngOnInit();

      // Act
      component.submit();

      // Assert
      expect(api.resetPassword).not.toHaveBeenCalled();
    });

    it('Então redefine senha com token válido', () => {
      // Arrange
      const api = jasmine.createSpyObj<ApiService>('ApiService', ['resetPassword']);
      api.resetPassword.and.returnValue(of(void 0));
      const component = new PasswordResetComponent(api, new FormBuilder(), routeWithQuery({ token: 'token-1' }) as never);
      component.ngOnInit();
      component.form.setValue({ password: 'new-secret' });

      // Act
      component.submit();

      // Assert
      expect(api.resetPassword).toHaveBeenCalledOnceWith('token-1', 'new-secret');
      expect(component.done()).toBeTrue();
      expect(component.saving()).toBeFalse();
    });
  });

  describe('Dado componentes estáticos do fluxo de autenticação', () => {
    it('Então instancia telas informativas sem dependências externas', () => {
      // Arrange
      history.pushState({ email: 'user@test.local' }, '', '/email-confirmation-sent');

      // Act
      const sent = new EmailConfirmationSentComponent();
      const confirmed = new EmailConfirmedComponent();
      const loggedOut = new LoggedOutComponent();
      const forbidden = new ForbiddenComponent();

      // Assert
      expect(sent.email).toBe('user@test.local');
      expect(confirmed).toBeTruthy();
      expect(loggedOut).toBeTruthy();
      expect(forbidden).toBeTruthy();
    });

    it('Então usa mensagem genérica quando estado não possui e-mail', () => {
      // Arrange
      history.pushState({}, '', '/email-confirmation-sent');

      // Act
      const sent = new EmailConfirmationSentComponent();

      // Assert
      expect(sent.email).toBe('');
    });
  });
});
