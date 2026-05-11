import { WritableSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationResponse } from '../api/api.types';
import { AuthFacade, AuthProfile } from '../auth/auth.facade';
import { NotificationService } from '../notifications/notification.service';
import { ShellComponent } from './shell.component';

function notification(patch: Partial<NotificationResponse> = {}): NotificationResponse {
  return {
    notificationId: 'notification-1',
    type: 'NEW_MESSAGE',
    conversationId: 'conversation-1',
    actorUserId: 'user-1',
    actorNickname: 'Ana',
    stickerId: 'sticker-1',
    stickerCode: '001',
    stickerName: 'Mascote',
    read: false,
    createdAt: '2026-01-01T10:00:00Z',
    ...patch
  };
}

describe('ShellComponent', () => {
  let auth: {
    authenticated: ReturnType<typeof signal<boolean>>;
    profile: ReturnType<typeof signal<AuthProfile | null>>;
    isAdmin: ReturnType<typeof signal<boolean>>;
  };
  let notifications: {
    notifications: WritableSignal<NotificationResponse[]>;
    unreadCount: WritableSignal<number>;
    markAllRead: jasmine.Spy;
    markRead: jasmine.Spy;
  };
  let router: jasmine.SpyObj<Router>;
  let component: ShellComponent;

  beforeEach(() => {
    auth = {
      authenticated: signal(true),
      profile: signal<AuthProfile | null>({ sub: 'user-1', email: 'user@test.local', role: 'USER' }),
      isAdmin: signal(false)
    };
    notifications = {
      notifications: signal<NotificationResponse[]>([]),
      unreadCount: signal(0),
      markAllRead: jasmine.createSpy('markAllRead'),
      markRead: jasmine.createSpy('markRead')
    };
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    component = new ShellComponent(auth as unknown as AuthFacade, notifications as unknown as NotificationService, router);
  });

  describe('Dado a navegação principal', () => {
    it('Então oculta item admin para usuário comum', () => {
      // Arrange
      auth.isAdmin.set(false);

      // Act
      const labels = component.visibleNav().map((item) => item.label);

      // Assert
      expect(labels).not.toContain('Admin');
      expect(labels).toContain('Início');
    });

    it('Então exibe item admin para administrador', () => {
      // Arrange
      auth.isAdmin.set(true);

      // Act
      const labels = component.visibleNav().map((item) => item.label);

      // Assert
      expect(labels).toContain('Admin');
    });
  });

  describe('Dado ações de notificações', () => {
    it('Então marca todas como lidas', () => {
      // Arrange

      // Act
      component.markAllRead();

      // Assert
      expect(notifications.markAllRead).toHaveBeenCalledTimes(1);
    });

    it('Então abre chat vinculado e marca notificação como lida', () => {
      // Arrange
      const item = notification({ notificationId: 'n1', conversationId: 'c1' });

      // Act
      component.openNotification(item);

      // Assert
      expect(notifications.markRead).toHaveBeenCalledOnceWith('n1');
      expect(router.navigate).toHaveBeenCalledOnceWith(['/chats', 'c1']);
    });

    it('Então formata interesse usando ator e figurinha', () => {
      // Arrange
      const item = notification({ type: 'NEW_INTEREST', actorNickname: 'Bia', stickerCode: '123', stickerName: 'Taça' });

      // Act
      const message = component.formatMessage(item);

      // Assert
      expect(message).toBe('Bia quer trocar 123 - Taça');
    });

    it('Então usa fallbacks quando notificação não possui ator ou figurinha', () => {
      // Arrange
      const item = notification({ type: 'NEW_INTEREST', actorNickname: null, stickerCode: null, stickerName: null });

      // Act
      const message = component.formatMessage(item);

      // Assert
      expect(message).toBe('Alguém quer trocar uma figurinha');
    });

    it('Então formata mensagem de chat', () => {
      // Arrange
      const item = notification({ type: 'NEW_MESSAGE', actorNickname: 'Caio' });

      // Act
      const message = component.formatMessage(item);

      // Assert
      expect(message).toBe('Caio enviou uma mensagem');
    });
  });

  describe('Dado timestamps de notificações', () => {
    beforeEach(() => {
      spyOn(Date, 'now').and.returnValue(new Date('2026-01-02T12:00:00Z').getTime());
    });

    it('Então exibe agora mesmo para diferença menor que um minuto', () => {
      // Arrange

      // Act
      const label = component.timeAgo('2026-01-02T11:59:45Z');

      // Assert
      expect(label).toBe('agora mesmo');
    });

    it('Então exibe minutos, horas e dias conforme diferença', () => {
      // Arrange

      // Act
      const minutes = component.timeAgo('2026-01-02T11:45:00Z');
      const hours = component.timeAgo('2026-01-02T09:00:00Z');
      const days = component.timeAgo('2025-12-31T12:00:00Z');

      // Assert
      expect(minutes).toBe('há 15 min');
      expect(hours).toBe('há 3h');
      expect(days).toBe('há 2d');
    });
  });
});
