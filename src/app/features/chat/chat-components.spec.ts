import { signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { convertToParamMap } from '@angular/router';
import { Subject, of } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { ConversationResponse, MessageResponse, Page } from '../../core/api/api.types';
import { AuthFacade, AuthProfile } from '../../core/auth/auth.facade';
import { NotificationService } from '../../core/notifications/notification.service';
import { ChatRealtimeService } from '../../core/realtime/chat-realtime.service';
import { ChatListComponent } from './chat-list.component';
import { ChatRoomComponent } from './chat-room.component';

const conversation: ConversationResponse = {
  conversationId: 'conversation-1',
  otherUserId: 'user-2',
  otherNickname: 'Ana',
  stickerId: 'sticker-1',
  stickerNumber: '001',
  stickerName: 'Mascote',
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-02T10:00:00Z'
};

const message: MessageResponse = {
  messageId: 'message-1',
  conversationId: 'conversation-1',
  senderUserId: 'user-2',
  type: 'TEXT',
  body: 'Oi',
  sentAt: '2026-01-02T10:00:00Z'
};

function page<T>(content: T[]): Page<T> {
  return { content, totalElements: content.length, totalPages: 1, size: 10, number: 0 };
}

function routeWithConversation(id: string | null) {
  return {
    snapshot: {
      paramMap: convertToParamMap(id ? { conversationId: id } : {})
    }
  };
}

describe('ChatListComponent', () => {
  describe('Dado a lista de conversas', () => {
    it('Então carrega conversas ao montar', () => {
      // Arrange
      const api = jasmine.createSpyObj<ApiService>('ApiService', ['conversations']);
      api.conversations.and.returnValue(of([conversation]));
      const component = new ChatListComponent(api);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.conversations()).toEqual([conversation]);
    });
  });
});

