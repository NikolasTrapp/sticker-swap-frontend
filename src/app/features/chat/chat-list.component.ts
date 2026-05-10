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
      <section class="app-page-header">
        <span class="pill">Chat</span>
        <h1>Conversas de troca</h1>
        <p class="app-muted">Combine detalhes com outros colecionadores e mantenha o contexto da figurinha.</p>
      </section>

      <section class="list">
        <mat-card class="outlined-card" *ngFor="let chat of conversations()">
          <mat-card-header>
            <mat-card-title>{{ chat.otherNickname || 'Colecionador' }}</mat-card-title>
            <mat-card-subtitle>
              #{{ chat.stickerNumber || '-' }} {{ chat.stickerName || 'Sem figurinha vinculada' }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p class="app-muted">Última atividade: {{ chat.updatedAt | date: 'short' }}</p>
          </mat-card-content>
          <mat-card-actions align="end">
            <a mat-flat-button color="primary" [routerLink]="['/chats', chat.conversationId]">Abrir</a>
          </mat-card-actions>
        </mat-card>
        <div class="empty" *ngIf="!conversations().length">Nenhuma conversa ainda. Busque uma figurinha e clique em “Tenho interesse”.</div>
      </section>
    </main>
  `
})
export class ChatListComponent implements OnInit {
  readonly conversations = signal<ConversationResponse[]>([]);

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.conversations().subscribe((items) => this.conversations.set(items));
  }
}
