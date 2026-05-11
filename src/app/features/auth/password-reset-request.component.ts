import { NgIf } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-password-reset-request',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatDividerModule, MatFormFieldModule, MatInputModule, NgIf, ReactiveFormsModule, RouterLink],
  template: `
    <main class="app-auth-page">
      <mat-card class="auth-card outlined-card">
        <mat-card-header>
          <mat-card-title>Recuperar senha</mat-card-title>
          <mat-card-subtitle>Informe o e-mail cadastrado para receber o link de recuperação.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
            <mat-form-field>
              <mat-label>E-mail</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving() || done()">
              {{ done() ? 'Link enviado' : 'Enviar instruções' }}
            </button>
          </form>
          <p class="success" *ngIf="done()">Enviamos um link para redefinir sua senha. Confira sua caixa de entrada e spam.</p>
        </mat-card-content>
        <mat-divider />
        <mat-card-actions align="end">
          <a mat-button routerLink="/login">Voltar</a>
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

      .success {
        margin-top: 1rem;
      }
    `
  ]
})
export class PasswordResetRequestComponent {
  readonly done = signal(false);
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  constructor(
    private readonly api: ApiService,
    private readonly fb: FormBuilder
  ) {}

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.done.set(false);
    this.saving.set(true);
    this.api
      .requestPasswordReset(this.form.getRawValue().email)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => {
        this.done.set(true);
        this.form.disable();
      });
  }
}