describe('ChatRoomComponent', () => {
  let api: jasmine.SpyObj<ApiService>;
  let realtime: jasmine.SpyObj<ChatRealtimeService> & { messages$: Subject<MessageResponse> };
  let notifications: jasmine.SpyObj<NotificationService>;
  let auth: { profile: ReturnType<typeof signal<AuthProfile | null>> };

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'conversations',
      'markConversationNotificationsRead',
      'messages'
    ]);
    realtime = jasmine.createSpyObj<ChatRealtimeService>('ChatRealtimeService', ['connect', 'disconnect', 'send']) as jasmine.SpyObj<ChatRealtimeService> & {
      messages$: Subject<MessageResponse>;
    };
    realtime.messages$ = new Subject<MessageResponse>();
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['markConversationReadLocally']);
    auth = { profile: signal<AuthProfile | null>({ sub: 'user-1', email: 'user@test.local', role: 'USER' }) };

    api.messages.and.returnValue(of(page([message])));
    api.conversations.and.returnValue(of([conversation]));
    api.markConversationNotificationsRead.and.returnValue(of(void 0));
  });

  describe('Dado uma conversa na rota', () => {
    it('Então carrega histórico, conecta realtime e marca notificações como lidas', () => {
      // Arrange
      const component = new ChatRoomComponent(
        api,
        auth as unknown as AuthFacade,
        new FormBuilder(),
        realtime,
        routeWithConversation('conversation-1') as never,
        notifications
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(component.messages()).toEqual([message]);
      expect(component.conversation()).toEqual(conversation);
      expect(realtime.connect).toHaveBeenCalledOnceWith('conversation-1');
      expect(api.markConversationNotificationsRead).toHaveBeenCalledOnceWith('conversation-1');
      expect(notifications.markConversationReadLocally).toHaveBeenCalledOnceWith('conversation-1');
    });

    it('Então adiciona mensagem realtime ao fim da lista', () => {
      // Arrange
      const component = new ChatRoomComponent(
        api,
        auth as unknown as AuthFacade,
        new FormBuilder(),
        realtime,
        routeWithConversation('conversation-1') as never,
        notifications
      );
      const incoming = { ...message, messageId: 'message-2', body: 'Nova' };

      // Act
      component.ngOnInit();
      realtime.messages$.next(incoming);

      // Assert
      expect(component.messages()).toEqual([message, incoming]);
    });

    it('Então envia mensagem válida e limpa o formulário', () => {
      // Arrange
      const component = new ChatRoomComponent(
        api,
        auth as unknown as AuthFacade,
        new FormBuilder(),
        realtime,
        routeWithConversation('conversation-1') as never,
        notifications
      );
      component.ngOnInit();
      component.form.setValue({ body: '  Olá  ' });

      // Act
      component.send();

      // Assert
      expect(realtime.send).toHaveBeenCalledOnceWith('conversation-1', 'Olá');
      expect(component.form.getRawValue().body).toBe('');
    });

    it('Então ignora envio quando form é inválido ou corpo fica vazio', () => {
      // Arrange
      const component = new ChatRoomComponent(
        api,
        auth as unknown as AuthFacade,
        new FormBuilder(),
        realtime,
        routeWithConversation('conversation-1') as never,
        notifications
      );
      component.ngOnInit();

      // Act
      component.send();
      component.form.setValue({ body: '   ' });
      component.send();

      // Assert
      expect(realtime.send).not.toHaveBeenCalled();
    });

    it('Então desconecta realtime ao destruir', () => {
      // Arrange
      const component = new ChatRoomComponent(
        api,
        auth as unknown as AuthFacade,
        new FormBuilder(),
        realtime,
        routeWithConversation('conversation-1') as never,
        notifications
      );
      component.ngOnInit();

      // Act
      component.ngOnDestroy();
      realtime.messages$.next({ ...message, messageId: 'late' });

      // Assert
      expect(realtime.disconnect).toHaveBeenCalledTimes(1);
      expect(component.messages()).toEqual([message]);
    });

    it('Então formata título e subtítulo com dados da conversa', () => {
      // Arrange
      const component = new ChatRoomComponent(
        api,
        auth as unknown as AuthFacade,
        new FormBuilder(),
        realtime,
        routeWithConversation('conversation-1') as never,
        notifications
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(component.conversationTitle()).toBe('Ana');
      expect(component.conversationSubtitle()).toBe('Figurinha #001 - Mascote');
    });

    it('Então usa fallbacks para conversa sem figurinha ou nickname', () => {
      // Arrange
      api.conversations.and.returnValue(of([{ ...conversation, otherNickname: null, stickerNumber: null, stickerName: null }]));
      const component = new ChatRoomComponent(
        api,
        auth as unknown as AuthFacade,
        new FormBuilder(),
        realtime,
        routeWithConversation('conversation-1') as never,
        notifications
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(component.conversationTitle()).toBe('Conversa');
      expect(component.conversationSubtitle()).toBe('Combine os detalhes da troca diretamente com o colecionador.');
    });

    it('Então usa fallback de nome quando conversa tem número mas não tem nome de figurinha', () => {
      // Arrange
      api.conversations.and.returnValue(of([{ ...conversation, stickerName: null }]));
      const component = new ChatRoomComponent(
        api,
        auth as unknown as AuthFacade,
        new FormBuilder(),
        realtime,
        routeWithConversation('conversation-1') as never,
        notifications
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(component.conversationSubtitle()).toBe('Figurinha #001 - sem nome');
    });
  });

  describe('Dado ausência de conversationId na rota', () => {
    it('Então não chama APIs nem realtime', () => {
      // Arrange
      const component = new ChatRoomComponent(
        api,
        auth as unknown as AuthFacade,
        new FormBuilder(),
        realtime,
        routeWithConversation(null) as never,
        notifications
      );

      // Act
      component.ngOnInit();
      component.send();

      // Assert
      expect(api.messages).not.toHaveBeenCalled();
      expect(realtime.connect).not.toHaveBeenCalled();
      expect(realtime.send).not.toHaveBeenCalled();
    });
  });
});
