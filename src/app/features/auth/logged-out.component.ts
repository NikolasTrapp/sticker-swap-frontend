import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logged-out',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, RouterLink],
  template: `
    <main class="app-auth-page">
      <mat-card class="auth-card outlined-card">
        <mat-card-header>
          <mat-card-title>Você saiu da sua conta</mat-card-title>
          <mat-card-subtitle>Quando quiser continuar suas trocas, entre novamente.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions align="end">
          <a mat-flat-button color="primary" routerLink="/login">Entrar novamente</a>
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
export class LoggedOutComponent {}
