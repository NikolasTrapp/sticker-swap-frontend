import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageResponse } from '../../core/api/api.types';
import { ApiService } from '../../core/api/api.service';
import { AuthFacade } from '../../core/auth/auth.facade';
import { ChatRealtimeService } from '../../core/realtime/chat-realtime.service';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    NgClass,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    RouterLink
  ],
  template: `
    <main class="page chat-page">
      <section class="panel">
        <div class="section-title">
          <div>
            <h1>Conversa</h1>
            <p class="muted">Mensagens em tempo real via STOMP/WebSocket.</p>
          </div>
          <a mat-button routerLink="/chats">Voltar</a>
        </div>
      </section>

      <section class="messages panel">
        <article
          *ngFor="let message of messages()"
          class="message"
          [ngClass]="{ mine: message.senderUserId === auth.profile()?.sub, system: message.type === 'SYSTEM_INTENT' }"
        >
          <p>{{ message.body }}</p>
          <small>{{ message.sentAt | date: 'short' }}</small>
        </article>
        <div class="empty" *ngIf="!messages().length">Nenhuma mensagem carregada.</div>
      </section>

      <form [formGroup]="form" (ngSubmit)="send()" class="composer panel">
        <mat-form-field class="full-width">
          <mat-label>Mensagem</mat-label>
          <input matInput formControlName="body" maxlength="2000" />
        </mat-form-field>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Enviar</button>
      </form>
    </main>
  `,
  styles: [
    `
      .chat-page {
        max-width: 900px;
      }

      .messages {
        align-content: end;
        display: grid;
        min-height: 48vh;
      }

      .message {
        background: var(--surface-2);
        border-radius: 18px 18px 18px 4px;
        margin: 0.4rem 0;
        max-width: 78%;
        padding: 0.75rem 0.9rem;
      }

      .message.mine {
        background: var(--brand-soft);
        border-radius: 18px 18px 4px 18px;
        justify-self: end;
      }

      .message.system {
        background: transparent;
        border: 1px dashed var(--line);
        justify-self: center;
        max-width: 92%;
        text-align: center;
      }

      .message p {
        margin: 0 0 0.35rem;
      }

      .message small {
        color: var(--muted);
      }

      .composer {
        align-items: center;
        bottom: 5rem;
        display: grid;
        gap: 0.75rem;
        grid-template-columns: 1fr auto;
        position: sticky;
      }

      @media (min-width: 920px) {
        .composer {
          bottom: 1rem;
        }
      }
    `
  ]
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  readonly messages = signal<MessageResponse[]>([]);
  readonly form = this.fb.nonNullable.group({
    body: ['', [Validators.required, Validators.maxLength(2000)]]
  });

  private conversationId = '';
  private realtimeSubscription: Subscription | null = null;

  constructor(
    private readonly api: ApiService,
    readonly auth: AuthFacade,
    private readonly fb: FormBuilder,
    private readonly realtime: ChatRealtimeService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('conversationId');
    if (!id) {
      return;
    }
    this.conversationId = id;
    this.api.messages(id).subscribe((page) => this.messages.set(page.content));
    this.realtime.connect(id);
    this.realtimeSubscription = this.realtime.messages$.subscribe((message) => {
      this.messages.update((items) => [...items, message]);
    });
  }

  ngOnDestroy(): void {
    this.realtimeSubscription?.unsubscribe();
    this.realtime.disconnect();
  }

  send(): void {
    if (this.form.invalid || !this.conversationId) {
      return;
    }
    const body = this.form.getRawValue().body.trim();
    if (!body) {
      return;
    }
    this.realtime.send(this.conversationId, body);
    this.form.reset();
  }
}
