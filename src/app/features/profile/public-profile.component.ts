import { NgIf } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicProfileResponse } from '../../core/api/api.types';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, NgIf, RouterLink],
  template: `
    <main class="page">
      <mat-card class="outlined-card" *ngIf="profile() as profile">
        <mat-card-header>
          <mat-card-title>{{ profile.nickname || 'Colecionador' }}</mat-card-title>
          <mat-card-subtitle>Perfil público</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p class="app-muted" *ngIf="profile.city || profile.state">{{ profile.city }} {{ profile.state }}</p>
          <p class="app-muted" *ngIf="!profile.city && !profile.state">Localização pública não informada.</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-flat-button color="primary" routerLink="/search">Voltar à busca</a>
        </mat-card-actions>
      </mat-card>
    </main>
  `
})
export class PublicProfileComponent implements OnInit {
  readonly profile = signal<PublicProfileResponse | null>(null);

  constructor(
    private readonly api: ApiService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (userId) {
      this.api.publicProfile(userId).subscribe((profile) => this.profile.set(profile));
    }
  }
}
