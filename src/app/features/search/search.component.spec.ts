import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { AlbumResponse, ConversationResponse, HolderResponse, Page, StickerResponse } from '../../core/api/api.types';
import { ReportUserDialogComponent, SearchComponent } from './search.component';

const album: AlbumResponse = {
  id: 'album-1',
  name: 'World Cup',
  description: null,
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
  description: null,
  active: true,
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z'
};

const holder: HolderResponse = {
  userId: 'holder-1',
  nickname: 'Ana',
  city: 'Rio',
  state: 'RJ',
  quantity: 2,
  isPotentialMatch: true,
  lastActivityAt: '2026-01-01T10:00:00Z'
};

const conversation: ConversationResponse = {
  conversationId: 'conversation-1',
  otherUserId: 'holder-1',
  otherNickname: 'Ana',
  stickerId: 'sticker-1',
  stickerNumber: '001',
  stickerName: 'Mascote',
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z'
};

function page<T>(content: T[], patch: Partial<Page<T>> = {}): Page<T> {
  return { content, totalElements: content.length, totalPages: 1, size: 10, number: 0, ...patch };
}

function routeWithQuery(params: Record<string, string>) {
  return {
    snapshot: {
      queryParamMap: convertToParamMap(params)
    }
  };
}

describe('SearchComponent', () => {
  let api: jasmine.SpyObj<ApiService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let router: jasmine.SpyObj<Router>;
  let component: SearchComponent;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'albums',
      'blockUser',
      'expressInterest',
      'holders',
      'reportUser',
      'stickers'
    ]);
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    api.albums.and.returnValue(of(page([album])));
    api.stickers.and.returnValue(of(page([sticker])));
    api.holders.and.returnValue(of(page([holder], { size: 20 })));
    api.expressInterest.and.returnValue(of(conversation));
    api.blockUser.and.returnValue(of(void 0));
    api.reportUser.and.returnValue(of({
      reportId: 'report-1',
      reporterId: 'user-1',
      reportedId: 'holder-1',
      reason: 'OTHER',
      description: null,
      status: 'PENDING',
      createdAt: '2026-01-01T10:00:00Z'
    }));

    TestBed.configureTestingModule({});
    component = TestBed.runInInjectionContext(
      () => new SearchComponent(api, dialog, router, routeWithQuery({ albumId: 'album-1', stickerId: 'sticker-1', q: '001' }) as never)
    );
  });

  describe('Dado parâmetros iniciais de busca', () => {
    it('Então carrega álbuns, figurinhas e titulares do sticker inicial', fakeAsync(() => {
      // Arrange

      // Act
      component.ngOnInit();
      tick();

      // Assert
      expect(component.stickerQueryControl.value).toBe('001');
      expect(component.selectedAlbumId()).toBe('album-1');
      expect(component.selectedStickerId()).toBe('sticker-1');
      expect(component.selectedStickerTitle()).toBe('#001 - Mascote');
      expect(component.holders()).toEqual([holder]);
      expect(component.searched()).toBeTrue();
    }));

    it('Então mudança de query limpa seleção e recarrega figurinhas', fakeAsync(() => {
      // Arrange
      component.ngOnInit();
      api.stickers.calls.reset();

      // Act
      component.stickerQueryControl.setValue('taça');
      tick(250);

      // Assert
      expect(component.selectedStickerId()).toBe('');
      expect(component.selectedStickerLabel()).toBe('');
      expect(component.holders()).toEqual([]);
      expect(component.searched()).toBeFalse();
      expect(api.stickers).toHaveBeenCalledWith('album-1', { q: 'taça', page: 0, size: 10 });
    }));
  });

  describe('Dado seleção e paginação', () => {
    it('Então selectAlbum sem sticker inicial limpa holders e carrega figurinhas', () => {
      // Arrange

      // Act
      component.selectAlbum('album-2');

      // Assert
      expect(component.selectedAlbumId()).toBe('album-2');
      expect(component.selectedStickerId()).toBe('');
      expect(api.stickers).toHaveBeenCalledWith('album-2', { q: '', page: 0, size: 10 });
    });

    it('Então selectSticker define label e carrega titulares', fakeAsync(() => {
      // Arrange
      component.selectAlbum('album-1');

      // Act
      component.selectSticker(sticker);
      tick();

      // Assert
      expect(component.selectedStickerId()).toBe('sticker-1');
      expect(component.selectedStickerTitle()).toBe('#001 - Mascote');
      expect(api.holders).toHaveBeenCalledWith('album-1', 'sticker-1', 0, 20);
    }));

    it('Então pagina figurinhas mantendo seleção e pagina titulares', fakeAsync(() => {
      // Arrange
      component.selectAlbum('album-1', 'sticker-1');
      api.stickers.calls.reset();
      api.holders.calls.reset();

      // Act
      component.pageStickers({ pageIndex: 2, pageSize: 25 } as PageEvent);
      component.pageHolders({ pageIndex: 3, pageSize: 50 } as PageEvent);
      tick();

      // Assert
      expect(api.stickers).toHaveBeenCalledWith('album-1', { q: '', page: 2, size: 25 });
      expect(api.holders).toHaveBeenCalledWith('album-1', 'sticker-1', 3, 50);
    }));

    it('Então selectedStickerTitle usa sticker da página ou fallback genérico', () => {
      // Arrange
      component.stickers.set([sticker]);
      component.selectedStickerId.set('sticker-1');

      // Act
      const found = component.selectedStickerTitle();
      component.selectedStickerId.set('missing');
      const fallback = component.selectedStickerTitle();

      // Assert
      expect(found).toBe('#001 - Mascote');
      expect(fallback).toBe('Figurinha selecionada');
    });
  });

  describe('Dado ações com titulares', () => {
    it('Então expressa interesse e navega para conversa', () => {
      // Arrange
      component.selectedStickerId.set('sticker-1');

      // Act
      component.interest(holder);

      // Assert
      expect(api.expressInterest).toHaveBeenCalledOnceWith('sticker-1', 'holder-1');
      expect(router.navigate).toHaveBeenCalledOnceWith(['/chats', 'conversation-1']);
    });

    it('Então ignora interesse sem sticker selecionado', () => {
      // Arrange
      component.selectedStickerId.set('');

      // Act
      component.interest(holder);

      // Assert
      expect(api.expressInterest).not.toHaveBeenCalled();
    });

    it('Então bloqueia usuário e recarrega holders da página atual', () => {
      // Arrange
      component.selectedAlbumId.set('album-1');
      component.selectedStickerId.set('sticker-1');
      component.holderPageIndex.set(2);

      // Act
      component.block('holder-1');

      // Assert
      expect(api.blockUser).toHaveBeenCalledOnceWith('holder-1');
      expect(api.holders).toHaveBeenCalledWith('album-1', 'sticker-1', 2, 20);
    });

    it('Então envia denúncia quando modal retorna motivo', () => {
      // Arrange
      dialog.open.and.returnValue({
        afterClosed: () => of({ reason: 'SPAM', description: 'spam' })
      } as never);

      // Act
      component.report('holder-1');

      // Assert
      expect(dialog.open).toHaveBeenCalled();
      expect(api.reportUser).toHaveBeenCalledOnceWith('holder-1', 'SPAM', 'spam');
    });

    it('Então não envia denúncia quando modal fecha sem resultado', () => {
      // Arrange
      dialog.open.and.returnValue({ afterClosed: () => of(undefined) } as never);

      // Act
      component.report('holder-1');

      // Assert
      expect(api.reportUser).not.toHaveBeenCalled();
    });
  });
});

