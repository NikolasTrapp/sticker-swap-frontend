import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-email-confirmed',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, RouterLink],
  template: `
    <main class="app-auth-page">
      <mat-card class="auth-card outlined-card">
        <mat-card-header>
          <mat-card-title>E-mail confirmado</mat-card-title>
          <mat-card-subtitle>Sua conta foi ativada com sucesso.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p class="app-muted">Agora você já pode entrar e continuar suas trocas.</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-flat-button color="primary" routerLink="/login">Ir para login</a>
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
    `
  ]
})
export class EmailConfirmedComponent {}
