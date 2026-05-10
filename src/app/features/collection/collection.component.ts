import { NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { EMPTY, finalize, forkJoin, switchMap } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AlbumResponse, CollectionFilter, CollectionStickerResponse } from '../../core/api/api.types';
import { ApiService } from '../../core/api/api.service';

interface FilterOption {
  value: CollectionFilter;
  label: string;
}

@Component({
  selector: 'app-collection',
  standalone: true,
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    NgFor,
    NgIf,
    ReactiveFormsModule
  ],
  template: `
    <main class="page operational-page">
      <section class="app-page-header operation-header">
        <div>
          <span class="pill">Minha coleção</span>
          <h1>Atualize suas figurinhas</h1>
          <p class="app-muted">Informe repetidas, marque faltantes e busque quem pode trocar com você.</p>
        </div>
        <mat-form-field class="album-select">
          <mat-label>Álbum</mat-label>
          <mat-select [value]="selectedAlbumId()" (valueChange)="selectAlbum($event)">
            <mat-option *ngFor="let album of albums()" [value]="album.id">{{ album.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </section>

      <section class="panel quick-entry" *ngIf="selectedAlbumId()">
        <mat-form-field>
          <mat-label>Código da figurinha</mat-label>
          <input matInput autocomplete="off" [formControl]="quickCodeControl" />
        </mat-form-field>
        <mat-form-field class="quantity-field">
          <mat-label>Qtd.</mat-label>
          <input matInput type="number" min="0" [formControl]="quickQuantityControl" />
        </mat-form-field>
        <mat-checkbox [formControl]="quickWantedControl">Faltante</mat-checkbox>
        <button mat-flat-button color="primary" type="button" [disabled]="savingQuick()" (click)="saveQuickEntry()">
          {{ savingQuick() ? 'Registrando...' : 'Registrar' }}
        </button>
      </section>

      <section class="panel collection-toolbar" *ngIf="selectedAlbumId()">
        <mat-form-field class="search-field">
          <mat-label>Código ou nome</mat-label>
          <input matInput autocomplete="off" [formControl]="queryControl" />
        </mat-form-field>
        <mat-button-toggle-group
          [value]="filter()"
          (change)="setFilter($event.value)"
          aria-label="Filtro da coleção"
        >
          <mat-button-toggle *ngFor="let option of filterOptions" [value]="option.value">
            {{ option.label }}
          </mat-button-toggle>
        </mat-button-toggle-group>
      </section>

      <section class="panel collection-table" *ngIf="selectedAlbumId()">
        <div class="table-summary">
          <strong>{{ totalElements() }}</strong>
          <span class="muted">resultado(s)</span>
        </div>

        <div class="collection-row header-row">
          <span>Código</span>
          <span>Figurinha</span>
          <span>Repetidas</span>
          <span>Faltante</span>
          <span></span>
        </div>

        <div class="collection-row" *ngFor="let item of collection()">
          <button class="code-cell" type="button" (click)="findHolders(item)">#{{ item.code }}</button>
          <div class="sticker-cell">
            <strong>{{ item.name }}</strong>
            <small class="danger" *ngIf="item.warning">{{ item.warning }}</small>
          </div>
          <div class="stepper">
            <button mat-button type="button" (click)="setQuantity(item, item.repeatedQuantity - 1)">-</button>
            <input
              type="number"
              min="0"
              [value]="item.repeatedQuantity"
              (change)="setQuantity(item, $any($event.target).value)"
              [attr.aria-label]="'Repetidas da figurinha ' + item.code"
            />
            <button mat-button type="button" (click)="setQuantity(item, item.repeatedQuantity + 1)">+</button>
          </div>
          <mat-checkbox [checked]="item.wanted" (change)="toggleWanted(item, $event.checked)">
            Quero
          </mat-checkbox>
          <button mat-stroked-button type="button" (click)="findHolders(item)">Buscar</button>
        </div>

        <div class="empty" *ngIf="!loading() && !collection().length">Nenhuma figurinha encontrada.</div>

        <mat-paginator
          [length]="totalElements()"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[10, 25, 50]"
          [showFirstLastButtons]="true"
          (page)="page($event)"
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

      .quick-entry,
      .collection-toolbar {
        align-items: center;
        display: grid;
        gap: 0.75rem;
      }

      .collection-toolbar mat-button-toggle-group {
        max-width: 100%;
        overflow-x: auto;
      }

      .quantity-field {
        max-width: 120px;
      }

      .table-summary {
        align-items: baseline;
        display: flex;
        gap: 0.35rem;
        margin-bottom: 0.5rem;
      }

      .collection-table {
        overflow: visible;
      }

      .collection-row {
        align-items: start;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        display: grid;
        gap: 0.75rem;
        grid-template-columns: 1fr;
        margin-top: 0.65rem;
        padding: 0.8rem;
      }

      .header-row {
        display: none;
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 800;
      }

      .code-cell {
        background: var(--brand-soft);
        border: 0;
        border-radius: 8px;
        color: var(--brand-strong);
        cursor: pointer;
        font-weight: 900;
        height: 36px;
        justify-self: start;
        padding: 0 0.75rem;
      }

      .sticker-cell {
        display: grid;
        gap: 0.25rem;
      }

      .stepper {
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 8px;
        display: grid;
        grid-template-columns: 40px 1fr 40px;
        overflow: hidden;
        width: min(100%, 168px);
      }

      .stepper button {
        min-width: 40px;
      }

      .stepper input {
        border: 0;
        border-left: 1px solid var(--line);
        border-right: 1px solid var(--line);
        height: 40px;
        text-align: center;
        width: 100%;
      }

      @media (min-width: 860px) {
        .operation-header {
          grid-template-columns: 1fr 320px;
        }

        .quick-entry {
          grid-template-columns: minmax(160px, 1fr) 120px auto auto;
        }

        .collection-toolbar {
          grid-template-columns: minmax(260px, 1fr) auto;
        }

        .collection-table {
          overflow-x: auto;
        }

        .collection-row {
          align-items: center;
          background: transparent;
          border: 0;
          border-radius: 0;
          border-top: 1px solid var(--line);
          grid-template-columns: 82px minmax(180px, 1fr) 150px 118px 92px;
          min-width: 720px;
          padding: 0.65rem 0;
        }

        .header-row {
          border-top: 0;
          display: grid;
          margin-top: 0;
          padding-top: 0;
        }
      }
    `
  ]
})
export class CollectionComponent implements OnInit {
  readonly albums = signal<AlbumResponse[]>([]);
  readonly selectedAlbumId = signal('');
  readonly collection = signal<CollectionStickerResponse[]>([]);
  readonly filter = signal<CollectionFilter>('ALL');
  readonly loading = signal(false);
  readonly savingQuick = signal(false);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(25);
  readonly filterOptions: FilterOption[] = [
    { value: 'ALL', label: 'Todas' },
    { value: 'REPEATED', label: 'Repetidas' },
    { value: 'WANTED', label: 'Faltantes' },
    { value: 'CONFLICT', label: 'Conflitos' }
  ];

