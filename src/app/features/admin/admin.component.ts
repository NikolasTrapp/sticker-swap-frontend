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
import { AlbumResponse, ReportResponse, ReportStatus, StickerResponse } from '../../core/api/api.types';
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
      <section class="hero-card">
        <span class="pill">Admin</span>
        <h1>Operação do catálogo e moderação.</h1>
        <p class="muted">APIs protegidas por role ADMIN no backend.</p>
      </section>

      <mat-tab-group class="panel">
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
              <mat-card *ngFor="let album of albums()">
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
                <mat-label>Número</mat-label>
                <input matInput formControlName="number" maxlength="20" />
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
              <mat-card *ngFor="let sticker of stickers()">
                <mat-card-content class="admin-row">
                  <div>
                    <span class="pill">{{ sticker.active ? 'Ativa' : 'Inativa' }}</span>
                    <h3>#{{ sticker.number }} — {{ sticker.name }}</h3>
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
              <mat-card *ngFor="let report of reports()">
                <mat-card-content>
                  <span class="pill">{{ report.status }}</span>
                  <h3>{{ report.reason }}</h3>
                  <p class="muted">{{ report.description || 'Sem descrição' }}</p>
                  <small>Denunciado: {{ report.reportedId }} · {{ report.createdAt | date: 'short' }}</small>
                </mat-card-content>
              </mat-card>
              <div class="empty" *ngIf="!reports().length">Nenhuma denúncia encontrada.</div>
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
  readonly reportStatus = signal<ReportStatus | undefined>(undefined);
  readonly selectedAlbumId = signal('');
  readonly editingAlbumId = signal<string | null>(null);
  readonly editingStickerId = signal<string | null>(null);
  readonly saving = signal(false);

  readonly albumForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    year: [new Date().getFullYear()]
  });

  readonly stickerForm = this.fb.nonNullable.group({
    number: ['', [Validators.required, Validators.maxLength(20)]],
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
      number: value.number,
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
      number: sticker.number,
      name: sticker.name,
      description: sticker.description ?? ''
    });
  }

  resetStickerForm(): void {
    this.editingStickerId.set(null);
    this.stickerForm.reset({ number: '', name: '', description: '' });
  }

  setStickerActive(sticker: StickerResponse): void {
    this.api.setStickerActive(sticker.id, !sticker.active).subscribe(() => this.selectAlbum(this.selectedAlbumId()));
  }

  loadReports(): void {
    this.api.reports(this.reportStatus()).subscribe((page) => this.reports.set(page.content));
  }
}
