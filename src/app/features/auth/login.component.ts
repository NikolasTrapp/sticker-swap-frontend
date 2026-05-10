import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthFacade } from '../../core/auth/auth.facade';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <main class="redirect-page">
      <mat-spinner diameter="40" />
      <p>Redirecionando para o login...</p>
    </main>
  `,
  styles: [`
    .redirect-page {
      align-items: center;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      justify-content: center;
      min-height: 100vh;
    }
    p { color: var(--muted); font-size: 0.95rem; }
  `]
})
export class LoginComponent implements OnInit {
  constructor(private readonly auth: AuthFacade) {}

  ngOnInit(): void {
    this.auth.startLogin();
  }
}
