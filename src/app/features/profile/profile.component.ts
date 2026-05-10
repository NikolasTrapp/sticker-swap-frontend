import { NgIf } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    NgIf,
    ReactiveFormsModule
  ],
  template: `
    <main class="page">
      <section class="app-page-header">
        <span class="pill">Perfil</span>
        <h1>Perfil e privacidade</h1>
        <p class="app-muted">Defina como você aparece nas buscas e quais dados ajudam a priorizar trocas próximas.</p>
      </section>

      <mat-card class="outlined-card profile-card">
        <mat-card-header>
          <mat-card-title>Dados públicos</mat-card-title>
          <mat-card-subtitle>CEP não aparece para outros usuários.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="save()" class="form-grid profile-form">
            <mat-form-field>
              <mat-label>Nickname</mat-label>
              <input matInput formControlName="nickname" maxlength="50" />
            </mat-form-field>
            <div class="grid three">
              <mat-form-field>
                <mat-label>CEP</mat-label>
                <input matInput formControlName="cep" placeholder="01310-100" />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Cidade</mat-label>
                <input matInput formControlName="city" />
              </mat-form-field>
              <mat-form-field>
                <mat-label>UF</mat-label>
                <input matInput formControlName="state" maxlength="2" />
              </mat-form-field>
            </div>
            <mat-divider />
            <mat-slide-toggle formControlName="showCityStatePublicly">Exibir cidade/UF publicamente</mat-slide-toggle>
            <mat-slide-toggle formControlName="useLocationForSearch">Usar localização para priorizar buscas</mat-slide-toggle>
            <div class="actions">
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
                {{ saving() ? 'Salvando...' : 'Salvar perfil' }}
              </button>
              <span class="success" *ngIf="saved()">Perfil atualizado.</span>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </main>
  `,
  styles: [
    `
      .profile-card mat-card-content {
        padding-top: 1.25rem !important;
      }

      .profile-form mat-divider {
        margin: 0.35rem 0 0.25rem;
      }

      .profile-form mat-slide-toggle {
        justify-self: start;
      }
    `
  ]
})
export class ProfileComponent implements OnInit {
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly form = this.fb.nonNullable.group({
    nickname: ['', [Validators.minLength(2), Validators.maxLength(50)]],
    cep: ['', [Validators.pattern(/\d{5}-?\d{3}/)]],
    city: ['', [Validators.maxLength(100)]],
    state: ['', [Validators.pattern(/[A-Z]{2}/)]],
    showCityStatePublicly: [false],
    useLocationForSearch: [false]
  });

  constructor(
    private readonly api: ApiService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.api.myProfile().subscribe((profile) => {
      this.form.patchValue({
        nickname: profile.nickname ?? '',
        cep: profile.cep ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
        showCityStatePublicly: profile.showCityStatePublicly,
        useLocationForSearch: profile.useLocationForSearch
      });
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    this.saved.set(false);
    const value = this.form.getRawValue();
    this.api
      .updateProfile({
        nickname: emptyToNull(value.nickname),
        cep: emptyToNull(value.cep),
        city: emptyToNull(value.city),
        state: emptyToNull(value.state.toUpperCase()),
        showCityStatePublicly: value.showCityStatePublicly,
        useLocationForSearch: value.useLocationForSearch
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => this.saved.set(true));
  }
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
