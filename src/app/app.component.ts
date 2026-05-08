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
    this.auth.checkAuth().subscribe();
  }
}
