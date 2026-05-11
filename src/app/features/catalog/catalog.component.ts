import { NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AlbumResponse, StickerResponse } from '../../core/api/api.types';
import { ApiService } from '../../core/api/api.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [MatButtonModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatPaginatorModule, NgFor, NgIf, ReactiveFormsModule],
  template: `
    <main class="page operational-page">
      <section class="app-page-header operation-header">
        <div>
          <span class="pill">Catálogo</span>
          <h1>Consulte o catálogo</h1>
          <p class="app-muted">Busque por código ou nome antes de atualizar sua coleção.</p>
        </div>
      </section>

      <div class="album-chips">
        <mat-chip-listbox>
          <mat-chip-option
            *ngFor="let album of albums()"
            [selected]="selectedAlbum()?.id === album.id"
            (click)="selectAlbum(album)"
          >
            {{ album.name }}<span class="chip-year" *ngIf="album.year">&nbsp;{{ album.year }}</span>
          </mat-chip-option>
        </mat-chip-listbox>
      </div>

      <section class="panel sticker-catalog">
        <div class="section-title compact-title">
          <div>
            <h2>{{ selectedAlbum()?.name || 'Selecione um álbum' }}</h2>
            <p class="app-muted">{{ totalElements() }} figurinha(s)</p>
          </div>
        </div>

        <mat-form-field class="full-width">
          <mat-label>Código ou nome</mat-label>
          <input matInput autocomplete="off" [formControl]="queryControl" />
        </mat-form-field>

        <div class="catalog-row header-row">
          <span>Código</span>
          <span>Nome</span>
        </div>
        <div class="catalog-row" *ngFor="let sticker of stickers()">
          <span class="code-pill">#{{ sticker.code }}</span>
          <strong>{{ sticker.name }}</strong>
        </div>

        <div class="empty" *ngIf="selectedAlbum() && !stickers().length">Nenhuma figurinha encontrada.</div>

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
      .album-chips {
        overflow-x: auto;
        padding-bottom: 0.25rem;
      }

      .chip-year {
        color: var(--muted);
        font-weight: 400;
      }

      .sticker-catalog {
        overflow: visible;
      }

      .catalog-row {
        align-items: center;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        display: grid;
        gap: 0.55rem 0.65rem;
        grid-template-columns: auto minmax(0, 1fr);
        margin-top: 0.45rem;
        padding: 0.6rem 0.65rem;
      }

      .header-row {
        display: none;
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 800;
      }

      .code-pill {
        background: var(--brand-soft);
        border-radius: 8px;
        color: var(--brand-strong);
        display: inline-flex;
        font-weight: 900;
        justify-content: center;
        justify-self: start;
        padding: 0.42rem 0.55rem;
      }

      .catalog-row strong {
        line-height: 1.18;
        min-width: 0;
      }

      @media (min-width: 720px) {
        .sticker-catalog {
          overflow-x: auto;
        }

        .catalog-row {
          align-items: center;
          background: transparent;
          border: 0;
          border-radius: 0;
          border-top: 1px solid var(--line);
          grid-template-columns: 90px minmax(180px, 1fr);
          min-width: 360px;
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
export class CatalogComponent implements OnInit {
  readonly albums = signal<AlbumResponse[]>([]);
  readonly selectedAlbum = signal<AlbumResponse | null>(null);
  readonly stickers = signal<StickerResponse[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(25);
  readonly queryControl = new FormControl('', { nonNullable: true });

  private readonly destroyRef = inject(DestroyRef);

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.queryControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadStickers(0));

    this.api.albums(0, 100).subscribe((page) => {
      this.albums.set(page.content);
      const first = page.content[0];
      if (first) {
        this.selectAlbum(first);
      }
    });
  }

  selectAlbum(album: AlbumResponse): void {
    this.selectedAlbum.set(album);
    this.stickers.set([]);
    this.loadStickers(0);
  }

  page(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.loadStickers(event.pageIndex);
  }

  private loadStickers(pageIndex: number): void {
    const album = this.selectedAlbum();
    if (!album) {
      return;
    }
    this.api
      .stickers(album.id, {
        q: this.queryControl.value,
        page: pageIndex,
        size: this.pageSize()
      })
      .subscribe((page) => {
        this.stickers.set(page.content);
        this.totalElements.set(page.totalElements);
        this.pageIndex.set(page.number);
        this.pageSize.set(page.size);
      });
  }
}
