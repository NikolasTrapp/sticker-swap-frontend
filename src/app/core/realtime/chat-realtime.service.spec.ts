import { Client, IMessage } from '@stomp/stompjs';
import { of } from 'rxjs';
import { MessageResponse } from '../api/api.types';
import { AuthFacade } from '../auth/auth.facade';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { ChatRealtimeService } from './chat-realtime.service';

describe('ChatRealtimeService', () => {
  let auth: jasmine.SpyObj<AuthFacade>;
  let config: jasmine.SpyObj<RuntimeConfigService>;
  let service: ChatRealtimeService;
  let chatCallback: ((message: IMessage) => void) | null;
  let unsubscribe: jasmine.Spy;

  beforeEach(() => {
    chatCallback = null;
    unsubscribe = jasmine.createSpy('unsubscribe');
    auth = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['accessToken']);
    config = jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['snapshot']);
    auth.accessToken.and.returnValue(of('access-token'));
    config.snapshot.and.returnValue({ wsUrl: 'ws://test.local/ws' } as ReturnType<RuntimeConfigService['snapshot']>);

    spyOn(Client.prototype, 'activate').and.callFake(function (this: Client) {
      this.onConnect({} as never);
    });
    spyOn(Client.prototype, 'subscribe').and.callFake((destination: string, callback: (message: IMessage) => void) => {
      if (destination === '/topic/chat/conversation-1') {
        chatCallback = callback;
      }
      return { unsubscribe } as never;
    });
    spyOn(Client.prototype, 'deactivate').and.returnValue(Promise.resolve());
    spyOn(Client.prototype, 'publish');

    service = new ChatRealtimeService(auth, config);
  });

  describe('Dado uma conversa selecionada', () => {
    it('Então connect assina o tópico com Authorization no header', () => {
      // Arrange

      // Act
      service.connect('conversation-1');

      // Assert
      expect(auth.accessToken).toHaveBeenCalledTimes(1);
      expect(Client.prototype.activate).toHaveBeenCalledTimes(1);
      expect(Client.prototype.subscribe).toHaveBeenCalledWith('/topic/chat/conversation-1', jasmine.any(Function));
    });

    it('Então emite mensagens recebidas pelo tópico STOMP', (done) => {
      // Arrange
      const incoming: MessageResponse = {
        messageId: 'message-1',
        conversationId: 'conversation-1',
        senderUserId: 'user-1',
        type: 'TEXT',
        body: 'Oi',
        sentAt: '2026-01-01T10:00:00Z'
      };

      // Act
      service.connect('conversation-1');
      service.messages$.subscribe((message) => {
        // Assert
        expect(message).toEqual(incoming);
        done();
      });
      chatCallback?.({ body: JSON.stringify(incoming) } as IMessage);
    });

    it('Então disconnect remove assinatura e desativa o client existente', () => {
      // Arrange
      service.connect('conversation-1');

      // Act
      service.disconnect();

      // Assert
      expect(unsubscribe).toHaveBeenCalledTimes(1);
      expect(Client.prototype.deactivate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dado envio de mensagem', () => {
    it('Então publica quando o client está conectado', () => {
      // Arrange
      const publish = jasmine.createSpy('publish');
      (service as unknown as { client: { connected: boolean; publish: jasmine.Spy } }).client = {
        connected: true,
        publish
      };

      // Act
      service.send('conversation-1', 'Mensagem');

      // Assert
      expect(publish).toHaveBeenCalledOnceWith({
        destination: '/app/chat/conversation-1/send',
        body: JSON.stringify({ body: 'Mensagem' })
      });
    });

    it('Então ignora envio quando o client está desconectado', () => {
      // Arrange
      const publish = jasmine.createSpy('publish');
      (service as unknown as { client: { connected: boolean; publish: jasmine.Spy } }).client = {
        connected: false,
        publish
      };

      // Act
      service.send('conversation-1', 'Mensagem');

      // Assert
      expect(publish).not.toHaveBeenCalled();
    });
  });
});
