import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '../config/runtime-config.service';
import {
  AlbumResponse,
  ConversationResponse,
  HolderResponse,
  MessageResponse,
  MyProfileResponse,
  Page,
  PublicProfileResponse,
  RepeatedStickerResponse,
  ReportReason,
  ReportResponse,
  ReportStatus,
  StickerResponse,
  UserResponse,
  WantedStickerResponse
} from './api.types';

type QueryValue = string | number | boolean | null | undefined;

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly config: RuntimeConfigService
  ) {}

  register(email: string, password: string): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.config.apiUrl('/auth/register'), { email, password });
  }

  confirmEmail(token: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(this.config.apiUrl('/auth/email-confirmations/confirm'), {
      params: this.params({ token })
    });
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(this.config.apiUrl('/auth/password-reset-requests'), { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(this.config.apiUrl('/auth/password-resets'), { token, newPassword });
  }

  albums(page = 0, size = 50): Observable<Page<AlbumResponse>> {
    return this.http.get<Page<AlbumResponse>>(this.config.apiUrl('/albums'), {
      params: this.params({ page, size })
    });
  }

  stickers(albumId: string, page = 0, size = 300): Observable<Page<StickerResponse>> {
    return this.http.get<Page<StickerResponse>>(this.config.apiUrl(`/albums/${albumId}/stickers`), {
      params: this.params({ page, size, sort: 'number' })
    });
  }

  myProfile(): Observable<MyProfileResponse> {
    return this.http.get<MyProfileResponse>(this.config.apiUrl('/me/profile'));
  }

  updateProfile(payload: Partial<MyProfileResponse>): Observable<MyProfileResponse> {
    return this.http.put<MyProfileResponse>(this.config.apiUrl('/me/profile'), payload);
  }

  publicProfile(userId: string): Observable<PublicProfileResponse> {
    return this.http.get<PublicProfileResponse>(this.config.apiUrl(`/users/${userId}/profile`));
  }

  repeated(albumId: string): Observable<RepeatedStickerResponse[]> {
    return this.http.get<RepeatedStickerResponse[]>(
      this.config.apiUrl(`/me/albums/${albumId}/repeated-stickers`)
    );
  }

  setRepeated(stickerId: string, quantity: number): Observable<RepeatedStickerResponse> {
    return this.http.put<RepeatedStickerResponse>(this.config.apiUrl(`/me/repeated-stickers/${stickerId}`), {
      quantity
    });
  }

  deleteRepeated(stickerId: string): Observable<void> {
    return this.http.delete<void>(this.config.apiUrl(`/me/repeated-stickers/${stickerId}`));
  }

  wanted(albumId: string): Observable<WantedStickerResponse[]> {
    return this.http.get<WantedStickerResponse[]>(
      this.config.apiUrl(`/me/albums/${albumId}/wanted-stickers`)
    );
  }

  setWanted(stickerId: string): Observable<WantedStickerResponse> {
    return this.http.put<WantedStickerResponse>(this.config.apiUrl(`/me/wanted-stickers/${stickerId}`), {});
  }

  deleteWanted(stickerId: string): Observable<void> {
    return this.http.delete<void>(this.config.apiUrl(`/me/wanted-stickers/${stickerId}`));
  }

  holders(albumId: string, stickerId: string, page = 0, size = 20): Observable<Page<HolderResponse>> {
    return this.http.get<Page<HolderResponse>>(
      this.config.apiUrl(`/albums/${albumId}/stickers/${stickerId}/holders`),
      { params: this.params({ page, size }) }
    );
  }

  expressInterest(stickerId: string, holderId: string): Observable<ConversationResponse> {
    return this.http.post<ConversationResponse>(this.config.apiUrl(`/stickers/${stickerId}/interest`), {
      holderId
    });
  }

  conversations(): Observable<ConversationResponse[]> {
    return this.http.get<ConversationResponse[]>(this.config.apiUrl('/chats'));
  }

  messages(conversationId: string, page = 0, size = 50): Observable<Page<MessageResponse>> {
    return this.http.get<Page<MessageResponse>>(this.config.apiUrl(`/chats/${conversationId}/messages`), {
      params: this.params({ page, size })
    });
  }

  blockUser(userId: string): Observable<void> {
    return this.http.put<void>(this.config.apiUrl(`/users/${userId}/block`), {});
  }

  unblockUser(userId: string): Observable<void> {
    return this.http.delete<void>(this.config.apiUrl(`/users/${userId}/block`));
  }

  reportUser(userId: string, reason: ReportReason, description: string | null): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(this.config.apiUrl(`/users/${userId}/report`), {
      reason,
      description
    });
  }

  createAlbum(payload: { name: string; description?: string | null; year?: number | null }): Observable<AlbumResponse> {
    return this.http.post<AlbumResponse>(this.config.apiUrl('/admin/albums'), payload);
  }

  adminAlbums(page = 0, size = 100): Observable<Page<AlbumResponse>> {
    return this.http.get<Page<AlbumResponse>>(this.config.apiUrl('/admin/albums'), {
      params: this.params({ page, size })
    });
  }

  updateAlbum(
    albumId: string,
    payload: { name?: string | null; description?: string | null; year?: number | null }
  ): Observable<AlbumResponse> {
    return this.http.put<AlbumResponse>(this.config.apiUrl(`/admin/albums/${albumId}`), payload);
  }

  setAlbumActive(albumId: string, active: boolean): Observable<AlbumResponse> {
    return this.http.patch<AlbumResponse>(
      this.config.apiUrl(`/admin/albums/${albumId}/${active ? 'activate' : 'deactivate'}`),
      {}
    );
  }

  createSticker(
    albumId: string,
    payload: { number: string; name: string; description?: string | null }
  ): Observable<StickerResponse> {
    return this.http.post<StickerResponse>(this.config.apiUrl(`/admin/albums/${albumId}/stickers`), payload);
  }

  adminStickers(albumId: string, page = 0, size = 500): Observable<Page<StickerResponse>> {
    return this.http.get<Page<StickerResponse>>(this.config.apiUrl(`/admin/albums/${albumId}/stickers`), {
      params: this.params({ page, size, sort: 'number' })
    });
  }

  updateSticker(
    stickerId: string,
    payload: { number?: string | null; name?: string | null; description?: string | null }
  ): Observable<StickerResponse> {
    return this.http.put<StickerResponse>(this.config.apiUrl(`/admin/stickers/${stickerId}`), payload);
  }

  setStickerActive(stickerId: string, active: boolean): Observable<StickerResponse> {
    return this.http.patch<StickerResponse>(
      this.config.apiUrl(`/admin/stickers/${stickerId}/${active ? 'activate' : 'deactivate'}`),
      {}
    );
  }

  reports(status?: ReportStatus): Observable<Page<ReportResponse>> {
    return this.http.get<Page<ReportResponse>>(this.config.apiUrl('/admin/moderation/reports'), {
      params: this.params({ status, size: 50 })
    });
  }

  private params(values: Record<string, QueryValue>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