describe('ReportUserDialogComponent', () => {
  describe('Dado formulário de denúncia', () => {
    it('Então close retorna motivo e descrição normalizada', () => {
      // Arrange
      const dialogRef = jasmine.createSpyObj<MatDialogRef<ReportUserDialogComponent>>('MatDialogRef', ['close']);
      TestBed.configureTestingModule({
        providers: [
          FormBuilder,
          { provide: MAT_DIALOG_DATA, useValue: { userId: 'holder-1' } },
          { provide: MatDialogRef, useValue: dialogRef }
        ]
      });
      const component = TestBed.runInInjectionContext(() => new ReportUserDialogComponent());
      component.form.setValue({ reason: 'HARASSMENT', description: '  texto  ' });

      // Act
      component.close();

      // Assert
      expect(component.data).toEqual({ userId: 'holder-1' });
      expect(component.reasons.map((reason) => reason.value)).toEqual(['SPAM', 'INAPPROPRIATE_CONTENT', 'HARASSMENT', 'OTHER']);
      expect(dialogRef.close).toHaveBeenCalledOnceWith({ reason: 'HARASSMENT', description: 'texto' });
    });

    it('Então close envia description null quando texto está vazio', () => {
      // Arrange
      const dialogRef = jasmine.createSpyObj<MatDialogRef<ReportUserDialogComponent>>('MatDialogRef', ['close']);
      TestBed.configureTestingModule({
        providers: [
          FormBuilder,
          { provide: MAT_DIALOG_DATA, useValue: { userId: 'holder-1' } },
          { provide: MatDialogRef, useValue: dialogRef }
        ]
      });
      const component = TestBed.runInInjectionContext(() => new ReportUserDialogComponent());
      component.form.setValue({ reason: 'OTHER', description: '   ' });

      // Act
      component.close();

      // Assert
      expect(dialogRef.close).toHaveBeenCalledOnceWith({ reason: 'OTHER', description: null });
    });
  });
});
