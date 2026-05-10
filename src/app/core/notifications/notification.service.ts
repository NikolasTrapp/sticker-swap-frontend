import { Injectable, computed, effect, signal } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { take } from 'rxjs';
import { ApiService } from '../api/api.service';
import { NotificationResponse } from '../api/api.types';
import { AuthFacade } from '../auth/auth.facade';
import { RuntimeConfigService } from '../config/runtime-config.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<NotificationResponse[]>([]);
  readonly panelOpen = signal(false);
  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  private client: Client | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthFacade,
    private readonly config: RuntimeConfigService
  ) {
    effect(() => {
      if (this.auth.authenticated()) {
        this.loadNotifications();
        this.startRealtimeConnection();
      } else {
        this.stopRealtimeConnection();
        this.notifications.set([]);
      }
    });
  }

  loadNotifications(): void {
    this.api.notifications().subscribe((list) => this.notifications.set(list));
  }

  markRead(id: string): void {
    this.api.markNotificationRead(id).subscribe(() => {
      this.notifications.update((ns) => ns.map((n) => (n.notificationId === id ? { ...n, read: true } : n)));
    });
  }

  markAllRead(): void {
    this.api.markAllNotificationsRead().subscribe(() => {
      this.notifications.update((ns) => ns.map((n) => ({ ...n, read: true })));
    });
  }

  markConversationReadLocally(conversationId: string): void {
    this.notifications.update((ns) =>
      ns.map((n) => (n.conversationId === conversationId ? { ...n, read: true } : n))
    );
  }

  startRealtimeConnection(): void {
    this.stopRealtimeConnection();
    this.auth
      .accessToken()
      .pipe(take(1))
      .subscribe((token) => {
        this.client = new Client({
          brokerURL: this.config.snapshot().wsUrl,
          reconnectDelay: 5000,
          connectHeaders: { Authorization: `Bearer ${token}` },
          onConnect: () => {
            this.client?.subscribe('/user/queue/notifications', (message: IMessage) => {
              const incoming = JSON.parse(message.body) as NotificationResponse;
              this.notifications.update((ns) => [incoming, ...ns]);
            });
          }
        });
        this.client.activate();
      });
  }

  stopRealtimeConnection(): void {
    if (this.client) {
      void this.client.deactivate();
      this.client = null;
    }
  }
}
