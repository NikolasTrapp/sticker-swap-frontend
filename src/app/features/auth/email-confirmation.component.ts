import { NgIf } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';

type ConfirmationState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-email-confirmation',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatProgressSpinnerModule, NgIf, RouterLink],
  template: `
    <main class="app-auth-page">
      <mat-card class="auth-card outlined-card">
        <mat-card-header>
          <mat-card-title>Confirmação de e-mail</mat-card-title>
          <mat-card-subtitle>{{ message() }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="confirmation-progress" *ngIf="state() === 'loading'">
            <mat-spinner diameter="36" />
            <p class="app-muted">Isso leva apenas alguns segundos.</p>
          </div>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-flat-button color="primary" routerLink="/login" *ngIf="state() !== 'loading'">Ir para login</a>
        </mat-card-actions>
      </mat-card>
    </main>
  `,
  styles: [
    `
      .auth-card {
        margin: auto;
        max-width: 540px;
        width: 100%;
      }

      .confirmation-progress {
        align-items: center;
        display: flex;
        gap: 1rem;
        padding-top: 0.75rem;
      }
    `
  ]
})
export class EmailConfirmationComponent implements OnInit {
  readonly state = signal<ConfirmationState>('loading');
  readonly message = signal('Confirmando seu e-mail...');

  constructor(
    private readonly api: ApiService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('error');
      this.message.set('Este link de confirmação está incompleto. Solicite um novo cadastro ou tente novamente.');
      return;
    }
    this.api.confirmEmail(token).subscribe({
      next: () => {
        this.state.set('success');
        this.message.set('E-mail confirmado com sucesso. Você já pode entrar.');
      },
      error: () => {
        this.state.set('error');
        this.message.set('Este link expirou ou já foi usado. Tente entrar ou solicite um novo link.');
      }
    });
  }
}
