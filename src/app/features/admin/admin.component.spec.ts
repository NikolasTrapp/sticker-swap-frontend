import { signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { of } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { AdminUserResponse, AlbumResponse, Page, ReportResponse, StickerResponse } from '../../core/api/api.types';
import { AuthFacade, AuthProfile } from '../../core/auth/auth.facade';
import { AdminComponent } from './admin.component';

const album: AlbumResponse = {
  id: 'album-1',
  name: 'World Cup',
  description: 'Album',
  year: 2026,
  active: true,
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z'
};

const sticker: StickerResponse = {
  id: 'sticker-1',
  albumId: 'album-1',
  code: '001',
  name: 'Mascote',
  description: 'Desc',
  active: true,
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z'
};

const report: ReportResponse = {
  reportId: 'report-1',
  reporterId: 'user-1',
  reportedId: 'user-2',
  reason: 'SPAM',
  description: 'spam',
  status: 'PENDING',
  createdAt: '2026-01-01T10:00:00Z'
};

const adminUser: AdminUserResponse = {
  id: 'user-2',
  email: 'user@test.local',
  role: 'USER',
  status: 'ACTIVE',
  emailVerified: true,
  emailVerifiedAt: '2026-01-01T10:00:00Z',
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z',
  lastActivityAt: null,
  lastIpAddress: null
};

function page<T>(content: T[], patch: Partial<Page<T>> = {}): Page<T> {
  return { content, totalElements: content.length, totalPages: 1, size: 20, number: 0, ...patch };
}

describe('AdminComponent', () => {
  let api: jasmine.SpyObj<ApiService>;
  let auth: { profile: ReturnType<typeof signal<AuthProfile | null>> };
  let component: AdminComponent;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'adminAlbums',
      'adminBlockUser',
      'adminStickers',
      'adminUnblockUser',
      'adminUsers',
      'createAlbum',
      'createSticker',
      'reports',
      'setAlbumActive',
      'setStickerActive',
      'updateAlbum',
      'updateSticker'
    ]);
    auth = { profile: signal<AuthProfile | null>({ sub: 'admin-1', email: 'admin@test.local', role: 'ADMIN' }) };

    api.adminAlbums.and.returnValue(of(page([album], { size: 100 })));
    api.adminStickers.and.returnValue(of(page([sticker], { size: 500 })));
    api.reports.and.returnValue(of(page([report], { size: 50 })));
    api.adminUsers.and.returnValue(of(page([adminUser], { totalElements: 1, size: 20 })));
    api.adminBlockUser.and.returnValue(of({ ...adminUser, status: 'INACTIVE' }));
    api.adminUnblockUser.and.returnValue(of(adminUser));
    api.createAlbum.and.returnValue(of(album));
    api.updateAlbum.and.returnValue(of(album));
    api.setAlbumActive.and.returnValue(of({ ...album, active: false }));
    api.createSticker.and.returnValue(of(sticker));
    api.updateSticker.and.returnValue(of(sticker));
    api.setStickerActive.and.returnValue(of({ ...sticker, active: false }));

    component = new AdminComponent(api, new FormBuilder(), auth as unknown as AuthFacade);
  });

  describe('Dado inicialização do painel', () => {
    it('Então carrega álbuns, figurinhas do primeiro álbum e denúncias', () => {
      // Arrange

      // Act
      component.ngOnInit();

      // Assert
      expect(api.adminAlbums).toHaveBeenCalledOnceWith(0, 100);
      expect(component.albums()).toEqual([album]);
      expect(component.selectedAlbumId()).toBe('album-1');
      expect(component.stickers()).toEqual([sticker]);
      expect(component.reports()).toEqual([report]);
    });

    it('Então mantém álbum selecionado quando ele ainda existe', () => {
      // Arrange
      component.selectedAlbumId.set('album-1');

      // Act
      component.loadAlbums();

      // Assert
      expect(component.selectedAlbumId()).toBe('album-1');
    });
  });

  describe('Dado aba de usuários', () => {
    it('Então carrega usuários apenas na primeira abertura da aba', () => {
      // Arrange

      // Act
      component.setAdminTab(3);
      component.setAdminTab(3);

      // Assert
      expect(component.adminTabIndex()).toBe(3);
      expect(api.adminUsers).toHaveBeenCalledTimes(1);
      expect(component.users()).toEqual([adminUser]);
      expect(component.usersLoaded()).toBeTrue();
      expect(component.loadingUsers()).toBeFalse();
    });

    it('Então busca, limpa e pagina usuários com query normalizada', () => {
      // Arrange
      component.userSearchForm.setValue({ q: '  user@test.local  ' });

      // Act
      component.searchUsers();
      component.onUsersPage({ pageIndex: 2, pageSize: 50 } as PageEvent);
      component.clearUserSearch();

      // Assert
      expect(api.adminUsers).toHaveBeenCalledWith(0, 20, 'user@test.local');
      expect(api.adminUsers).toHaveBeenCalledWith(2, 50, 'user@test.local');
      expect(api.adminUsers).toHaveBeenCalledWith(0, 50, null);
    });

    it('Então bloqueia e desbloqueia usuários atualizando a linha local', () => {
      // Arrange
      component.users.set([adminUser]);

      // Act
      component.setUserBlocked(adminUser, true);
      component.setUserBlocked({ ...adminUser, status: 'INACTIVE' }, false);

      // Assert
      expect(api.adminBlockUser).toHaveBeenCalledOnceWith('user-2');
      expect(api.adminUnblockUser).toHaveBeenCalledOnceWith('user-2');
      expect(component.updatingUserId()).toBeNull();
      expect(component.users()[0]).toEqual(adminUser);
    });
  });

  describe('Dado manutenção de álbuns', () => {
    it('Então não salva álbum inválido', () => {
      // Arrange
      component.albumForm.patchValue({ name: '' });

      // Act
      component.saveAlbum();

      // Assert
      expect(api.createAlbum).not.toHaveBeenCalled();
      expect(api.updateAlbum).not.toHaveBeenCalled();
    });

    it('Então cria álbum novo com descrição e ano normalizados', () => {
      // Arrange
      component.albumForm.setValue({ name: 'Novo', description: '   ', year: 0 });

      // Act
      component.saveAlbum();

      // Assert
      expect(api.createAlbum).toHaveBeenCalledOnceWith({ name: 'Novo', description: null, year: null });
      expect(component.editingAlbumId()).toBeNull();
      expect(component.saving()).toBeFalse();
    });

    it('Então edita álbum existente e reseta formulário', () => {
      // Arrange
      component.editAlbum(album);
      component.albumForm.patchValue({ name: 'Atualizado', description: 'Desc', year: 2027 });

      // Act
      component.saveAlbum();

      // Assert
      expect(api.updateAlbum).toHaveBeenCalledOnceWith('album-1', { name: 'Atualizado', description: 'Desc', year: 2027 });
      expect(component.editingAlbumId()).toBeNull();
      expect(component.albumForm.controls.name.value).toBe('');
    });

    it('Então alterna status do álbum', () => {
      // Arrange

      // Act
      component.setAlbumActive(album);

      // Assert
      expect(api.setAlbumActive).toHaveBeenCalledOnceWith('album-1', false);
      expect(api.adminAlbums).toHaveBeenCalled();
    });

    it('Então resetAlbumForm limpa edição', () => {
      // Arrange
      component.editAlbum(album);

      // Act
      component.resetAlbumForm();

      // Assert
      expect(component.editingAlbumId()).toBeNull();
      expect(component.albumForm.controls.name.value).toBe('');
    });
  });

  describe('Dado manutenção de figurinhas', () => {
    it('Então não salva figurinha inválida ou sem álbum', () => {
      // Arrange
      component.stickerForm.patchValue({ code: '', name: '' });

      // Act
      component.saveSticker();
      component.stickerForm.setValue({ code: '001', name: 'Mascote', description: '' });
      component.saveSticker();

      // Assert
      expect(api.createSticker).not.toHaveBeenCalled();
      expect(api.updateSticker).not.toHaveBeenCalled();
    });

    it('Então cria figurinha no álbum selecionado', () => {
      // Arrange
      component.selectedAlbumId.set('album-1');
      component.stickerForm.setValue({ code: '002', name: 'Taça', description: '   ' });

      // Act
      component.saveSticker();

      // Assert
      expect(api.createSticker).toHaveBeenCalledOnceWith('album-1', { code: '002', name: 'Taça', description: null });
      expect(component.editingStickerId()).toBeNull();
      expect(api.adminStickers).toHaveBeenCalledWith('album-1', 0, 500);
    });

    it('Então edita figurinha existente', () => {
      // Arrange
      component.selectedAlbumId.set('album-1');
      component.editSticker(sticker);
      component.stickerForm.patchValue({ code: '003', name: 'Bola', description: 'Nova' });

      // Act
      component.saveSticker();

      // Assert
      expect(api.updateSticker).toHaveBeenCalledOnceWith('sticker-1', { code: '003', name: 'Bola', description: 'Nova' });
      expect(component.stickerForm.controls.code.value).toBe('');
    });

    it('Então alterna status da figurinha e recarrega álbum selecionado', () => {
      // Arrange
      component.selectedAlbumId.set('album-1');

      // Act
      component.setStickerActive(sticker);

      // Assert
      expect(api.setStickerActive).toHaveBeenCalledOnceWith('sticker-1', false);
      expect(api.adminStickers).toHaveBeenCalledWith('album-1', 0, 500);
    });

    it('Então resetStickerForm limpa edição', () => {
      // Arrange
      component.editSticker(sticker);

      // Act
      component.resetStickerForm();

      // Assert
      expect(component.editingStickerId()).toBeNull();
      expect(component.stickerForm.controls.code.value).toBe('');
    });
  });

  describe('Dado denúncias administrativas', () => {
    it('Então carrega relatórios conforme status selecionado', () => {
      // Arrange
      component.reportStatus.set('REVIEWED');

      // Act
      component.loadReports();

      // Assert
      expect(api.reports).toHaveBeenCalledWith('REVIEWED');
      expect(component.reports()).toEqual([report]);
    });

    it('Então traduz status e motivo de denúncia', () => {
      // Arrange

      // Act
      const pending = component.reportStatusLabel('PENDING');
      const reviewed = component.reportStatusLabel('REVIEWED');
      const dismissed = component.reportStatusLabel('DISMISSED');
      const spam = component.reportReasonLabel('SPAM');
      const inappropriate = component.reportReasonLabel('INAPPROPRIATE_CONTENT');
      const harassment = component.reportReasonLabel('HARASSMENT');
      const other = component.reportReasonLabel('OTHER');

      // Assert
      expect([pending, reviewed, dismissed]).toEqual(['Pendente', 'Revisada', 'Dispensada']);
      expect([spam, inappropriate, harassment, other]).toEqual([
        'Spam',
        'Conteúdo inadequado',
        'Assédio',
        'Outro motivo'
      ]);
    });
  });
});
