import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AlbumResponse, StickerResponse } from '../../core/api/api.types';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, NgFor, NgIf],
  template: `
    <main class="page">
      <section class="hero-card">
        <span class="pill">Catálogo</span>
        <h1>Álbuns e figurinhas ativos.</h1>
        <p class="muted">Usuários comuns visualizam apenas itens ativos expostos pela API.</p>
      </section>

      <section class="grid two">
        <div class="panel list">
          <div class="section-title">
            <h2>Álbuns</h2>
          </div>
          <button
            mat-stroked-button
            *ngFor="let album of albums()"
            type="button"
            [color]="selectedAlbum()?.id === album.id ? 'primary' : undefined"
            (click)="selectAlbum(album)"
          >
            {{ album.name }} <span class="muted">{{ album.year || '' }}</span>
          </button>
        </div>

        <div class="panel list">
          <div class="section-title">
            <div>
              <h2>{{ selectedAlbum()?.name || 'Selecione um álbum' }}</h2>
              <p class="muted">{{ stickers().length }} figurinhas carregadas</p>
            </div>
          </div>
          <mat-card *ngFor="let sticker of stickers()">
            <mat-card-content>
              <span class="pill">#{{ sticker.number }}</span>
              <h3>{{ sticker.name }}</h3>
              <p class="muted" *ngIf="sticker.description">{{ sticker.description }}</p>
            </mat-card-content>
          </mat-card>
          <div class="empty" *ngIf="selectedAlbum() && !stickers().length">Nenhuma figurinha ativa neste álbum.</div>
        </div>
      </section>
    </main>
  `
})
export class CatalogComponent implements OnInit {
  readonly albums = signal<AlbumResponse[]>([]);
  readonly selectedAlbum = signal<AlbumResponse | null>(null);
  readonly stickers = signal<StickerResponse[]>([]);

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.albums().subscribe((page) => {
      this.albums.set(page.content);
      const first = page.content[0];
      if (first) {
        this.selectAlbum(first);
      }
    });
  }

  selectAlbum(album: AlbumResponse): void {
    this.selectedAlbum.set(album);
    this.api.stickers(album.id).subscribe((page) => this.stickers.set(page.content));
  }
}
