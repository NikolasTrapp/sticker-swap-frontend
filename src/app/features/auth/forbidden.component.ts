import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [MatButtonModule, RouterLink],
  template: `
    <main class="page">
      <section class="hero-card">
        <span class="pill danger">403</span>
        <h1>Acesso restrito</h1>
        <p class="muted">Esta área exige perfil administrativo.</p>
        <a mat-flat-button color="primary" routerLink="/dashboard">Voltar ao início</a>
      </section>
    </main>
  `
})
export class ForbiddenComponent {}
