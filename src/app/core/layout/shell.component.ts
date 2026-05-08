import { NgFor, NgIf } from '@angular/common';
import { Component, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthFacade } from '../auth/auth.facade';

interface NavItem {
  label: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [MatButtonModule, MatToolbarModule, NgFor, NgIf, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <mat-toolbar class="topbar">
      <a class="brand" routerLink="/dashboard">
        <span class="brand-mark">SS</span>
        <span>
          <strong>Sticker Swap</strong>
          <small>Trocas da Copa</small>
        </span>
      </a>
      <span class="spacer"></span>
      <span class="user" *ngIf="auth.profile() as profile">{{ profile.email }}</span>
      <button mat-stroked-button type="button" *ngIf="auth.authenticated()" (click)="auth.logout()">Sair</button>
    </mat-toolbar>

    <div class="shell">
      <aside class="sidebar" *ngIf="auth.authenticated()">
        <a
          *ngFor="let item of visibleNav()"
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
        >
          {{ item.label }}
        </a>
      </aside>

      <main class="content">
        <router-outlet />
      </main>
    </div>

    <nav class="bottom-nav" *ngIf="auth.authenticated()">
      <a *ngFor="let item of visibleNav()" [routerLink]="item.route" routerLinkActive="active">
        {{ item.label }}
      </a>
    </nav>
  `,
  styles: [
    `
      .topbar {
        background: rgba(255, 253, 247, 0.9);
        border-bottom: 1px solid rgba(221, 214, 195, 0.75);
        color: var(--ink);
        gap: 1rem;
        position: sticky;
        top: 0;
        z-index: 5;
      }

      .brand {
        align-items: center;
        color: inherit;
        display: inline-flex;
        gap: 0.75rem;
        text-decoration: none;
      }

      .brand-mark {
        align-items: center;
        background: var(--ink);
        border-radius: 14px;
        color: var(--surface);
        display: inline-flex;
        font-size: 0.82rem;
        font-weight: 900;
        height: 40px;
        justify-content: center;
        letter-spacing: -0.05em;
        width: 40px;
      }

      .brand small {
        color: var(--muted);
        display: block;
        font-size: 0.72rem;
        line-height: 1;
      }

      .spacer {
        flex: 1;
      }

      .user {
        color: var(--muted);
        display: none;
        font-size: 0.85rem;
      }

      .shell {
        display: grid;
        min-height: calc(100vh - 64px);
      }

      .sidebar {
        display: none;
      }

      .content {
        padding-bottom: 5.5rem;
      }

      .bottom-nav {
        align-items: center;
        background: rgba(255, 253, 247, 0.96);
        border-top: 1px solid var(--line);
        bottom: 0;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        left: 0;
        position: fixed;
        right: 0;
        z-index: 6;
      }

      .bottom-nav a,
      .sidebar a {
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 800;
        padding: 0.9rem 0.3rem;
        text-align: center;
        text-decoration: none;
      }

      .bottom-nav a.active,
      .sidebar a.active {
        color: var(--brand-strong);
      }

      @media (min-width: 920px) {
        .user {
          display: inline;
        }

        .shell {
          grid-template-columns: 240px 1fr;
        }

        .sidebar {
          align-content: start;
          background: rgba(255, 253, 247, 0.55);
          border-right: 1px solid rgba(221, 214, 195, 0.75);
          display: grid;
          gap: 0.25rem;
          padding: 1rem;
          position: sticky;
          top: 64px;
          height: calc(100vh - 64px);
        }

        .sidebar a {
          border-radius: 16px;
          font-size: 0.95rem;
          padding: 0.9rem 1rem;
          text-align: left;
        }

        .sidebar a.active {
          background: var(--brand-soft);
        }

        .bottom-nav {
          display: none;
        }

        .content {
          padding-bottom: 0;
        }
      }
    `
  ]
})
export class ShellComponent {
  readonly navItems: NavItem[] = [
    { label: 'Início', route: '/dashboard' },
    { label: 'Catálogo', route: '/catalog' },
    { label: 'Coleção', route: '/collection' },
    { label: 'Busca', route: '/search' },
    { label: 'Chats', route: '/chats' },
    { label: 'Admin', route: '/admin', adminOnly: true }
  ];

  readonly visibleNav = computed(() => this.navItems.filter((item) => !item.adminOnly || this.auth.isAdmin()));

  constructor(readonly auth: AuthFacade) {}
}
