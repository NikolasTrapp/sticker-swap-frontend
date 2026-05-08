import { Component, OnInit, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthFacade } from '../../core/auth/auth.facade';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <main class="page callback">
      <mat-spinner diameter="44" />
      <h1>{{ message() }}</h1>
    </main>
  `,
  styles: [
    `
      .callback {
        min-height: 100vh;
        place-items: center;
        text-align: center;
      }
    `
  ]
})
export class OAuthCallbackComponent implements OnInit {
  readonly message = signal('Finalizando autenticação...');

  constructor(
    private readonly auth: AuthFacade,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.auth.checkAuth().subscribe((authenticated) => {
      this.message.set(authenticated ? 'Autenticado.' : 'Não foi possível autenticar.');
      void this.router.navigateByUrl(authenticated ? '/dashboard' : '/login');
    });
  }
}
