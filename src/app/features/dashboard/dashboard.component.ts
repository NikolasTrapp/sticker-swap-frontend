import { DatePipe, NgIf } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AlbumResponse, ConversationResponse, MyProfileResponse } from '../../core/api/api.types';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatCardModule, NgIf, RouterLink],
  template: `
    <main class="page">
      <section class="app-page-header dashboard-header">
        <div>
          <span class="pill">Início</span>
          <h1>Suas trocas em um só lugar.</h1>
          <p class="app-muted">
            Atualize sua coleção, encontre quem tem as figurinhas faltantes e continue suas conversas.
          </p>
        </div>
        <div class="app-actions">
          <a mat-flat-button color="primary" routerLink="/search">Buscar figurinha</a>
          <a mat-stroked-button routerLink="/collection">Atualizar coleção</a>
        </div>
      </section>

      <section class="app-grid three">
        <mat-card class="outlined-card metric-card">
          <mat-card-header>
            <mat-card-title>Perfil</mat-card-title>
            <mat-card-subtitle>{{ profile()?.city || 'Cidade não informada' }} {{ profile()?.state || '' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <strong class="metric-value">{{ profile()?.nickname || 'Sem nickname' }}</strong>
          </mat-card-content>
          <mat-card-actions align="end">
            <a mat-button routerLink="/profile">Editar perfil</a>
          </mat-card-actions>
        </mat-card>

        <mat-card class="outlined-card metric-card">
          <mat-card-header>
            <mat-card-title>Álbuns ativos</mat-card-title>
            <mat-card-subtitle>Catálogos disponíveis para busca e coleção</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <strong class="metric-value">{{ albums().length }}</strong>
          </mat-card-content>
          <mat-card-actions align="end">
            <a mat-button routerLink="/catalog">Ver catálogo</a>
          </mat-card-actions>
        </mat-card>

        <mat-card class="outlined-card metric-card">
          <mat-card-header>
            <mat-card-title>Conversas</mat-card-title>
            <mat-card-subtitle *ngIf="chats()[0]?.updatedAt; else noActivity">
              Última atividade: {{ chats()[0]?.updatedAt | date: 'short' }}
            </mat-card-subtitle>
            <ng-template #noActivity>
              <mat-card-subtitle>Sem conversas ativas</mat-card-subtitle>
            </ng-template>
          </mat-card-header>
          <mat-card-content>
            <strong class="metric-value">{{ chats().length }}</strong>
          </mat-card-content>
          <mat-card-actions align="end">
            <a mat-button routerLink="/chats">Abrir chats</a>
          </mat-card-actions>
        </mat-card>
      </section>

      <mat-card class="outlined-card" *ngIf="!profile()?.nickname">
        <mat-card-content class="app-section-header">
          <div>
            <h2>Complete seu perfil</h2>
            <p class="app-muted">Escolha um nickname para aparecer melhor nas buscas e conversas.</p>
          </div>
          <a mat-flat-button color="primary" routerLink="/profile">Configurar</a>
        </mat-card-content>
      </mat-card>
    </main>
  `,
  styles: [
    `
      .dashboard-header {
        align-items: start;
      }

      .metric-card {
        display: flex;
        flex-direction: column;
        min-height: 172px;
      }

      .metric-card mat-card-content {
        flex: 1;
      }

      .metric-value {
        display: block;
        font-size: 2rem;
        line-height: 1.1;
        margin-top: 0.5rem;
      }

      @media (min-width: 760px) {
        .dashboard-header {
          grid-template-columns: minmax(0, 1fr) auto;
        }
      }
    `
  ]
})
export class DashboardComponent implements OnInit {
  readonly profile = signal<MyProfileResponse | null>(null);
  readonly albums = signal<AlbumResponse[]>([]);
  readonly chats = signal<ConversationResponse[]>([]);

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    forkJoin({
      profile: this.api.myProfile(),
      albums: this.api.albums(),
      chats: this.api.conversations()
    }).subscribe(({ profile, albums, chats }) => {
      this.profile.set(profile);
      this.albums.set(albums.content);
      this.chats.set(chats);
    });
  }
}
