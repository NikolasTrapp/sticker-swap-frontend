import { NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AlbumResponse, HolderResponse, ReportReason, StickerResponse } from '../../core/api/api.types';
import { ApiService } from '../../core/api/api.service';

const REPORT_REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Conteúdo inadequado' },
  { value: 'HARASSMENT', label: 'Assédio' },
  { value: 'OTHER', label: 'Outro' }
];

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    RouterLink
  ],
  template: `
    <main class="page operational-page">
      <section class="app-page-header operation-header">
        <div>
          <span class="pill">Busca</span>
          <h1>Encontre quem tem a figurinha.</h1>
          <p class="app-muted">Busque por código ou nome e inicie uma conversa com o colecionador.</p>
        </div>
        <mat-form-field class="album-select">
          <mat-label>Álbum</mat-label>
          <mat-select [value]="selectedAlbumId()" (valueChange)="selectAlbum($event)">
            <mat-option *ngFor="let album of albums()" [value]="album.id">{{ album.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </section>

      <section class="panel search-panel" *ngIf="selectedAlbumId()">
        <mat-form-field class="search-field">
          <mat-label>Código ou nome da figurinha</mat-label>
          <input matInput autocomplete="off" [formControl]="stickerQueryControl" />
        </mat-form-field>

        <div class="sticker-results">
          <button
            class="sticker-option"
            type="button"
            *ngFor="let sticker of stickers()"
            [class.selected]="selectedStickerId() === sticker.id"
            (click)="selectSticker(sticker)"
          >
            <span>#{{ sticker.code }}</span>
            <strong>{{ sticker.name }}</strong>
          </button>
        </div>

        <div class="empty" *ngIf="!stickers().length">Nenhuma figurinha encontrada.</div>

        <mat-paginator
          [length]="stickerTotalElements()"
          [pageIndex]="stickerPageIndex()"
          [pageSize]="stickerPageSize()"
          [pageSizeOptions]="[10, 25, 50]"
          [showFirstLastButtons]="true"
          (page)="pageStickers($event)"
        />
      </section>

      <section #holdersPanel class="panel holders-panel" *ngIf="selectedStickerId()">
        <div class="section-title compact-title">
          <div>
            <h2>{{ selectedStickerTitle() }}</h2>
            <p class="muted">{{ holderTotalElements() }} colecionador(es)</p>
          </div>
        </div>

        <mat-card *ngFor="let holder of holders()" class="holder-card outlined-card">
          <mat-card-content class="holder-row">
            <div class="holder-main">
              <span class="pill" *ngIf="holder.isPotentialMatch">Match potencial</span>
              <h3>{{ holder.nickname || 'Colecionador' }}</h3>
              <p class="app-muted">
                {{ holder.city || 'Cidade não exibida' }} {{ holder.state || '' }} - {{ holder.quantity }} disponível(is)
              </p>
            </div>
            <div class="holder-actions">
              <button mat-flat-button color="primary" type="button" (click)="interest(holder)">Tenho interesse</button>
              <a mat-button [routerLink]="['/users', holder.userId, 'profile']">Perfil</a>
              <button mat-button type="button" (click)="report(holder.userId)">Denunciar</button>
              <button mat-button class="danger" type="button" (click)="block(holder.userId)">Bloquear</button>
            </div>
          </mat-card-content>
        </mat-card>

        <div class="empty" *ngIf="searched() && !holders().length">
          Nenhum usuário encontrado para esta figurinha.
        </div>

        <mat-paginator
          [length]="holderTotalElements()"
          [pageIndex]="holderPageIndex()"
          [pageSize]="holderPageSize()"
          [pageSizeOptions]="[10, 20, 50]"
          [showFirstLastButtons]="true"
          (page)="pageHolders($event)"
        />
      </section>
    </main>
  `,
  styles: [
    `
      .operation-header {
        display: grid;
        gap: 1rem;
      }

      .album-select,
      .search-field {
        width: 100%;
      }

      .search-panel {
        display: grid;
        gap: 0.75rem;
      }

      .sticker-results {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      }

      .sticker-option {
        align-items: start;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 8px;
        color: var(--ink);
        cursor: pointer;
        display: grid;
        gap: 0.25rem;
        min-height: 76px;
        padding: 0.75rem;
        text-align: left;
      }

      .sticker-option span {
        color: var(--brand-strong);
        font-weight: 900;
      }

      .sticker-option.selected {
        background: var(--brand-soft);
        border-color: var(--brand);
      }

      .compact-title {
        margin-bottom: 0.75rem;
      }

      .holders-panel {
        scroll-margin-top: 76px;
      }

      .holder-card {
        border-radius: 8px;
        margin-bottom: 0.65rem;
      }

      .holder-row {
        display: grid;
        gap: 1rem;
      }

      .holder-main {
        display: grid;
        gap: 0.35rem;
      }

      .holder-main h3,
      .holder-main p {
        margin: 0;
      }

      .holder-actions {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        justify-content: flex-start;
      }

      @media (min-width: 860px) {
        .operation-header {
          grid-template-columns: 1fr 320px;
        }

        .holder-row {
          align-items: center;
          grid-template-columns: minmax(0, 1fr) auto;
        }

        .holder-actions {
          justify-content: flex-end;
        }
      }
    `
  ]
})
export class SearchComponent implements OnInit {
  readonly albums = signal<AlbumResponse[]>([]);
  readonly stickers = signal<StickerResponse[]>([]);
  readonly holders = signal<HolderResponse[]>([]);
  readonly searched = signal(false);
  readonly selectedAlbumId = signal('');
  readonly selectedStickerId = signal('');
  readonly selectedStickerLabel = signal('');
  readonly stickerTotalElements = signal(0);
  readonly stickerPageIndex = signal(0);
  readonly stickerPageSize = signal(10);
  readonly holderTotalElements = signal(0);
  readonly holderPageIndex = signal(0);
  readonly holderPageSize = signal(20);
  readonly stickerQueryControl = new FormControl('', { nonNullable: true });

