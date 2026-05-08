import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '../../core/auth/auth.facade';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    NgIf,
    ReactiveFormsModule,
    RouterLink
  ],
  template: `
    <main class="auth-page">
      <section class="auth-hero">
        <span class="pill">Copa 2026</span>
        <h1>Troque figurinhas com contexto, segurança e conversa direta.</h1>
        <p>
          Entre para buscar quem tem a figurinha que falta, organizar repetidas e abrir chats de troca com intenção clara.
        </p>
      </section>

      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Entrar</mat-card-title>
          <mat-card-subtitle>Login via OAuth2 Authorization Code + PKCE</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
            <mat-form-field>
              <mat-label>E-mail</mat-label>
              <input matInput type="email" autocomplete="email" formControlName="email" />
              <mat-error *ngIf="form.controls.email.invalid">Informe um e-mail válido</mat-error>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Senha</mat-label>
              <input matInput type="password" autocomplete="current-password" formControlName="password" />
              <mat-error *ngIf="form.controls.password.invalid">Senha obrigatória</mat-error>
            </mat-form-field>

            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || auth.busy()">
              {{ auth.busy() ? 'Entrando...' : 'Entrar' }}
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-button routerLink="/password-reset-request">Esqueci minha senha</a>
          <a mat-button routerLink="/register">Criar conta</a>
        </mat-card-actions>
      </mat-card>
    </main>
  `,
  styles: [
    `
      .auth-page {
        align-items: center;
        display: grid;
        gap: 1.25rem;
        min-height: 100vh;
        padding: 1rem;
      }

      .auth-hero,
      .auth-card {
        margin: 0 auto;
        max-width: 560px;
      }

      .auth-hero {
        animation: enter 500ms ease-out both;
      }

      .auth-hero h1 {
        font-size: clamp(2.4rem, 10vw, 5rem);
        letter-spacing: -0.07em;
        line-height: 0.9;
        margin: 1rem 0;
      }

      .auth-hero p {
        color: var(--muted);
        font-size: 1.05rem;
        line-height: 1.6;
      }

      .auth-card {
        animation: enter 650ms ease-out both;
        border-radius: var(--radius);
        width: 100%;
      }

      @media (min-width: 900px) {
        .auth-page {
          grid-template-columns: minmax(0, 1fr) 440px;
          padding: 3rem;
        }
      }

      @keyframes enter {
        from {
          opacity: 0;
          transform: translateY(18px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `
  ]
})
export class LoginComponent {
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor(
    private readonly fb: FormBuilder,
    readonly auth: AuthFacade
  ) {}

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    this.auth.login(value.email, value.password).subscribe();
  }
}
