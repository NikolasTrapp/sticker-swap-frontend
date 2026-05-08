import { NgIf } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, NgIf, ReactiveFormsModule, RouterLink],
  template: `
    <main class="page auth-simple">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Definir nova senha</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
            <mat-form-field>
              <mat-label>Nova senha</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
              Atualizar senha
            </button>
          </form>
          <p class="muted" *ngIf="done()">Senha atualizada.</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-button routerLink="/login">Entrar</a>
        </mat-card-actions>
      </mat-card>
    </main>
  `
})
export class PasswordResetComponent {
  readonly done = signal(false);
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(
    private readonly api: ApiService,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute
  ) {}

  submit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token || this.form.invalid) {
      return;
    }
    this.saving.set(true);
    this.api
      .resetPassword(token, this.form.getRawValue().password)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => this.done.set(true));
  }
}