  @ViewChild('holdersPanel') private holdersPanel?: ElementRef<HTMLElement>;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly api: ApiService,
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const initialAlbumId = this.route.snapshot.queryParamMap.get('albumId');
    const initialStickerId = this.route.snapshot.queryParamMap.get('stickerId');
    const initialQuery = this.route.snapshot.queryParamMap.get('q') ?? '';
    this.stickerQueryControl.setValue(initialQuery, { emitEvent: false });

    this.stickerQueryControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.selectedStickerId.set('');
        this.selectedStickerLabel.set('');
        this.holders.set([]);
        this.searched.set(false);
        this.loadStickers(0);
      });

    this.api.albums(0, 100).subscribe((page) => {
      this.albums.set(page.content);
      const selected = page.content.find((album) => album.id === initialAlbumId) ?? page.content[0];
      if (selected) {
        this.selectAlbum(selected.id, initialStickerId ?? undefined);
      }
    });
  }

  selectAlbum(albumId: string, initialStickerId?: string): void {
    this.selectedAlbumId.set(albumId);
    this.selectedStickerId.set(initialStickerId ?? '');
    this.selectedStickerLabel.set('');
    this.holders.set([]);
    this.searched.set(false);
    this.loadStickers(0, Boolean(initialStickerId));
    if (initialStickerId) {
      this.loadHolders(0);
    }
  }

  selectSticker(sticker: StickerResponse): void {
    this.selectedStickerId.set(sticker.id);
    this.selectedStickerLabel.set(`#${sticker.code} - ${sticker.name}`);
    this.loadHolders(0);
  }

  selectedStickerTitle(): string {
    if (this.selectedStickerLabel()) {
      return this.selectedStickerLabel();
    }
    const sticker = this.stickers().find((item) => item.id === this.selectedStickerId());
    return sticker ? `#${sticker.code} - ${sticker.name}` : 'Figurinha selecionada';
  }

  pageStickers(event: PageEvent): void {
    this.stickerPageSize.set(event.pageSize);
    this.loadStickers(event.pageIndex, true);
  }

  pageHolders(event: PageEvent): void {
    this.holderPageSize.set(event.pageSize);
    this.loadHolders(event.pageIndex);
  }

  interest(holder: HolderResponse): void {
    const stickerId = this.selectedStickerId();
    if (!stickerId) {
      return;
    }
    this.api
      .expressInterest(stickerId, holder.userId)
      .subscribe((conversation) => this.router.navigate(['/chats', conversation.conversationId]));
  }

  block(userId: string): void {
    this.api.blockUser(userId).subscribe(() => this.loadHolders(this.holderPageIndex()));
  }

  report(userId: string): void {
    const dialogRef = this.dialog.open(ReportUserDialogComponent, {
      data: { userId },
      width: 'min(92vw, 480px)'
    });
    dialogRef.afterClosed().subscribe((result?: { reason: ReportReason; description: string | null }) => {
      if (result) {
        this.api.reportUser(userId, result.reason, result.description).subscribe();
      }
    });
  }

  private loadStickers(pageIndex: number, keepSelection = false): void {
    const albumId = this.selectedAlbumId();
    if (!albumId) {
      return;
    }
    this.api
      .stickers(albumId, {
        q: this.stickerQueryControl.value,
        page: pageIndex,
        size: this.stickerPageSize()
      })
      .subscribe((page) => {
        this.stickers.set(page.content);
        this.stickerTotalElements.set(page.totalElements);
        this.stickerPageIndex.set(page.number);
        this.stickerPageSize.set(page.size);

        const selected = page.content.find((item) => item.id === this.selectedStickerId());
        if (selected) {
          this.selectedStickerLabel.set(`#${selected.code} - ${selected.name}`);
        } else if (!keepSelection) {
          this.selectedStickerId.set('');
          this.selectedStickerLabel.set('');
        }
      });
  }

  private loadHolders(pageIndex: number): void {
    const albumId = this.selectedAlbumId();
    const stickerId = this.selectedStickerId();
    if (!albumId || !stickerId) {
      return;
    }
    this.api.holders(albumId, stickerId, pageIndex, this.holderPageSize()).subscribe((page) => {
      this.searched.set(true);
      this.holders.set(page.content);
      this.holderTotalElements.set(page.totalElements);
      this.holderPageIndex.set(page.number);
      this.holderPageSize.set(page.size);
      this.scrollToHolders();
    });
  }

  private scrollToHolders(): void {
    setTimeout(() => {
      this.holdersPanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

@Component({
  selector: 'app-report-user-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, NgFor, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>Denunciar usuário</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field>
          <mat-label>Motivo</mat-label>
          <mat-select formControlName="reason">
            <mat-option *ngFor="let reason of reasons" [value]="reason.value">{{ reason.label }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Descrição opcional</mat-label>
          <textarea matInput rows="4" maxlength="1000" formControlName="description"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" type="button" [disabled]="form.invalid" (click)="close()">Enviar</button>
    </mat-dialog-actions>
  `
})
export class ReportUserDialogComponent {
  readonly reasons = REPORT_REASONS;
  readonly data = inject<{ userId: string }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ReportUserDialogComponent>);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    reason: ['OTHER' as ReportReason, [Validators.required]],
    description: ['']
  });

  close(): void {
    const value = this.form.getRawValue();
    this.dialogRef.close({
      reason: value.reason,
      description: value.description.trim() || null
    });
  }
}
