import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AlbumResponse, RepeatedStickerResponse, StickerResponse, WantedStickerResponse } from '../../core/api/api.types';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-collection',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule, NgFor, NgIf],
  template: `
    <main class="page">
      <section class="hero-card">
        <span class="pill">Minha coleção</span>
        <h1>Atualize repetidas e desejadas manualmente.</h1>
        <p class="muted">Quantidade zero remove a figurinha dos resultados de busca.</p>
      </section>

      <section class="panel">
        <mat-form-field class="full-width">
          <mat-label>Álbum</mat-label>
          <mat-select [value]="selectedAlbumId()" (valueChange)="selectAlbum($event)">
            <mat-option *ngFor="let album of albums()" [value]="album.id">{{ album.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </section>

      <section class="list" *ngIf="selectedAlbumId()">
        <mat-card *ngFor="let sticker of stickers()">
          <mat-card-content class="sticker-row">
            <div>
              <span class="pill">#{{ sticker.number }}</span>
              <h3>{{ sticker.name }}</h3>
              <p class="danger" *ngIf="warningFor(sticker.id)">{{ warningFor(sticker.id) }}</p>
            </div>
            <div class="collection-actions">
              <mat-form-field>
                <mat-label>Repetidas</mat-label>
                <input
                  matInput
                  type="number"
                  min="0"
                  [value]="quantityFor(sticker.id)"
                  (change)="setQuantity(sticker.id, $any($event.target).value)"
                />
              </mat-form-field>
              <mat-checkbox [checked]="wantedFor(sticker.id)" (change)="toggleWanted(sticker.id, $event.checked)">
                Quero
              </mat-checkbox>
            </div>
          </mat-card-content>
        </mat-card>
        <div class="empty" *ngIf="!stickers().length">Selecione um álbum com figurinhas ativas.</div>
      </section>
    </main>
  `,
  styles: [
    `
      .sticker-row,
      .collection-actions {
        align-items: center;
        display: grid;
        gap: 1rem;
      }

      .collection-actions {
        grid-template-columns: 140px auto;
      }

      @media (min-width: 760px) {
        .sticker-row {
          grid-template-columns: 1fr auto;
        }
      }
    `
  ]
})
export class CollectionComponent implements OnInit {
  readonly albums = signal<AlbumResponse[]>([]);
  readonly selectedAlbumId = signal('');
  readonly stickers = signal<StickerResponse[]>([]);
  readonly repeated = signal<RepeatedStickerResponse[]>([]);
  readonly wanted = signal<WantedStickerResponse[]>([]);
  readonly repeatedBySticker = computed(() => new Map(this.repeated().map((item) => [item.stickerId, item])));
  readonly wantedBySticker = computed(() => new Map(this.wanted().map((item) => [item.stickerId, item])));

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.albums().subscribe((page) => {
      this.albums.set(page.content);
      const first = page.content[0];
      if (first) {
        this.selectAlbum(first.id);
      }
    });
  }

  selectAlbum(albumId: string): void {
    this.selectedAlbumId.set(albumId);
    this.api.stickers(albumId).subscribe((page) => this.stickers.set(page.content));
    this.reloadCollection(albumId);
  }

  quantityFor(stickerId: string): number {
    return this.repeatedBySticker().get(stickerId)?.quantity ?? 0;
  }

  wantedFor(stickerId: string): boolean {
    return this.wantedBySticker().has(stickerId);
  }

  warningFor(stickerId: string): string | null {
    return this.repeatedBySticker().get(stickerId)?.warning ?? this.wantedBySticker().get(stickerId)?.warning ?? null;
  }

  setQuantity(stickerId: string, rawValue: string): void {
    const quantity = Math.max(0, Number(rawValue || 0));
    this.api.setRepeated(stickerId, quantity).subscribe(() => this.reloadCollection(this.selectedAlbumId()));
  }

  toggleWanted(stickerId: string, checked: boolean): void {
    if (checked) {
      this.api.setWanted(stickerId).subscribe(() => this.reloadCollection(this.selectedAlbumId()));
      return;
    }
    this.api.deleteWanted(stickerId).subscribe(() => this.reloadCollection(this.selectedAlbumId()));
  }

  private reloadCollection(albumId: string): void {
    this.api.repeated(albumId).subscribe((items) => this.repeated.set(items));
    this.api.wanted(albumId).subscribe((items) => this.wanted.set(items));
  }
}