  readonly queryControl = new FormControl('', { nonNullable: true });
  readonly quickCodeControl = new FormControl('', { nonNullable: true });
  readonly quickQuantityControl = new FormControl(1, { nonNullable: true });
  readonly quickWantedControl = new FormControl(false, { nonNullable: true });

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.queryControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadCollection(0));

    this.api.albums(0, 100).subscribe((page) => {
      this.albums.set(page.content);
      const first = page.content[0];
      if (first) {
        this.selectAlbum(first.id);
      }
    });
  }

  selectAlbum(albumId: string): void {
    this.selectedAlbumId.set(albumId);
    this.collection.set([]);
    this.loadCollection(0);
  }

  setFilter(filter: CollectionFilter): void {
    this.filter.set(filter);
    this.loadCollection(0);
  }

  page(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.loadCollection(event.pageIndex);
  }

  setQuantity(item: CollectionStickerResponse, rawValue: string | number): void {
    const quantity = Math.max(0, Number(rawValue || 0));
    this.api.setRepeated(item.stickerId, quantity).subscribe((response) => {
      if ((this.filter() === 'REPEATED' || this.filter() === 'CONFLICT') && quantity === 0) {
        this.loadCollection(this.pageIndex());
        return;
      }
      this.patchItem(item.stickerId, {
        repeatedQuantity: response.quantity,
        warning: response.quantity > 0 && item.wanted ? response.warning : null
      });
    });
  }

  toggleWanted(item: CollectionStickerResponse, checked: boolean): void {
    if (checked) {
      this.api.setWanted(item.stickerId).subscribe((response) => {
        if (this.filter() === 'CONFLICT') {
          this.loadCollection(this.pageIndex());
          return;
        }
        this.patchItem(item.stickerId, {
          wanted: true,
          warning: item.repeatedQuantity > 0 ? response.warning : null
        });
      });
      return;
    }

    this.api.deleteWanted(item.stickerId).subscribe(() => {
      if (this.filter() === 'WANTED' || this.filter() === 'CONFLICT') {
        this.loadCollection(this.pageIndex());
        return;
      }
      this.patchItem(item.stickerId, {
        wanted: false,
        warning: null
      });
    });
  }

  saveQuickEntry(): void {
    const albumId = this.selectedAlbumId();
    const code = this.quickCodeControl.value.trim();
    const quantity = Math.max(0, Number(this.quickQuantityControl.value || 0));
    const wanted = this.quickWantedControl.value;

    if (!albumId || !code || (quantity === 0 && !wanted)) {
      this.snackBar.open('Informe código, quantidade ou faltante.', 'Fechar', { duration: 3500 });
      return;
    }

    this.savingQuick.set(true);
    this.api
      .stickers(albumId, { q: code, page: 0, size: 10 })
      .pipe(
        switchMap((page) => {
          const sticker = page.content.find((item) => item.code.toLowerCase() === code.toLowerCase());
          if (!sticker) {
            this.snackBar.open('Figurinha não encontrada neste álbum.', 'Fechar', { duration: 3500 });
            return EMPTY;
          }
          const requests = [];
          if (quantity > 0) {
            requests.push(this.api.setRepeated(sticker.id, quantity));
          }
          if (wanted) {
            requests.push(this.api.setWanted(sticker.id));
          }
          return forkJoin(requests);
        }),
        finalize(() => this.savingQuick.set(false))
      )
      .subscribe(() => {
        this.quickCodeControl.setValue('');
        this.quickQuantityControl.setValue(1);
        this.quickWantedControl.setValue(false);
        this.loadCollection(0);
      });
  }

  findHolders(item: CollectionStickerResponse): void {
    void this.router.navigate(['/search'], {
      queryParams: {
        albumId: this.selectedAlbumId(),
        stickerId: item.stickerId,
        q: item.code
      }
    });
  }

  private loadCollection(pageIndex: number): void {
    const albumId = this.selectedAlbumId();
    if (!albumId) {
      return;
    }

    this.loading.set(true);
    this.api
      .collection(albumId, {
        q: this.queryControl.value,
        filter: this.filter(),
        page: pageIndex,
        size: this.pageSize()
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((page) => {
        this.collection.set(page.content);
        this.totalElements.set(page.totalElements);
        this.pageIndex.set(page.number);
        this.pageSize.set(page.size);
      });
  }

  private patchItem(stickerId: string, patch: Partial<CollectionStickerResponse>): void {
    this.collection.update((items) =>
      items.map((item) => (item.stickerId === stickerId ? { ...item, ...patch } : item))
    );
  }
}
