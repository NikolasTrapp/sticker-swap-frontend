import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { ConversationResponse } from '../../core/api/api.types';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatCardModule, NgFor, NgIf, RouterLink],
  template: `
    <main class="page">
      <section class="hero-card">
        <span class="pill">Chat</span>
        <h1>Conversas iniciadas por intenção de troca.</h1>
        <p class="muted">O sistema não confirma a troca física. A negociação acontece entre os usuários.</p>
      </section>

      <section class="list">
        <mat-card *ngFor="let chat of conversations()">
          <mat-card-content class="chat-row">
            <div>
              <h3>{{ chat.otherNickname || 'Colecionador' }}</h3>
              <p class="muted">
                #{{ chat.stickerNumber || '-' }} {{ chat.stickerName || 'Sem figurinha vinculada' }} ·
                {{ chat.updatedAt | date: 'short' }}
              </p>
            </div>
            <a mat-flat-button color="primary" [routerLink]="['/chats', chat.conversationId]">Abrir</a>
          </mat-card-content>
        </mat-card>
        <div class="empty" *ngIf="!conversations().length">Nenhuma conversa ainda. Busque uma figurinha e clique em “Tenho interesse”.</div>
      </section>
    </main>
  `,
  styles: [
    `
      .chat-row {
        align-items: center;
        display: grid;
        gap: 1rem;
      }

      @media (min-width: 720px) {
        .chat-row {
          grid-template-columns: 1fr auto;
        }
      }
    `
  ]
})
export class ChatListComponent implements OnInit {
  readonly conversations = signal<ConversationResponse[]>([]);

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.conversations().subscribe((items) => this.conversations.set(items));
  }
}
