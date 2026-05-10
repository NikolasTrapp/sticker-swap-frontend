import { NgIf } from '@angular/common';
import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../core/auth/auth.facade';

type LogoutState = 'confirming' | 'working' | 'error';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatProgressSpinnerModule, NgIf, RouterLink],
  template: `
    <main class="app-auth-page">
      <mat-card class="auth-card outlined-card">
        <mat-card-header>
          <mat-card-title>Deseja sair da sua conta?</mat-card-title>
          <mat-card-subtitle *ngIf="state() === 'confirming'">
            Sua sessão será encerrada neste navegador.
          </mat-card-subtitle>
          <mat-card-subtitle *ngIf="state() === 'working'">
            Encerrando sua sessão com segurança.
          </mat-card-subtitle>
          <mat-card-subtitle *ngIf="state() === 'error'">
            Não conseguimos encerrar a sessão no servidor agora.
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="logout-progress" *ngIf="state() === 'working'">
            <mat-spinner diameter="36" />
            <p class="app-muted">Aguarde um instante.</p>
          </div>

          <p class="app-muted" *ngIf="state() === 'error'">
            Você pode tentar novamente ou sair apenas deste navegador. Se escolher o fallback, sua sessão local será
            limpa, mas pode levar alguns minutos para o acesso remoto expirar por completo.
          </p>
        </mat-card-content>

        <mat-card-actions align="end" *ngIf="state() === 'confirming'">
          <a mat-button routerLink="/dashboard">Cancelar</a>
          <button mat-flat-button color="primary" type="button" (click)="confirm()">Sair</button>
        </mat-card-actions>

        <mat-card-actions align="end" *ngIf="state() === 'error'">
          <button mat-button type="button" (click)="logoutLocal()">Sair deste navegador</button>
          <button mat-flat-button color="primary" type="button" (click)="confirm()">Tentar novamente</button>
        </mat-card-actions>
      </mat-card>
    </main>
  `,
  styles: [
    `
      .auth-card {
        margin: auto;
        max-width: 520px;
        width: 100%;
      }

      .logout-progress {
        align-items: center;
        display: flex;
        gap: 1rem;
        padding-top: 0.75rem;
      }
    `
  ]
})
export class LogoutComponent {
  readonly state = signal<LogoutState>('confirming');

  constructor(
    private readonly auth: AuthFacade,
    private readonly router: Router
  ) {}

  confirm(): void {
    this.state.set('working');
    this.auth.logoutAndRevoke().subscribe({
      next: () => void this.router.navigateByUrl('/logged-out'),
      error: () => this.state.set('error')
    });
  }

  logoutLocal(): void {
    this.auth.logoutLocal();
    void this.router.navigateByUrl('/logged-out');
  }
}
