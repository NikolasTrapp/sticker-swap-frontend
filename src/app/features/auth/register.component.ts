import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="page auth-simple">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Criar conta</mat-card-title>
          <mat-card-subtitle>Use e-mail e senha. A API enviará o link de confirmação quando e-mail estiver configurado.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
            <mat-form-field>
              <mat-label>E-mail</mat-label>
              <input matInput type="email" autocomplete="email" formControlName="email" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Senha</mat-label>
              <input matInput type="password" autocomplete="new-password" formControlName="password" />
              <mat-hint>Mínimo de 8 caracteres</mat-hint>
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Criando...' : 'Criar conta' }}
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-button routerLink="/login">Voltar ao login</a>
        </mat-card-actions>
      </mat-card>
    </main>
  `,
  styles: [
    `
      .auth-simple {
        min-height: 100vh;
        place-content: center;
      }

      .auth-card {
        border-radius: var(--radius);
        margin: auto;
        max-width: 520px;
        width: 100%;
      }
    `
  ]
})
export class RegisterComponent {
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(
    private readonly api: ApiService,
    private readonly fb: FormBuilder,
    private readonly router: Router
  ) {}

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    const value = this.form.getRawValue();
    this.api
      .register(value.email, value.password)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => this.router.navigateByUrl('/login'));
  }
}
