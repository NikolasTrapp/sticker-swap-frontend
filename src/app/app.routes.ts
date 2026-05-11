import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/auth/auth.guard';
import { ShellComponent } from './core/layout/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'oauth/callback',
    loadComponent: () => import('./features/auth/oauth-callback.component').then((m) => m.OAuthCallbackComponent)
  },
  {
    path: 'logout',
    loadComponent: () => import('./features/auth/logout.component').then((m) => m.LogoutComponent)
  },
  {
    path: 'logged-out',
    loadComponent: () => import('./features/auth/logged-out.component').then((m) => m.LoggedOutComponent)
  },
  {
    path: 'email-confirmation',
    loadComponent: () =>
      import('./features/auth/email-confirmation.component').then((m) => m.EmailConfirmationComponent)
  },
  {
    path: 'email-confirmed',
    loadComponent: () => import('./features/auth/email-confirmed.component').then((m) => m.EmailConfirmedComponent)
  },
  {
    path: 'email-confirmation-sent',
    loadComponent: () =>
      import('./features/auth/email-confirmation-sent.component').then((m) => m.EmailConfirmationSentComponent)
  },
  {
    path: 'password-reset-request',
    loadComponent: () =>
      import('./features/auth/password-reset-request.component').then((m) => m.PasswordResetRequestComponent)
  },
  {
    path: 'password-reset',
    loadComponent: () => import('./features/auth/password-reset.component').then((m) => m.PasswordResetComponent)
  },
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent)
      },
      {
        path: 'catalog',
        canActivate: [authGuard],
        loadComponent: () => import('./features/catalog/catalog.component').then((m) => m.CatalogComponent)
      },
      {
        path: 'collection',
        canActivate: [authGuard],
        loadComponent: () => import('./features/collection/collection.component').then((m) => m.CollectionComponent)
      },
      {
        path: 'search',
        canActivate: [authGuard],
        loadComponent: () => import('./features/search/search.component').then((m) => m.SearchComponent)
      },
      {
        path: 'users/:userId/profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/public-profile.component').then((m) => m.PublicProfileComponent)
      },
      {
        path: 'chats',
        canActivate: [authGuard],
        loadComponent: () => import('./features/chat/chat-list.component').then((m) => m.ChatListComponent)
      },
      {
        path: 'chats/:conversationId',
        canActivate: [authGuard],
        loadComponent: () => import('./features/chat/chat-room.component').then((m) => m.ChatRoomComponent)
      },
      {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        loadComponent: () => import('./features/admin/admin.component').then((m) => m.AdminComponent)
      },
      {
        path: 'forbidden',
        loadComponent: () => import('./features/auth/forbidden.component').then((m) => m.ForbiddenComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
