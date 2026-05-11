import { RuntimeConfigService } from './runtime-config.service';

describe('RuntimeConfigService', () => {
  let service: RuntimeConfigService;

  beforeEach(() => {
    service = new RuntimeConfigService();
  });

  describe('Dado o environment carregado em build-time', () => {
    it('Então snapshot retorna a configuração corrente', () => {
      // Arrange

      // Act
      const snapshot = service.snapshot();

      // Assert
      expect(snapshot.apiBaseUrl).toBeTruthy();
      expect(snapshot.authBaseUrl).toBeTruthy();
      expect(snapshot.wsUrl).toBeTruthy();
      expect(snapshot.oidc.clientId).toBeTruthy();
    });

    it('Então apiUrl junta base e caminho com uma barra', () => {
      // Arrange
      const baseUrl = service.snapshot().apiBaseUrl.replace(/\/+$/, '');

      // Act
      const withSlash = service.apiUrl('/albums');
      const withoutSlash = service.apiUrl('albums');

      // Assert
      expect(withSlash).toBe(`${baseUrl}/albums`);
      expect(withoutSlash).toBe(`${baseUrl}/albums`);
    });

    it('Então authUrl junta base e caminho com uma barra', () => {
      // Arrange
      const baseUrl = service.snapshot().authBaseUrl.replace(/\/+$/, '');

      // Act
      const url = service.authUrl('oauth2/authorize');

      // Assert
      expect(url).toBe(`${baseUrl}/oauth2/authorize`);
    });

    it('Então isApiRequest reconhece apenas URLs da API', () => {
      // Arrange
      const apiUrl = service.apiUrl('/me/profile');

      // Act
      const ownApi = service.isApiRequest(apiUrl);
      const external = service.isApiRequest('https://external.test/me/profile');

      // Assert
      expect(ownApi).toBeTrue();
      expect(external).toBeFalse();
    });
  });
});
