import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { finalize } from 'rxjs';
import { AdminUserResponse, AlbumResponse, ReportReason, ReportResponse, ReportStatus, StickerResponse } from '../../core/api/api.types';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    NgFor,
    NgIf,
    ReactiveFormsModule
  ],
  template: `
    <main class="page">
      <section class="app-page-header">
        <span class="pill">Admin</span>
        <h1>Catálogo e moderação</h1>
        <p class="app-muted">Gerencie álbuns, figurinhas e denúncias da comunidade.</p>
      </section>

      <div class="admin-section-switcher" role="tablist" aria-label="Áreas do painel administrativo">
        <button
          type="button"
          role="tab"
          [class.active]="adminTabIndex() === 0"
          [attr.aria-selected]="adminTabIndex() === 0"
          (click)="setAdminTab(0)"
        >
          Álbuns
        </button>
        <button
          type="button"
          role="tab"
          [class.active]="adminTabIndex() === 1"
          [attr.aria-selected]="adminTabIndex() === 1"
          (click)="setAdminTab(1)"
        >
          Figurinhas
        </button>
        <button
          type="button"
          role="tab"
          [class.active]="adminTabIndex() === 2"
          [attr.aria-selected]="adminTabIndex() === 2"
          (click)="setAdminTab(2)"
        >
          Denúncias
        </button>
        <button
          type="button"
          role="tab"
          [class.active]="adminTabIndex() === 3"
          [attr.aria-selected]="adminTabIndex() === 3"
          (click)="setAdminTab(3)"
        >
          Usuários
        </button>
      </div>

      <mat-tab-group
        class="panel admin-tabs"
        animationDuration="0ms"
        [selectedIndex]="adminTabIndex()"
        (selectedIndexChange)="setAdminTab($event)"
      >
        <mat-tab label="Álbuns">
          <section class="admin-section">
            <form [formGroup]="albumForm" (ngSubmit)="saveAlbum()" class="form-grid">
              <h2>{{ editingAlbumId() ? 'Editar álbum' : 'Novo álbum' }}</h2>
              <mat-form-field>
                <mat-label>Nome</mat-label>
                <input matInput formControlName="name" maxlength="200" />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Descrição</mat-label>
                <textarea matInput rows="3" formControlName="description"></textarea>
              </mat-form-field>
              <mat-form-field>
                <mat-label>Ano</mat-label>
                <input matInput type="number" formControlName="year" />
              </mat-form-field>
              <div class="actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="albumForm.invalid || saving()">
                  Salvar álbum
                </button>
                <button mat-button type="button" (click)="resetAlbumForm()">Cancelar edição</button>
              </div>
            </form>

            <div class="list">
              <mat-card class="outlined-card" *ngFor="let album of albums()">
                <mat-card-content class="admin-row">
                  <div>
                    <span class="pill">{{ album.active ? 'Ativo' : 'Inativo' }}</span>
                    <h3>{{ album.name }}</h3>
                    <p class="muted">{{ album.year || 'Sem ano' }}</p>
                  </div>
                  <div class="actions">
                    <button mat-button type="button" (click)="editAlbum(album)">Editar</button>
                    <button mat-stroked-button type="button" (click)="setAlbumActive(album)">
                      {{ album.active ? 'Desativar' : 'Ativar' }}
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </section>
        </mat-tab>

        <mat-tab label="Figurinhas">
          <section class="admin-section">
            <mat-form-field class="full-width">
              <mat-label>Álbum</mat-label>
              <mat-select [value]="selectedAlbumId()" (valueChange)="selectAlbum($event)">
                <mat-option *ngFor="let album of albums()" [value]="album.id">{{ album.name }}</mat-option>
              </mat-select>
            </mat-form-field>

            <form [formGroup]="stickerForm" (ngSubmit)="saveSticker()" class="form-grid">
              <h2>{{ editingStickerId() ? 'Editar figurinha' : 'Nova figurinha' }}</h2>
              <mat-form-field>
                <mat-label>Código</mat-label>
                <input matInput formControlName="code" maxlength="20" />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Nome</mat-label>
                <input matInput formControlName="name" maxlength="200" />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Descrição</mat-label>
                <textarea matInput rows="3" formControlName="description"></textarea>
              </mat-form-field>
              <div class="actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="stickerForm.invalid || !selectedAlbumId() || saving()">
                  Salvar figurinha
                </button>
                <button mat-button type="button" (click)="resetStickerForm()">Cancelar edição</button>
              </div>
            </form>

            <div class="list">
              <mat-card class="outlined-card" *ngFor="let sticker of stickers()">
                <mat-card-content class="admin-row">
                  <div>
                    <span class="pill">{{ sticker.active ? 'Ativa' : 'Inativa' }}</span>
                    <h3>#{{ sticker.code }} — {{ sticker.name }}</h3>
                    <p class="muted">{{ sticker.description || 'Sem descrição' }}</p>
                  </div>
                  <div class="actions">
                    <button mat-button type="button" (click)="editSticker(sticker)">Editar</button>
                    <button mat-stroked-button type="button" (click)="setStickerActive(sticker)">
                      {{ sticker.active ? 'Desativar' : 'Ativar' }}
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </section>
        </mat-tab>

        <mat-tab label="Denúncias">
          <section class="admin-section">
            <mat-form-field>
              <mat-label>Status</mat-label>
              <mat-select [value]="reportStatus()" (valueChange)="reportStatus.set($event); loadReports()">
                <mat-option [value]="undefined">Todos</mat-option>
                <mat-option value="PENDING">Pendentes</mat-option>
                <mat-option value="REVIEWED">Revisadas</mat-option>
                <mat-option value="DISMISSED">Dispensadas</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="list">
              <mat-card class="outlined-card" *ngFor="let report of reports()">
                <mat-card-content>
                  <span class="pill">{{ reportStatusLabel(report.status) }}</span>
                  <h3>{{ reportReasonLabel(report.reason) }}</h3>
                  <p class="app-muted">{{ report.description || 'Sem descrição' }}</p>
                  <small>Denunciado: {{ report.reportedId }} · {{ report.createdAt | date: 'short' }}</small>
                </mat-card-content>
              </mat-card>
              <div class="empty" *ngIf="!reports().length">Nenhuma denúncia encontrada.</div>
            </div>
          </section>
        </mat-tab>

        <mat-tab label="Usuários">
          <section class="admin-section">
            <div class="list">
              <mat-card class="outlined-card" *ngFor="let user of users()">
                <mat-card-content>
                  <div class="user-row">
                    <div class="user-info">
                      <div class="user-badges">
                        <span class="pill">{{ user.role === 'ADMIN' ? 'Admin' : 'Usuário' }}</span>
                        <span class="pill" *ngIf="!user.emailVerified">E-mail não verificado</span>
                      </div>
                      <h3>{{ user.email }}</h3>
                      <small class="app-muted">
                        Cadastro: {{ user.createdAt | date: 'dd/MM/yyyy' }}
                        &nbsp;·&nbsp;
                        Último acesso: {{ user.lastActivityAt ? (user.lastActivityAt | date: 'dd/MM/yyyy HH:mm') : 'Nunca' }}
                        <ng-container *ngIf="user.lastIpAddress">
                          &nbsp;·&nbsp; IP: {{ user.lastIpAddress }}
                        </ng-container>
                      </small>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
              <div class="empty" *ngIf="!loadingUsers() && !users().length">Nenhum usuário encontrado.</div>
            </div>
          </section>
        </mat-tab>
      </mat-tab-group>
    </main>
  `,
  styles: [
    `
      .admin-section {
        display: grid;
        gap: 1rem;
        padding: 1rem 0;
      }

      .admin-section-switcher {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        display: grid;
        gap: 0.35rem;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        padding: 0.35rem;
      }

      .admin-section-switcher button {
        background: transparent;
        border: 0;
        border-radius: 6px;
        color: var(--muted);
        cursor: pointer;
        font-weight: 800;
        min-height: 42px;
        padding: 0 0.45rem;
      }

      .admin-section-switcher button.active {
        background: var(--brand-soft);
        color: var(--brand-strong);
      }

      :host ::ng-deep .admin-tabs .mat-mdc-tab-header {
        display: none;
      }

      .user-row {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .user-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-bottom: 0.25rem;
      }

      .user-info h3 {
        margin: 0;
      }

      .admin-row {
        align-items: center;
        display: grid;
        gap: 1rem;
      }

      @media (min-width: 800px) {
        .admin-row {
          grid-template-columns: 1fr auto;
        }
      }
    `
  ]
})
export class AdminComponent implements OnInit {
  readonly albums = signal<AlbumResponse[]>([]);
  readonly stickers = signal<StickerResponse[]>([]);
  readonly reports = signal<ReportResponse[]>([]);
  readonly users = signal<AdminUserResponse[]>([]);
  readonly reportStatus = signal<ReportStatus | undefined>(undefined);
  readonly adminTabIndex = signal(0);
  readonly selectedAlbumId = signal('');
  readonly editingAlbumId = signal<string | null>(null);
  readonly editingStickerId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly loadingUsers = signal(false);

