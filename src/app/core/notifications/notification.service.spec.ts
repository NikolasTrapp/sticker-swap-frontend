import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Client, IMessage } from '@stomp/stompjs';
import { of } from 'rxjs';
import { ApiService } from '../api/api.service';
import { NotificationResponse, SecurityEventResponse } from '../api/api.types';
import { AuthFacade } from '../auth/auth.facade';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { NotificationService } from './notification.service';

const readNotification: NotificationResponse = {
  notificationId: 'n-read',
  type: 'NEW_MESSAGE',
  conversationId: 'c1',
  actorUserId: 'u1',
  actorNickname: 'Ana',
  stickerId: null,
  stickerCode: null,
  stickerName: null,
  read: true,
  createdAt: '2026-01-01T10:00:00Z'
};

const unreadNotification: NotificationResponse = {
  ...readNotification,
  notificationId: 'n-unread',
  read: false
};

describe('NotificationService', () => {
  let api: jasmine.SpyObj<ApiService>;
  let auth: {
    authenticated: WritableSignal<boolean>;
    accessToken: jasmine.Spy;
    logoutLocal: jasmine.Spy;
  };
  let config: jasmine.SpyObj<RuntimeConfigService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let service: NotificationService;
  let subscriptions: Record<string, (message: IMessage) => void>;

  beforeEach(() => {
    subscriptions = {};
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'markAllNotificationsRead',
      'markNotificationRead',
      'notifications'
    ]);
    auth = {
      authenticated: signal(false),
      accessToken: jasmine.createSpy('accessToken'),
      logoutLocal: jasmine.createSpy('logoutLocal')
    };
    config = jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['snapshot']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    api.notifications.and.returnValue(of([readNotification, unreadNotification]));
    api.markNotificationRead.and.returnValue(of(void 0));
    api.markAllNotificationsRead.and.returnValue(of(void 0));
    auth.accessToken.and.returnValue(of('access-token'));
    config.snapshot.and.returnValue({ wsUrl: 'ws://test.local/ws' } as ReturnType<RuntimeConfigService['snapshot']>);

    spyOn(Client.prototype, 'activate').and.callFake(function (this: Client) {
      this.onConnect({} as never);
    });
    spyOn(Client.prototype, 'subscribe').and.callFake((destination: string, callback: (message: IMessage) => void) => {
      subscriptions[destination] = callback;
      return { unsubscribe: jasmine.createSpy('unsubscribe') } as never;
    });
    spyOn(Client.prototype, 'deactivate').and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: ApiService, useValue: api },
        { provide: AuthFacade, useValue: auth as unknown as AuthFacade },
        { provide: RuntimeConfigService, useValue: config },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar }
      ]
    });

    service = TestBed.inject(NotificationService);
  });

  describe('Dado o estado local de notificações', () => {
    it('Então loadNotifications carrega a lista e unreadCount conta somente não lidas', () => {
      // Arrange

      // Act
      service.loadNotifications();

      // Assert
      expect(service.notifications()).toEqual([readNotification, unreadNotification]);
      expect(service.unreadCount()).toBe(1);
    });

    it('Então markRead marca somente a notificação informada', () => {
      // Arrange
      service.notifications.set([readNotification, unreadNotification]);

      // Act
      service.markRead('n-unread');

      // Assert
      expect(api.markNotificationRead).toHaveBeenCalledOnceWith('n-unread');
      expect(service.notifications().every((notification) => notification.read)).toBeTrue();
    });

    it('Então markAllRead marca todas as notificações como lidas', () => {
      // Arrange
      service.notifications.set([readNotification, unreadNotification]);

      // Act
      service.markAllRead();

      // Assert
      expect(api.markAllNotificationsRead).toHaveBeenCalledTimes(1);
      expect(service.notifications().every((notification) => notification.read)).toBeTrue();
    });

    it('Então markConversationReadLocally marca apenas a conversa selecionada', () => {
      // Arrange
      service.notifications.set([
        { ...unreadNotification, notificationId: 'n1', conversationId: 'c1' },
        { ...unreadNotification, notificationId: 'n2', conversationId: 'c2' }
      ]);

      // Act
      service.markConversationReadLocally('c1');

      // Assert
      expect(service.notifications().map((notification) => ({
        notificationId: notification.notificationId,
        read: notification.read
      }))).toEqual([
        { notificationId: 'n1', read: true },
        { notificationId: 'n2', read: false }
      ]);
    });
  });

  describe('Dado conexão realtime ativa', () => {
    it('Então autenticação verdadeira carrega notificações e abre STOMP', () => {
      // Arrange

      // Act
      auth.authenticated.set(true);
      TestBed.flushEffects();

      // Assert
      expect(api.notifications).toHaveBeenCalled();
      expect(Client.prototype.activate).toHaveBeenCalled();
      expect(Client.prototype.subscribe).toHaveBeenCalledWith('/user/queue/notifications', jasmine.any(Function));
      expect(Client.prototype.subscribe).toHaveBeenCalledWith('/user/queue/security', jasmine.any(Function));
    });

    it('Então adiciona notificação recebida no topo da lista', () => {
      // Arrange
      const incoming: NotificationResponse = { ...unreadNotification, notificationId: 'n-new' };
      service.notifications.set([readNotification]);
      service.startRealtimeConnection();

      // Act
      subscriptions['/user/queue/notifications']?.({ body: JSON.stringify(incoming) } as IMessage);

      // Assert
      expect(service.notifications()).toEqual([incoming, readNotification]);
    });

    it('Então evento ACCOUNT_BLOCKED encerra sessão local e navega para logged-out', () => {
      // Arrange
      const event: SecurityEventResponse = {
        type: 'ACCOUNT_BLOCKED',
        message: 'Bloqueada'
      };
      service.startRealtimeConnection();

      // Act
      subscriptions['/user/queue/security']?.({ body: JSON.stringify(event) } as IMessage);

      // Assert
      expect(snackBar.open).toHaveBeenCalledOnceWith('Bloqueada', 'Fechar', { duration: 8000 });
      expect(auth.logoutLocal).toHaveBeenCalledTimes(1);
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/logged-out');
    });

    it('Então evento ACCOUNT_BLOCKED usa mensagem padrão quando backend não envia texto', () => {
      // Arrange
      service.startRealtimeConnection();

      // Act
      subscriptions['/user/queue/security']?.({ body: JSON.stringify({ type: 'ACCOUNT_BLOCKED', message: '' }) } as IMessage);

      // Assert
      expect(snackBar.open).toHaveBeenCalledWith('Sua conta foi bloqueada por um administrador.', 'Fechar', {
        duration: 8000
      });
    });

    it('Então ignora evento de segurança desconhecido sem encerrar a sessão', () => {
      // Arrange
      service.startRealtimeConnection();

      // Act
      subscriptions['/user/queue/security']?.({ body: JSON.stringify({ type: 'PASSWORD_CHANGED', message: 'ok' }) } as IMessage);

      // Assert
      expect(snackBar.open).not.toHaveBeenCalled();
      expect(auth.logoutLocal).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('Então stopRealtimeConnection desativa o client existente', () => {
      // Arrange
      service.startRealtimeConnection();

      // Act
      service.stopRealtimeConnection();

      // Assert
      expect(Client.prototype.deactivate).toHaveBeenCalled();
    });

    it('Então autenticação falsa fecha realtime e limpa notificações', () => {
      // Arrange
      service.notifications.set([unreadNotification]);
      service.startRealtimeConnection();

      // Act
      auth.authenticated.set(false);
      TestBed.flushEffects();

      // Assert
      expect(service.notifications()).toEqual([]);
      expect(Client.prototype.deactivate).toHaveBeenCalled();
    });
  });
});
