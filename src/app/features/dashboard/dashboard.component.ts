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
      <section class="hero-card">
        <span class="pill">MVP operacional</span>
        <h1>Encontre trocas reais sem transformar isso em marketplace.</h1>
        <p class="muted">
          Organize suas repetidas, marque faltantes, busque colecionadores por álbum e inicie conversas com contexto.
        </p>
        <div class="actions">
          <a mat-flat-button color="primary" routerLink="/search">Buscar figurinha</a>
          <a mat-stroked-button routerLink="/collection">Atualizar coleção</a>
        </div>
      </section>

      <section class="grid three">
        <mat-card class="metric-card">
          <mat-card-title>Perfil</mat-card-title>
          <mat-card-content>
            <strong>{{ profile()?.nickname || 'Sem nickname' }}</strong>
            <p class="muted">{{ profile()?.city || 'Cidade não informada' }} {{ profile()?.state || '' }}</p>
            <a mat-button routerLink="/profile">Editar perfil</a>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-title>Álbuns ativos</mat-card-title>
          <mat-card-content>
            <strong>{{ albums().length }}</strong>
            <p class="muted">Catálogos disponíveis para busca e coleção.</p>
            <a mat-button routerLink="/catalog">Ver catálogo</a>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-title>Conversas</mat-card-title>
          <mat-card-content>
            <strong>{{ chats().length }}</strong>
            <p class="muted">Última atividade: {{ chats()[0]?.updatedAt | date: 'short' }}</p>
            <a mat-button routerLink="/chats">Abrir chats</a>
          </mat-card-content>
        </mat-card>
      </section>

      <section class="panel" *ngIf="!profile()?.nickname">
        <div class="section-title">
          <div>
            <h2>Complete seu perfil</h2>
            <p class="muted">O nickname é necessário para aparecer com clareza em buscas e chats.</p>
          </div>
          <a mat-flat-button color="primary" routerLink="/profile">Configurar</a>
        </div>
      </section>
    </main>
  `
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
