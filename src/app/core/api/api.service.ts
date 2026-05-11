import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '../config/runtime-config.service';
import {
  AdminUserResponse,
  AlbumResponse,
  BlockedUserResponse,
  CepLookupResponse,
  CollectionFilter,
  CollectionStickerResponse,
  ConversationResponse,
  HolderResponse,
  MessageResponse,
  MyProfileResponse,
  NotificationResponse,
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
      params: this.params({ token, redirect: false })
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

  stickers(
    albumId: string,
    options: { q?: string | null; page?: number; size?: number } = {}
  ): Observable<Page<StickerResponse>> {
    const { q = null, page = 0, size = 300 } = options;
    return this.http.get<Page<StickerResponse>>(this.config.apiUrl(`/albums/${albumId}/stickers`), {
      params: this.params({ q, page, size, sort: 'code' })
    });
  }

  myProfile(): Observable<MyProfileResponse> {
    return this.http.get<MyProfileResponse>(this.config.apiUrl('/me/profile'));
  }

  updateProfile(payload: Partial<MyProfileResponse>): Observable<MyProfileResponse> {
    return this.http.put<MyProfileResponse>(this.config.apiUrl('/me/profile'), payload);
  }

  lookupCep(cep: string): Observable<CepLookupResponse> {
    return this.http.get<CepLookupResponse>(this.config.apiUrl(`/ceps/${cep}`));
  }

  publicProfile(userId: string): Observable<PublicProfileResponse> {
    return this.http.get<PublicProfileResponse>(this.config.apiUrl(`/users/${userId}/profile`));
  }

  repeated(albumId: string): Observable<RepeatedStickerResponse[]> {
    return this.http.get<RepeatedStickerResponse[]>(
      this.config.apiUrl(`/me/albums/${albumId}/repeated-stickers`)
    );
  }

  collection(
    albumId: string,
    options: { q?: string | null; filter?: CollectionFilter; page?: number; size?: number } = {}
  ): Observable<Page<CollectionStickerResponse>> {
    const { q = null, filter = 'ALL', page = 0, size = 25 } = options;
    return this.http.get<Page<CollectionStickerResponse>>(this.config.apiUrl(`/me/albums/${albumId}/collection`), {
      params: this.params({ q, filter, page, size, sort: 'code' })
    });
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

  notifications(): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(this.config.apiUrl('/notifications'));
  }

  unreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(this.config.apiUrl('/notifications/unread-count'));
  }

  markNotificationRead(id: string): Observable<void> {
    return this.http.put<void>(this.config.apiUrl(`/notifications/${id}/read`), {});
  }

  markAllNotificationsRead(): Observable<void> {
    return this.http.put<void>(this.config.apiUrl('/notifications/read-all'), {});
  }

  markConversationNotificationsRead(conversationId: string): Observable<void> {
    return this.http.put<void>(this.config.apiUrl(`/chats/${conversationId}/notifications/read`), {});
  }

  blockUser(userId: string): Observable<void> {
    return this.http.put<void>(this.config.apiUrl(`/users/${userId}/block`), {});
  }

  blockedUsers(page = 0, size = 10): Observable<Page<BlockedUserResponse>> {
    return this.http.get<Page<BlockedUserResponse>>(this.config.apiUrl('/me/blocked-users'), {
      params: this.params({ page, size })
    });
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
    payload: { code: string; name: string; description?: string | null }
  ): Observable<StickerResponse> {
    return this.http.post<StickerResponse>(this.config.apiUrl(`/admin/albums/${albumId}/stickers`), payload);
  }

  adminStickers(albumId: string, page = 0, size = 500): Observable<Page<StickerResponse>> {
    return this.http.get<Page<StickerResponse>>(this.config.apiUrl(`/admin/albums/${albumId}/stickers`), {
      params: this.params({ page, size, sort: 'code' })
    });
  }

  updateSticker(
    stickerId: string,
    payload: { code?: string | null; name?: string | null; description?: string | null }
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

  adminUsers(page = 0, size = 20, q?: string | null): Observable<Page<AdminUserResponse>> {
    return this.http.get<Page<AdminUserResponse>>(this.config.apiUrl('/admin/users'), {
      params: this.params({ q, page, size, sort: 'createdAt,desc' })
    });
  }

  adminBlockUser(userId: string): Observable<AdminUserResponse> {
    return this.http.patch<AdminUserResponse>(this.config.apiUrl(`/admin/users/${userId}/block`), {});
  }

  adminUnblockUser(userId: string): Observable<AdminUserResponse> {
    return this.http.patch<AdminUserResponse>(this.config.apiUrl(`/admin/users/${userId}/unblock`), {});
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
