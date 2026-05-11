import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { ApiService } from './api.service';
import { CollectionFilter, ReportReason, ReportStatus } from './api.types';

const API_BASE = 'https://api.test.local';

function join(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

describe('ApiService', () => {
  let service: ApiService;
  let controller: HttpTestingController;

  beforeEach(() => {
    const config = jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['apiUrl']);
    config.apiUrl.and.callFake((path: string) => join(path));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RuntimeConfigService, useValue: config }
      ]
    });

    service = new ApiService(TestBed.inject(HttpClient), TestBed.inject(RuntimeConfigService));
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  function expectRequest(method: string, path: string): TestRequest {
    const request = controller.expectOne((candidate) => candidate.method === method && candidate.url === join(path));
    request.flush({});
    return request;
  }

  describe('Dado o contrato público de autenticação', () => {
    it('Então envia cadastro, confirmação e reset de senha com método, URL e payload corretos', () => {
      // Arrange

      // Act
      service.register('user@test.local', 'secret123').subscribe();
      const register = expectRequest('POST', '/auth/register');

      service.confirmEmail('token-123').subscribe();
      const confirmEmail = expectRequest('GET', '/auth/email-confirmations/confirm');

      service.requestPasswordReset('user@test.local').subscribe();
      const requestReset = expectRequest('POST', '/auth/password-reset-requests');

      service.resetPassword('token-456', 'new-secret').subscribe();
      const resetPassword = expectRequest('POST', '/auth/password-resets');

      // Assert
      expect(register.request.body).toEqual({ email: 'user@test.local', password: 'secret123' });
      expect(confirmEmail.request.params.get('token')).toBe('token-123');
      expect(confirmEmail.request.params.get('redirect')).toBe('false');
      expect(requestReset.request.body).toEqual({ email: 'user@test.local' });
      expect(resetPassword.request.body).toEqual({ token: 'token-456', newPassword: 'new-secret' });
    });
  });

  describe('Dado o contrato de catálogo e perfil', () => {
    it('Então chama endpoints de álbuns, figurinhas, perfil e CEP', () => {
      // Arrange

      // Act
      service.albums().subscribe();
      const albums = expectRequest('GET', '/albums');

      service.stickers('album-1', { q: 'A', page: 2, size: 10 }).subscribe();
      const stickers = expectRequest('GET', '/albums/album-1/stickers');

      service.myProfile().subscribe();
      const myProfile = expectRequest('GET', '/me/profile');

      service.updateProfile({ nickname: 'Niko', city: 'SP' }).subscribe();
      const updateProfile = expectRequest('PUT', '/me/profile');

      service.lookupCep('01310100').subscribe();
      const cep = expectRequest('GET', '/ceps/01310100');

      service.publicProfile('user-1').subscribe();
      const publicProfile = expectRequest('GET', '/users/user-1/profile');

      // Assert
      expect(albums.request.params.get('page')).toBe('0');
      expect(albums.request.params.get('size')).toBe('50');
      expect(stickers.request.params.get('q')).toBe('A');
      expect(stickers.request.params.get('page')).toBe('2');
      expect(stickers.request.params.get('size')).toBe('10');
      expect(stickers.request.params.get('sort')).toBe('code');
      expect(myProfile.request.body).toBeNull();
      expect(updateProfile.request.body).toEqual({ nickname: 'Niko', city: 'SP' });
      expect(cep.request.body).toBeNull();
      expect(publicProfile.request.body).toBeNull();
    });
  });

  describe('Dado o contrato de coleção e busca', () => {
    it('Então chama endpoints de coleção, repetidas, desejadas, titulares e interesse', () => {
      // Arrange
      const filter: CollectionFilter = 'CONFLICT';

      // Act
      service.repeated('album-1').subscribe();
      const repeated = expectRequest('GET', '/me/albums/album-1/repeated-stickers');

      service.collection('album-1', { q: 'ABC', filter, page: 3, size: 15 }).subscribe();
      const collection = expectRequest('GET', '/me/albums/album-1/collection');

      service.setRepeated('sticker-1', 2).subscribe();
      const setRepeated = expectRequest('PUT', '/me/repeated-stickers/sticker-1');

      service.deleteRepeated('sticker-1').subscribe();
      const deleteRepeated = expectRequest('DELETE', '/me/repeated-stickers/sticker-1');

      service.wanted('album-1').subscribe();
      const wanted = expectRequest('GET', '/me/albums/album-1/wanted-stickers');

      service.setWanted('sticker-2').subscribe();
      const setWanted = expectRequest('PUT', '/me/wanted-stickers/sticker-2');

      service.deleteWanted('sticker-2').subscribe();
      const deleteWanted = expectRequest('DELETE', '/me/wanted-stickers/sticker-2');

      service.holders('album-1', 'sticker-3', 4, 30).subscribe();
      const holders = expectRequest('GET', '/albums/album-1/stickers/sticker-3/holders');

      service.expressInterest('sticker-3', 'holder-1').subscribe();
      const interest = expectRequest('POST', '/stickers/sticker-3/interest');

      // Assert
      expect(repeated.request.body).toBeNull();
      expect(collection.request.params.get('q')).toBe('ABC');
      expect(collection.request.params.get('filter')).toBe('CONFLICT');
      expect(collection.request.params.get('page')).toBe('3');
      expect(collection.request.params.get('size')).toBe('15');
      expect(collection.request.params.get('sort')).toBe('code');
      expect(setRepeated.request.body).toEqual({ quantity: 2 });
      expect(deleteRepeated.request.body).toBeNull();
      expect(wanted.request.body).toBeNull();
      expect(setWanted.request.body).toEqual({});
      expect(deleteWanted.request.body).toBeNull();
      expect(holders.request.params.get('page')).toBe('4');
      expect(holders.request.params.get('size')).toBe('30');
      expect(interest.request.body).toEqual({ holderId: 'holder-1' });
    });
  });

  describe('Dado o contrato de chat e notificações', () => {
    it('Então chama endpoints de conversas, mensagens e leitura de notificações', () => {
      // Arrange

      // Act
      service.conversations().subscribe();
      const conversations = expectRequest('GET', '/chats');

      service.messages('conversation-1', 5, 25).subscribe();
      const messages = expectRequest('GET', '/chats/conversation-1/messages');

      service.notifications().subscribe();
      const notifications = expectRequest('GET', '/notifications');

      service.unreadCount().subscribe();
      const unread = expectRequest('GET', '/notifications/unread-count');

      service.markNotificationRead('notification-1').subscribe();
      const markRead = expectRequest('PUT', '/notifications/notification-1/read');

      service.markAllNotificationsRead().subscribe();
      const markAll = expectRequest('PUT', '/notifications/read-all');

      service.markConversationNotificationsRead('conversation-1').subscribe();
      const markConversation = expectRequest('PUT', '/chats/conversation-1/notifications/read');

      // Assert
      expect(conversations.request.body).toBeNull();
      expect(messages.request.params.get('page')).toBe('5');
      expect(messages.request.params.get('size')).toBe('25');
      expect(notifications.request.body).toBeNull();
      expect(unread.request.body).toBeNull();
      expect(markRead.request.body).toEqual({});
      expect(markAll.request.body).toEqual({});
      expect(markConversation.request.body).toEqual({});
    });
  });

  describe('Dado o contrato de moderação do usuário', () => {
    it('Então chama endpoints de bloqueio, desbloqueio e denúncia', () => {
      // Arrange
      const reason: ReportReason = 'SPAM';

      // Act
      service.blockUser('user-1').subscribe();
      const block = expectRequest('PUT', '/users/user-1/block');

      service.blockedUsers().subscribe();
      const blocked = expectRequest('GET', '/me/blocked-users');

      service.unblockUser('user-1').subscribe();
      const unblock = expectRequest('DELETE', '/users/user-1/block');

      service.reportUser('user-1', reason, 'spam profile').subscribe();
      const report = expectRequest('POST', '/users/user-1/report');

      // Assert
      expect(block.request.body).toEqual({});
      expect(blocked.request.params.get('page')).toBe('0');
      expect(blocked.request.params.get('size')).toBe('10');
      expect(unblock.request.body).toBeNull();
      expect(report.request.body).toEqual({ reason: 'SPAM', description: 'spam profile' });
    });
  });

  describe('Dado o contrato administrativo', () => {
    it('Então chama endpoints de catálogo administrativo', () => {
      // Arrange

      // Act
      service.createAlbum({ name: 'World Cup', description: '', year: 2026 }).subscribe();
      const createAlbum = expectRequest('POST', '/admin/albums');

      service.adminAlbums().subscribe();
      const adminAlbums = expectRequest('GET', '/admin/albums');

      service.updateAlbum('album-1', { name: 'Updated', description: null, year: null }).subscribe();
      const updateAlbum = expectRequest('PUT', '/admin/albums/album-1');

      service.setAlbumActive('album-1', true).subscribe();
      const activateAlbum = expectRequest('PATCH', '/admin/albums/album-1/activate');

      service.setAlbumActive('album-1', false).subscribe();
      const deactivateAlbum = expectRequest('PATCH', '/admin/albums/album-1/deactivate');

      service.createSticker('album-1', { code: '001', name: 'Mascot', description: null }).subscribe();
      const createSticker = expectRequest('POST', '/admin/albums/album-1/stickers');

      service.adminStickers('album-1').subscribe();
      const adminStickers = expectRequest('GET', '/admin/albums/album-1/stickers');

      service.updateSticker('sticker-1', { code: '002', name: 'Ball', description: '' }).subscribe();
      const updateSticker = expectRequest('PUT', '/admin/stickers/sticker-1');

      service.setStickerActive('sticker-1', true).subscribe();
      const activateSticker = expectRequest('PATCH', '/admin/stickers/sticker-1/activate');

      service.setStickerActive('sticker-1', false).subscribe();
      const deactivateSticker = expectRequest('PATCH', '/admin/stickers/sticker-1/deactivate');

      // Assert
      expect(createAlbum.request.body).toEqual({ name: 'World Cup', description: '', year: 2026 });
      expect(adminAlbums.request.params.get('page')).toBe('0');
      expect(adminAlbums.request.params.get('size')).toBe('100');
      expect(updateAlbum.request.body).toEqual({ name: 'Updated', description: null, year: null });
      expect(activateAlbum.request.body).toEqual({});
      expect(deactivateAlbum.request.body).toEqual({});
      expect(createSticker.request.body).toEqual({ code: '001', name: 'Mascot', description: null });
      expect(adminStickers.request.params.get('page')).toBe('0');
      expect(adminStickers.request.params.get('size')).toBe('500');
      expect(adminStickers.request.params.get('sort')).toBe('code');
      expect(updateSticker.request.body).toEqual({ code: '002', name: 'Ball', description: '' });
      expect(activateSticker.request.body).toEqual({});
      expect(deactivateSticker.request.body).toEqual({});
    });

    it('Então chama endpoints de relatórios e usuários administrativos', () => {
      // Arrange
      const status: ReportStatus = 'PENDING';

      // Act
      service.reports(status).subscribe();
      const reports = expectRequest('GET', '/admin/moderation/reports');

      service.adminUsers(2, 30, 'admin@test.local').subscribe();
      const users = expectRequest('GET', '/admin/users');

      service.adminBlockUser('user-1').subscribe();
      const block = expectRequest('PATCH', '/admin/users/user-1/block');

      service.adminUnblockUser('user-1').subscribe();
      const unblock = expectRequest('PATCH', '/admin/users/user-1/unblock');

      // Assert
      expect(reports.request.params.get('status')).toBe('PENDING');
      expect(reports.request.params.get('size')).toBe('50');
      expect(users.request.params.get('q')).toBe('admin@test.local');
      expect(users.request.params.get('page')).toBe('2');
      expect(users.request.params.get('size')).toBe('30');
      expect(users.request.params.get('sort')).toBe('createdAt,desc');
      expect(block.request.body).toEqual({});
      expect(unblock.request.body).toEqual({});
    });
  });

  describe('Dado que valores opcionais de query são vazios', () => {
    it('Então params ignora null, undefined e string vazia', () => {
      // Arrange

      // Act
      service.collection('album-1', { q: '', filter: 'ALL', page: 0, size: 25 }).subscribe();
      const collection = expectRequest('GET', '/me/albums/album-1/collection');

      service.adminUsers(0, 20, '').subscribe();
      const users = expectRequest('GET', '/admin/users');

      service.reports(undefined).subscribe();
      const reports = expectRequest('GET', '/admin/moderation/reports');

      // Assert
      expect(collection.request.params.has('q')).toBeFalse();
      expect(collection.request.params.get('filter')).toBe('ALL');
      expect(users.request.params.has('q')).toBeFalse();
      expect(reports.request.params.has('status')).toBeFalse();
    });
  });
});
