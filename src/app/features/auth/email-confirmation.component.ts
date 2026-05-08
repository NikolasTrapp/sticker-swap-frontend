import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-email-confirmation',
  standalone: true,
  imports: [MatButtonModule, RouterLink],
  template: `
    <main class="page auth-simple">
      <section class="hero-card">
        <span class="pill">Conta</span>
        <h1>Confirmação de e-mail</h1>
        <p class="muted">{{ status() }}</p>
        <a mat-flat-button color="primary" routerLink="/login">Ir para login</a>
      </section>
    </main>
  `
})
export class EmailConfirmationComponent implements OnInit {
  readonly status = signal('Validando token...');

  constructor(
    private readonly api: ApiService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status.set('Token ausente.');
      return;
    }
    this.api.confirmEmail(token).subscribe(() => this.status.set('E-mail confirmado com sucesso.'));
  }
}
