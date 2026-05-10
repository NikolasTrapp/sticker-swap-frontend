import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, of, switchMap, tap } from 'rxjs';
import { BlockedUserResponse } from '../../core/api/api.types';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    NgFor,
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
                <input matInput formControlName="cep" placeholder="01310-100" inputmode="numeric" autocomplete="postal-code" />
                <mat-hint *ngIf="cepLookupLoading()">Buscando cidade e UF...</mat-hint>
                <mat-hint *ngIf="cepLookupResolved()">Cidade e UF preenchidas pelo CEP.</mat-hint>
                <mat-error *ngIf="form.controls.cep.hasError('pattern')">Informe um CEP com 8 dígitos.</mat-error>
                <mat-error *ngIf="form.controls.cep.hasError('cepNotFound')">Não encontramos esse CEP.</mat-error>
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
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving() || cepLookupLoading()">
                {{ saving() ? 'Salvando...' : 'Salvar perfil' }}
              </button>
              <span class="success" *ngIf="saved()">Perfil atualizado.</span>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="outlined-card blocked-card">
        <mat-card-header>
          <mat-card-title>Usuários bloqueados</mat-card-title>
          <mat-card-subtitle>Gerencie quem não aparece nas suas buscas e conversas.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="blocked-list" *ngIf="blockedUsers().length; else noBlockedUsers">
            <article class="blocked-user" *ngFor="let user of blockedUsers()">
              <div>
                <h3>{{ user.nickname || 'Colecionador' }}</h3>
                <p class="app-muted">
                  <span *ngIf="user.city || user.state">{{ user.city }} {{ user.state }} · </span>
                  Bloqueado em {{ user.blockedAt | date: 'short' }}
                </p>
              </div>
              <button mat-stroked-button type="button" (click)="unblock(user)">Desbloquear</button>
            </article>
          </div>
          <ng-template #noBlockedUsers>
            <div class="empty">Nenhum usuário bloqueado.</div>
          </ng-template>

          <mat-paginator
            [length]="blockedTotalElements()"
            [pageIndex]="blockedPageIndex()"
            [pageSize]="blockedPageSize()"
            [pageSizeOptions]="[5, 10, 25]"
            [showFirstLastButtons]="true"
            (page)="pageBlockedUsers($event)"
          />
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

      .blocked-list {
        display: grid;
        gap: 0.75rem;
      }

      .blocked-user {
        align-items: start;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        display: grid;
        gap: 0.75rem;
        padding: 0.9rem;
      }

      .blocked-user h3,
      .blocked-user p {
        margin: 0;
      }

      @media (min-width: 720px) {
        .blocked-user {
          align-items: center;
          grid-template-columns: minmax(0, 1fr) auto;
        }
      }
    `
  ]
})
export class ProfileComponent implements OnInit {
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly cepLookupLoading = signal(false);
  readonly cepLookupResolved = signal(false);
  readonly blockedUsers = signal<BlockedUserResponse[]>([]);
  readonly blockedTotalElements = signal(0);
  readonly blockedPageIndex = signal(0);
  readonly blockedPageSize = signal(10);
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
    private readonly fb: FormBuilder,
    private readonly destroyRef: DestroyRef,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupCepLookup();
    this.api.myProfile().subscribe((profile) => {
      this.form.patchValue({
        nickname: profile.nickname ?? '',
        cep: profile.cep ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
        showCityStatePublicly: profile.showCityStatePublicly,
        useLocationForSearch: profile.useLocationForSearch
      }, { emitEvent: false });
    });
    this.loadBlockedUsers(0);
  }

  save(): void {
    if (this.form.invalid || this.cepLookupLoading()) {
      this.form.markAllAsTouched();
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

  pageBlockedUsers(event: PageEvent): void {
    this.blockedPageSize.set(event.pageSize);
    this.loadBlockedUsers(event.pageIndex);
  }

  unblock(user: BlockedUserResponse): void {
    this.api.unblockUser(user.userId).subscribe(() => {
      this.snackBar.open('Usuário desbloqueado.', 'Fechar', { duration: 3500 });
      this.loadBlockedUsers(this.blockedPageIndex());
    });
  }

  private loadBlockedUsers(pageIndex: number): void {
    this.api.blockedUsers(pageIndex, this.blockedPageSize()).subscribe((page) => {
      if (page.content.length === 0 && page.number > 0) {
        this.loadBlockedUsers(page.number - 1);
        return;
      }
      this.blockedUsers.set(page.content);
      this.blockedTotalElements.set(page.totalElements);
      this.blockedPageIndex.set(page.number);
      this.blockedPageSize.set(page.size);
    });
  }

  private setupCepLookup(): void {
    const cepControl = this.form.controls.cep;
    cepControl.valueChanges.pipe(
      map(normalizeCep),
      debounceTime(300),
      distinctUntilChanged(),
      tap((digits) => {
        this.cepLookupResolved.set(false);
        if (digits.length !== 8) {
          this.cepLookupLoading.set(false);
          clearControlError(cepControl, 'cepNotFound');
        }
      }),
      switchMap((digits) => {
        if (digits.length !== 8 || cepControl.hasError('pattern')) {
          return of(null);
        }
        this.cepLookupLoading.set(true);
        return this.api.lookupCep(digits).pipe(
          catchError(() => of(null)),
          finalize(() => this.cepLookupLoading.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((result) => {
      if (!result) {
        return;
      }
      if (!result.found || !result.city || !result.state) {
        setControlError(cepControl, 'cepNotFound');
        this.cepLookupResolved.set(false);
        return;
      }

      clearControlError(cepControl, 'cepNotFound');
      this.form.patchValue({ city: result.city, state: result.state }, { emitEvent: false });
      this.cepLookupResolved.set(true);
    });
  }
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeCep(value: string): string {
  return value.replace(/\D/g, '');
}

function setControlError(control: AbstractControl, errorName: string): void {
  control.setErrors({ ...(control.errors ?? {}), [errorName]: true });
}

function clearControlError(control: AbstractControl, errorName: string): void {
  const errors = { ...(control.errors ?? {}) };
  delete errors[errorName];
  control.setErrors(Object.keys(errors).length ? errors : null);
}
