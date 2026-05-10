import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [MatButtonModule, RouterLink],
  template: `
    <main class="page">
      <section class="app-page-header">
        <span class="pill danger">Acesso restrito</span>
        <h1>Acesso restrito</h1>
        <p class="app-muted">Sua conta não tem permissão para acessar esta área.</p>
        <a mat-flat-button color="primary" routerLink="/dashboard">Voltar ao início</a>
      </section>
    </main>
  `
})
export class ForbiddenComponent {}