  readonly albumForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    year: [new Date().getFullYear()]
  });

  readonly stickerForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(20)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['']
  });

  constructor(
    private readonly api: ApiService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadAlbums();
    this.loadReports();
  }

  setAdminTab(index: number): void {
    this.adminTabIndex.set(index);
    if (index === 3 && !this.users().length) {
      this.loadUsers();
    }
  }

  loadUsers(): void {
    this.loadingUsers.set(true);
    this.api.adminUsers().pipe(finalize(() => this.loadingUsers.set(false))).subscribe((page) => {
      this.users.set(page.content);
    });
  }

  loadAlbums(): void {
    this.api.adminAlbums(0, 100).subscribe((page) => {
      this.albums.set(page.content);
      const selectedStillExists = page.content.some((album) => album.id === this.selectedAlbumId());
      const first = page.content[0];
      if (!selectedStillExists && first) {
        this.selectAlbum(first.id);
      }
    });
  }

  selectAlbum(albumId: string): void {
    this.selectedAlbumId.set(albumId);
    this.api.adminStickers(albumId, 0, 500).subscribe((page) => this.stickers.set(page.content));
  }

  saveAlbum(): void {
    if (this.albumForm.invalid) {
      return;
    }
    this.saving.set(true);
    const value = this.albumForm.getRawValue();
    const payload = {
      name: value.name,
      description: value.description.trim() || null,
      year: value.year || null
    };
    const request = this.editingAlbumId()
      ? this.api.updateAlbum(this.editingAlbumId() as string, payload)
      : this.api.createAlbum(payload);
    request.pipe(finalize(() => this.saving.set(false))).subscribe(() => {
      this.resetAlbumForm();
      this.loadAlbums();
    });
  }

  editAlbum(album: AlbumResponse): void {
    this.editingAlbumId.set(album.id);
    this.albumForm.patchValue({
      name: album.name,
      description: album.description ?? '',
      year: album.year ?? new Date().getFullYear()
    });
  }

  resetAlbumForm(): void {
    this.editingAlbumId.set(null);
    this.albumForm.reset({ name: '', description: '', year: new Date().getFullYear() });
  }

  setAlbumActive(album: AlbumResponse): void {
    this.api.setAlbumActive(album.id, !album.active).subscribe(() => this.loadAlbums());
  }

  saveSticker(): void {
    if (this.stickerForm.invalid || !this.selectedAlbumId()) {
      return;
    }
    this.saving.set(true);
    const value = this.stickerForm.getRawValue();
    const payload = {
      code: value.code,
      name: value.name,
      description: value.description.trim() || null
    };
    const request = this.editingStickerId()
      ? this.api.updateSticker(this.editingStickerId() as string, payload)
      : this.api.createSticker(this.selectedAlbumId(), payload);
    request.pipe(finalize(() => this.saving.set(false))).subscribe(() => {
      this.resetStickerForm();
      this.selectAlbum(this.selectedAlbumId());
    });
  }

  editSticker(sticker: StickerResponse): void {
    this.editingStickerId.set(sticker.id);
    this.stickerForm.patchValue({
      code: sticker.code,
      name: sticker.name,
      description: sticker.description ?? ''
    });
  }

  resetStickerForm(): void {
    this.editingStickerId.set(null);
    this.stickerForm.reset({ code: '', name: '', description: '' });
  }

  setStickerActive(sticker: StickerResponse): void {
    this.api.setStickerActive(sticker.id, !sticker.active).subscribe(() => this.selectAlbum(this.selectedAlbumId()));
  }

  loadReports(): void {
    this.api.reports(this.reportStatus()).subscribe((page) => this.reports.set(page.content));
  }

  reportStatusLabel(status: ReportStatus): string {
    return {
      PENDING: 'Pendente',
      REVIEWED: 'Revisada',
      DISMISSED: 'Dispensada'
    }[status];
  }

  reportReasonLabel(reason: ReportReason): string {
    return {
      SPAM: 'Spam',
      INAPPROPRIATE_CONTENT: 'Conteúdo inadequado',
      HARASSMENT: 'Assédio',
      OTHER: 'Outro motivo'
    }[reason];
  }
}
