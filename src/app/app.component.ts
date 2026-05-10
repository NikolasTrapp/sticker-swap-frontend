import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthFacade } from './core/auth/auth.facade';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class AppComponent implements OnInit {
  constructor(private readonly auth: AuthFacade) {}

  ngOnInit(): void {
    // OAuthCallbackComponent handles the callback exclusively; calling checkAuth()
    // here concurrently causes state validation failure ("authCallback incorrect state")
    // and clears the token before it can be stored.
    if (!window.location.pathname.startsWith('/oauth/callback')) {
      this.auth.checkAuth().subscribe();
    }
  }
}
