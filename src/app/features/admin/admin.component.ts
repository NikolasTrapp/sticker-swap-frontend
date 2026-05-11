import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { AdminUserResponse, AlbumResponse, ReportReason, ReportResponse, ReportStatus, StickerResponse } from '../../core/api/api.types';
import { ApiService } from '../../core/api/api.service';
import { AuthFacade } from '../../core/auth/auth.facade';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTabsModule,
    MatTableModule,
    MatTooltipModule,
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
            <form class="user-search" [formGroup]="userSearchForm" (ngSubmit)="searchUsers()">
              <mat-form-field>
                <mat-label>Buscar por e-mail</mat-label>
                <mat-icon matPrefix>search</mat-icon>
                <input matInput formControlName="q" autocomplete="off" />
                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  aria-label="Limpar busca"
                  matTooltip="Limpar busca"
                  *ngIf="userSearchForm.controls.q.value"
                  (click)="clearUserSearch()"
                >
                  <mat-icon>close</mat-icon>
                </button>
              </mat-form-field>
              <button mat-flat-button color="primary" type="submit" [disabled]="loadingUsers()">
                Buscar
              </button>
            </form>

            <div class="users-table-wrap">
              <table mat-table [dataSource]="users()" class="users-table">
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>E-mail</th>
                  <td mat-cell *matCellDef="let user">
                    <div class="user-email">
                      <strong>{{ user.email }}</strong>
                      <small *ngIf="user.id === auth.profile()?.sub">Você</small>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef>Perfil</th>
                  <td mat-cell *matCellDef="let user">
                    <span class="pill">{{ user.role === 'ADMIN' ? 'Admin' : 'Usuário' }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let user">
                    <span class="pill" [class.blocked]="user.status === 'INACTIVE'">
                      {{ user.status === 'ACTIVE' ? 'Ativo' : 'Bloqueado' }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="emailVerified">
                  <th mat-header-cell *matHeaderCellDef>Verificação</th>
                  <td mat-cell *matCellDef="let user">
                    {{ user.emailVerified ? 'Verificado' : 'Pendente' }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="createdAt">
                  <th mat-header-cell *matHeaderCellDef>Cadastro</th>
                  <td mat-cell *matCellDef="let user">{{ user.createdAt | date: 'dd/MM/yyyy' }}</td>
                </ng-container>

                <ng-container matColumnDef="lastActivityAt">
                  <th mat-header-cell *matHeaderCellDef>Último acesso</th>
                  <td mat-cell *matCellDef="let user">
                    {{ user.lastActivityAt ? (user.lastActivityAt | date: 'dd/MM/yyyy HH:mm') : 'Nunca' }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="lastIpAddress">
                  <th mat-header-cell *matHeaderCellDef>IP</th>
                  <td mat-cell *matCellDef="let user">{{ user.lastIpAddress || '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Ações</th>
                  <td mat-cell *matCellDef="let user">
                    <button
                      mat-icon-button
                      color="warn"
                      type="button"
                      *ngIf="user.status === 'ACTIVE'"
                      [disabled]="user.id === auth.profile()?.sub || updatingUserId() === user.id"
                      aria-label="Bloquear usuário"
                      matTooltip="Bloquear usuário"
                      (click)="setUserBlocked(user, true)"
                    >
                      <mat-icon>block</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      type="button"
                      *ngIf="user.status === 'INACTIVE'"
                      [disabled]="updatingUserId() === user.id"
                      aria-label="Desbloquear usuário"
                      matTooltip="Desbloquear usuário"
                      (click)="setUserBlocked(user, false)"
                    >
                      <mat-icon>lock_open</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="userDisplayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: userDisplayedColumns"></tr>
                <tr class="mat-row" *matNoDataRow>
                  <td class="mat-cell empty-cell" [attr.colspan]="userDisplayedColumns.length">
                    {{ loadingUsers() ? 'Carregando usuários...' : 'Nenhum usuário encontrado.' }}
                  </td>
                </tr>
              </table>
            </div>

            <mat-paginator
              [length]="usersTotal()"
              [pageIndex]="usersPageIndex()"
              [pageSize]="usersPageSize()"
              [pageSizeOptions]="[10, 20, 50]"
              [disabled]="loadingUsers()"
              showFirstLastButtons
              (page)="onUsersPage($event)"
            />
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

      .user-search {
        align-items: start;
        display: grid;
        gap: 0.75rem;
      }

      .user-search mat-form-field {
        min-width: 0;
      }

      .users-table-wrap {
        border: 1px solid var(--line);
        border-radius: var(--radius);
        overflow-x: auto;
      }

      .users-table {
        min-width: 980px;
        width: 100%;
      }

      .users-table th {
        color: var(--muted);
        font-weight: 900;
        white-space: nowrap;
      }

      .users-table td {
        vertical-align: middle;
      }

      .user-email {
        display: grid;
        gap: 0.1rem;
        min-width: 0;
      }

      .user-email strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .user-email small {
        color: var(--muted);
        font-weight: 800;
      }

      .pill.blocked {
        background: rgba(211, 47, 47, 0.12);
        color: #b3261e;
      }

      .empty-cell {
        color: var(--muted);
        padding: 1rem;
        text-align: center;
      }

      .admin-row {
        align-items: center;
        display: grid;
        gap: 1rem;
      }

      @media (min-width: 800px) {
        .user-search {
          grid-template-columns: minmax(260px, 420px) auto;
        }

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
  readonly usersTotal = signal(0);
  readonly usersPageIndex = signal(0);
  readonly usersPageSize = signal(20);
  readonly reportStatus = signal<ReportStatus | undefined>(undefined);
  readonly adminTabIndex = signal(0);
  readonly selectedAlbumId = signal('');
  readonly editingAlbumId = signal<string | null>(null);
  readonly editingStickerId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly loadingUsers = signal(false);
  readonly usersLoaded = signal(false);
  readonly updatingUserId = signal<string | null>(null);
  readonly userDisplayedColumns = [
    'email',
    'role',
    'status',
    'emailVerified',
    'createdAt',
    'lastActivityAt',
    'lastIpAddress',
    'actions'
  ];

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

  readonly userSearchForm = this.fb.nonNullable.group({
    q: ['']
  });

  constructor(
    private readonly api: ApiService,
    private readonly fb: FormBuilder,
    readonly auth: AuthFacade
  ) {}

  ngOnInit(): void {
    this.loadAlbums();
    this.loadReports();
  }

  setAdminTab(index: number): void {
    this.adminTabIndex.set(index);
    if (index === 3 && !this.usersLoaded()) {
      this.loadUsers();
    }
  }

  loadUsers(page = this.usersPageIndex(), size = this.usersPageSize()): void {
    this.loadingUsers.set(true);
    this.usersPageIndex.set(page);
    this.usersPageSize.set(size);
    this.api.adminUsers(page, size, this.userSearchQuery()).pipe(finalize(() => this.loadingUsers.set(false))).subscribe((result) => {
      this.users.set(result.content);
      this.usersTotal.set(result.totalElements);
      this.usersLoaded.set(true);
    });
  }

  searchUsers(): void {
    this.loadUsers(0, this.usersPageSize());
  }

  clearUserSearch(): void {
    this.userSearchForm.reset({ q: '' });
    this.loadUsers(0, this.usersPageSize());
  }

  onUsersPage(event: PageEvent): void {
    this.loadUsers(event.pageIndex, event.pageSize);
  }

  setUserBlocked(user: AdminUserResponse, blocked: boolean): void {
    this.updatingUserId.set(user.id);
    const request = blocked ? this.api.adminBlockUser(user.id) : this.api.adminUnblockUser(user.id);
    request.pipe(finalize(() => this.updatingUserId.set(null))).subscribe((updated) => {
      this.users.update((users) => users.map((item) => (item.id === updated.id ? updated : item)));
    });
  }

  private userSearchQuery(): string | null {
    const query = this.userSearchForm.controls.q.value.trim();
    return query || null;
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
