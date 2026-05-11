import { AppComponent } from './app.component';
import { AuthFacade } from './core/auth/auth.facade';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let auth: jasmine.SpyObj<AuthFacade>;
  let component: AppComponent;
  let originalPathname: string;

  beforeEach(() => {
    originalPathname = window.location.pathname;
    auth = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['checkAuth']);
    auth.checkAuth.and.returnValue(of(true));
    component = new AppComponent(auth);
  });

  afterEach(() => {
    history.pushState(null, '', originalPathname);
  });

  describe('Dado que a aplicação inicia fora do callback OAuth', () => {
    it('Então valida a sessão atual', () => {
      // Arrange
      history.pushState(null, '', '/dashboard');

      // Act
      component.ngOnInit();

      // Assert
      expect(auth.checkAuth).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dado que a aplicação inicia na rota de callback OAuth', () => {
    it('Então deixa o callback cuidar da validação de sessão', () => {
      // Arrange
      history.pushState(null, '', '/oauth/callback');

      // Act
      component.ngOnInit();

      // Assert
      expect(auth.checkAuth).not.toHaveBeenCalled();
    });
  });
});
