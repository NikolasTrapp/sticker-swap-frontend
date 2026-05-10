import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-email-confirmation-sent',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, NgIf, RouterLink],
  template: `
    <main class="app-auth-page">
      <mat-card class="confirmation-card outlined-card">
        <mat-card-header>
          <mat-card-title>Confirme seu e-mail</mat-card-title>
          <mat-card-subtitle *ngIf="email; else genericMessage">
            Enviamos um link de confirmação para {{ email }}.
          </mat-card-subtitle>
        </mat-card-header>
        <ng-template #genericMessage>
          <mat-card-subtitle>Enviamos um link de confirmação para o e-mail informado.</mat-card-subtitle>
        </ng-template>
        <mat-card-content>
          <p class="app-muted">Confira sua caixa de entrada e spam. Depois de confirmar a conta, volte para fazer login.</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-flat-button color="primary" routerLink="/login">Ir para login</a>
          <a mat-button routerLink="/register">Usar outro e-mail</a>
        </mat-card-actions>
      </mat-card>
    </main>
  `,
  styles: [
    `
      .confirmation-card {
        margin: auto;
        max-width: 560px;
        width: 100%;
      }
    `
  ]
})
export class EmailConfirmationSentComponent {
  readonly email = typeof history.state?.email === 'string' ? history.state.email : '';
}
