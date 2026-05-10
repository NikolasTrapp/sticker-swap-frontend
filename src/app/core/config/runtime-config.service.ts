import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

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

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {

  snapshot(): RuntimeConfig {
    return environment;
  }

  apiUrl(path: string): string {
    return joinUrl(environment.apiBaseUrl, path);
  }

  authUrl(path: string): string {
    return joinUrl(environment.authBaseUrl, path);
  }

  isApiRequest(url: string): boolean {
    return url.startsWith(environment.apiBaseUrl);
  }
}

function joinUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
