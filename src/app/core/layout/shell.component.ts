import { NgFor, NgIf } from '@angular/common';
import { Component, computed } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NotificationResponse } from '../api/api.types';
import { AuthFacade } from '../auth/auth.facade';
import { NotificationService } from '../notifications/notification.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    MatBadgeModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatToolbarModule,
    NgFor,
    NgIf,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  template: `
    <mat-toolbar class="app-topbar">
      <a class="brand" routerLink="/dashboard" aria-label="Ir para o início">
        <span class="brand-mark">SS</span>
        <span class="brand-copy">
          <strong>Sticker Swap</strong>
          <small>Trocas da Copa</small>
        </span>
      </a>

      <span class="spacer"></span>

      <button
        mat-icon-button
        type="button"
        class="notification-trigger"
        *ngIf="auth.authenticated()"
        [matMenuTriggerFor]="notificationsMenu"
        [matBadge]="ns.unreadCount() || null"
        matBadgeColor="warn"
        matBadgeSize="small"
        aria-label="Notificações"
      >
        <mat-icon>notifications</mat-icon>
      </button>

      <span class="user" *ngIf="auth.profile() as profile">{{ profile.email }}</span>
      <a mat-stroked-button routerLink="/logout" *ngIf="auth.authenticated()">Sair</a>
    </mat-toolbar>

    <mat-menu #notificationsMenu="matMenu" class="notification-menu">
      <div class="notification-heading" (click)="$event.stopPropagation()">
        <strong>Notificações</strong>
        <button mat-button type="button" (click)="markAllRead()">Marcar lidas</button>
      </div>
      <mat-divider />
      <button mat-menu-item type="button" disabled *ngIf="ns.notifications().length === 0">
        Sem notificações por enquanto
      </button>
      <button mat-menu-item type="button" *ngFor="let n of ns.notifications()" (click)="openNotification(n)">
        <span class="notification-item" [class.unread]="!n.read">
          <span class="notification-text">{{ formatMessage(n) }}</span>
          <small>{{ timeAgo(n.createdAt) }}</small>
        </span>
      </button>
    </mat-menu>

    <div class="shell-container">
      <aside class="sidebar" *ngIf="auth.authenticated()">
        <mat-nav-list>
          <a
            mat-list-item
            *ngFor="let item of visibleNav()"
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </a>
        </mat-nav-list>
      </aside>

      <main class="content">
        <router-outlet />
      </main>
    </div>

    <nav class="bottom-nav" *ngIf="auth.authenticated()" aria-label="Navegação principal">
      <a *ngFor="let item of visibleNav()" [routerLink]="item.route" routerLinkActive="active">
        <mat-icon aria-hidden="true">{{ item.icon }}</mat-icon>
        {{ item.label }}
      </a>
    </nav>
  `,
  styles: [
    `
      .app-topbar {
        background: rgba(255, 253, 247, 0.96);
        border-bottom: 1px solid rgba(221, 214, 195, 0.85);
        color: var(--ink);
        gap: 0.5rem;
        min-height: 64px;
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .brand {
        align-items: center;
        color: inherit;
        display: inline-flex;
        gap: 0.65rem;
        min-width: 0;
        text-decoration: none;
      }

      .brand-mark {
        align-items: center;
        background: var(--ink);
        border-radius: 12px;
        color: var(--surface);
        display: inline-flex;
        flex: 0 0 38px;
        font-size: 0.8rem;
        font-weight: 900;
        height: 38px;
        justify-content: center;
        letter-spacing: 0;
        width: 38px;
      }

      .brand-copy {
        display: grid;
        line-height: 1.1;
        min-width: 0;
      }

      .brand-copy strong {
        font-size: 1rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .brand-copy small {
        color: var(--muted);
        font-size: 0.72rem;
      }

      .spacer {
        flex: 1;
      }

      .user {
        color: var(--muted);
        display: none;
        font-size: 0.85rem;
        max-width: 240px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .notification-heading {
        align-items: center;
        display: flex;
        gap: 0.5rem;
        justify-content: space-between;
        padding: 0.5rem 0.75rem;
        width: min(360px, 92vw);
      }

      .notification-item {
        display: grid;
        gap: 0.15rem;
        line-height: 1.25;
        min-width: 0;
      }

      .notification-item.unread .notification-text {
        color: var(--brand-strong);
        font-weight: 800;
      }

      .notification-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .notification-item small {
        color: var(--muted);
      }

      .shell-container {
        background: transparent;
        display: grid;
        min-height: calc(100vh - 64px);
      }

      .sidebar {
        background: rgba(255, 253, 247, 0.72);
        border-right: 1px solid rgba(221, 214, 195, 0.85);
        display: none;
        width: 236px;
      }

      .sidebar a {
        border-radius: var(--radius);
        color: var(--muted);
        font-weight: 800;
        margin: 0.25rem 0.75rem;
      }

      .sidebar a.active {
        background: var(--brand-soft);
        color: var(--brand-strong);
      }

      .content {
        min-height: calc(100vh - 64px);
        min-width: 0;
        padding-bottom: 5rem;
      }

      .bottom-nav {
        background: rgba(255, 253, 247, 0.98);
        border-top: 1px solid var(--line);
        bottom: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
        left: 0;
        position: fixed;
        right: 0;
        z-index: 12;
      }

      .bottom-nav a {
        align-items: center;
        color: var(--muted);
        display: grid;
        font-size: 0.74rem;
        font-weight: 800;
        gap: 0.15rem;
        justify-items: center;
        overflow: hidden;
        padding: 0.55rem 0.25rem 0.65rem;
        text-align: center;
        text-decoration: none;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .bottom-nav a.active {
        color: var(--brand-strong);
      }

      .bottom-nav mat-icon {
        font-size: 1.25rem;
        height: 1.25rem;
        width: 1.25rem;
      }

      @media (max-width: 480px) {
        .app-topbar {
          gap: 0.35rem;
          padding: 0 0.6rem;
        }

        .brand-copy small {
          display: none;
        }

        .brand-copy strong {
          max-width: 128px;
        }
      }

      @media (min-width: 920px) {
        .user {
          display: inline;
        }

        .sidebar {
          display: block;
          position: sticky;
          top: 64px;
          height: calc(100vh - 64px);
        }

        .shell-container {
          grid-template-columns: 236px minmax(0, 1fr);
        }

        .content {
          padding-bottom: 0;
        }

        .bottom-nav {
          display: none;
        }
      }
    `
  ]
})
export class ShellComponent {
  readonly navItems: NavItem[] = [
    { label: 'Início', route: '/dashboard', icon: 'home' },
    { label: 'Catálogo', route: '/catalog', icon: 'view_list' },
    { label: 'Coleção', route: '/collection', icon: 'inventory_2' },
    { label: 'Busca', route: '/search', icon: 'search' },
    { label: 'Chats', route: '/chats', icon: 'chat' },
    { label: 'Admin', route: '/admin', icon: 'admin_panel_settings', adminOnly: true }
  ];

  readonly visibleNav = computed(() => this.navItems.filter((item) => !item.adminOnly || this.auth.isAdmin()));

  constructor(
    readonly auth: AuthFacade,
    readonly ns: NotificationService,
    private readonly router: Router
  ) {}

  markAllRead(): void {
    this.ns.markAllRead();
  }

  openNotification(n: NotificationResponse): void {
    this.ns.markRead(n.notificationId);
    void this.router.navigate(['/chats', n.conversationId]);
  }

  formatMessage(n: NotificationResponse): string {
    const actor = n.actorNickname ?? 'Alguém';
    const sticker = n.stickerCode ? `${n.stickerCode} - ${n.stickerName ?? 'figurinha'}` : 'uma figurinha';
    if (n.type === 'NEW_INTEREST') {
      return `${actor} quer trocar ${sticker}`;
    }
    return `${actor} enviou uma mensagem`;
  }

  timeAgo(createdAt: string): string {
    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'agora mesmo';
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
  }
}
