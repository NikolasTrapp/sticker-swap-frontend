import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
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
    MatSelectModule,
    NgFor,
    NgIf,
    RouterLink
  ],
  template: `
    <main class="page">
      <section class="hero-card">
        <span class="pill">Busca</span>
        <h1>Encontre quem tem a figurinha que falta.</h1>
        <p class="muted">A busca é sempre por álbum e figurinha, com bloqueios respeitados pelo backend.</p>
      </section>

      <section class="panel form-grid">
        <mat-form-field>
          <mat-label>Álbum</mat-label>
          <mat-select [value]="selectedAlbumId()" (valueChange)="selectAlbum($event)">
            <mat-option *ngFor="let album of albums()" [value]="album.id">{{ album.name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Figurinha</mat-label>
          <mat-select [value]="selectedStickerId()" (valueChange)="selectedStickerId.set($event)">
            <mat-option *ngFor="let sticker of stickers()" [value]="sticker.id">
              #{{ sticker.number }} — {{ sticker.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-flat-button color="primary" type="button" [disabled]="!selectedStickerId()" (click)="search()">
          Buscar colecionadores
        </button>
      </section>

      <section class="list">
        <mat-card *ngFor="let holder of holders()">
          <mat-card-content class="holder-row">
            <div>
              <span class="pill" *ngIf="holder.isPotentialMatch">Match potencial</span>
              <h3>{{ holder.nickname || 'Colecionador' }}</h3>
              <p class="muted">
                {{ holder.city || 'Cidade não exibida' }} {{ holder.state || '' }} · {{ holder.quantity }} disponível(is)
              </p>
            </div>
            <div class="actions">
              <a mat-button [routerLink]="['/users', holder.userId, 'profile']">Perfil</a>
              <button mat-flat-button color="primary" type="button" (click)="interest(holder)">Tenho interesse</button>
              <button mat-button type="button" (click)="report(holder.userId)">Denunciar</button>
              <button mat-button class="danger" type="button" (click)="block(holder.userId)">Bloquear</button>
            </div>
          </mat-card-content>
        </mat-card>
        <div class="empty" *ngIf="searched() && !holders().length">
          Nenhum usuário encontrado para esta figurinha.
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .holder-row {
        display: grid;
        gap: 1rem;
      }

      @media (min-width: 820px) {
        .holder-row {
          align-items: center;
          grid-template-columns: 1fr auto;
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

  constructor(
    private readonly api: ApiService,
    private readonly dialog: MatDialog,
    private readonly router: Router
  ) {}

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
    this.selectedStickerId.set('');
    this.holders.set([]);
    this.api.stickers(albumId).subscribe((page) => this.stickers.set(page.content));
  }

  search(): void {
    const albumId = this.selectedAlbumId();
    const stickerId = this.selectedStickerId();
    if (!albumId || !stickerId) {
      return;
    }
    this.api.holders(albumId, stickerId).subscribe((page) => {
      this.searched.set(true);
      this.holders.set(page.content);
    });
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
    this.api.blockUser(userId).subscribe(() => this.search());
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
