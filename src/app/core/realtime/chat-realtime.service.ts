import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Subject, take } from 'rxjs';
import { MessageResponse } from '../api/api.types';
import { AuthFacade } from '../auth/auth.facade';
import { RuntimeConfigService } from '../config/runtime-config.service';

@Injectable({ providedIn: 'root' })
export class ChatRealtimeService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private readonly messagesSubject = new Subject<MessageResponse>();
  readonly messages$ = this.messagesSubject.asObservable();

  constructor(
    private readonly auth: AuthFacade,
    private readonly config: RuntimeConfigService
  ) {}

  connect(conversationId: string): void {
    this.disconnect();
    this.auth
      .accessToken()
      .pipe(take(1))
      .subscribe((token) => {
        this.client = new Client({
          brokerURL: this.config.snapshot().wsUrl,
          reconnectDelay: 5000,
          connectHeaders: {
            Authorization: `Bearer ${token}`
          },
          onConnect: () => {
            this.subscription = this.client?.subscribe(`/topic/chat/${conversationId}`, (message: IMessage) => {
              this.messagesSubject.next(JSON.parse(message.body) as MessageResponse);
            }) ?? null;
          }
        });
        this.client.activate();
      });
  }

  send(conversationId: string, body: string): void {
    if (!this.client?.connected) {
      return;
    }
    this.client.publish({
      destination: `/app/chat/${conversationId}/send`,
      body: JSON.stringify({ body })
    });
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    if (this.client) {
      void this.client.deactivate();
      this.client = null;
    }
  }
}
