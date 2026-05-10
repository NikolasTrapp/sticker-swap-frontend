import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface RuntimeConfig {
  apiBaseUrl: string;
  authBaseUrl: string;
  wsUrl: string;
  oidc: {
    authority: string;
    clientId: string;
    scope: string;
    redirectUrl: string;
    postLogoutRedirectUri: string;
  };
}

const DEFAULT_CONFIG: RuntimeConfig = {
  apiBaseUrl: 'http://localhost:8080',
  authBaseUrl: 'http://localhost:8080',
  wsUrl: 'ws://localhost:8080/ws',
  oidc: {
    authority: 'http://localhost:8080',
    clientId: 'sticker-swap-web',
    scope: 'openid profile api offline_access',
    redirectUrl: 'http://localhost:4200/oauth/callback',
    postLogoutRedirectUri: 'http://localhost:4200/logged-out'
  }
};

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private runtimeConfig: RuntimeConfig = DEFAULT_CONFIG;

  constructor(private readonly http: HttpClient) {}

  async load(): Promise<void> {
    try {
      this.runtimeConfig = await firstValueFrom(this.http.get<RuntimeConfig>('assets/config.json'));
    } catch {
      this.runtimeConfig = DEFAULT_CONFIG;
    }
  }

  snapshot(): RuntimeConfig {
    return this.runtimeConfig;
  }

  apiUrl(path: string): string {
    return joinUrl(this.runtimeConfig.apiBaseUrl, path);
  }

  authUrl(path: string): string {
    return joinUrl(this.runtimeConfig.authBaseUrl, path);
  }

  isApiRequest(url: string): boolean {
    return url.startsWith(this.runtimeConfig.apiBaseUrl);
  }
}

function joinUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
