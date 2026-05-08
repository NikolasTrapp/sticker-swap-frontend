import { NgIf } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-password-reset-request',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, NgIf, ReactiveFormsModule, RouterLink],
  template: `
    <main class="page auth-simple">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Recuperar senha</mat-card-title>
          <mat-card-subtitle>Informe seu e-mail. A resposta é neutra por segurança.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
            <mat-form-field>
              <mat-label>E-mail</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
              Enviar instruções
            </button>
          </form>
          <p class="muted" *ngIf="done()">Se a conta existir, as instruções serão enviadas.</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-button routerLink="/login">Voltar</a>
        </mat-card-actions>
      </mat-card>
    </main>
  `
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
    this.saving.set(true);
    this.api
      .requestPasswordReset(this.form.getRawValue().email)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => this.done.set(true));
  }
}
