import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import {
  AlbumResponse,
  CollectionStickerResponse,
  Page,
  RepeatedStickerResponse,
  StickerResponse,
  WantedStickerResponse
} from '../../core/api/api.types';
import { CollectionComponent } from './collection.component';

const album: AlbumResponse = {
  id: 'album-1',
  name: 'World Cup',
  description: null,
  year: 2026,
  active: true,
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z'
};

const item: CollectionStickerResponse = {
  stickerId: 'sticker-1',
  code: '001',
  name: 'Mascote',
  description: null,
  repeatedQuantity: 1,
  wanted: true,
  warning: null
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

function page<T>(content: T[], patch: Partial<Page<T>> = {}): Page<T> {
  return { content, totalElements: content.length, totalPages: 1, size: 25, number: 0, ...patch };
}

describe('CollectionComponent', () => {
  let api: jasmine.SpyObj<ApiService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let component: CollectionComponent;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'albums',
      'collection',
      'deleteWanted',
      'setRepeated',
      'setWanted',
      'stickers'
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    api.albums.and.returnValue(of(page([album])));
    api.collection.and.returnValue(of(page([item])));
    api.setRepeated.and.returnValue(of({ id: 'r1', stickerId: 'sticker-1', stickerNumber: '001', stickerName: 'Mascote', quantity: 2, warning: 'Conflito' } as RepeatedStickerResponse));
    api.setWanted.and.returnValue(of({ id: 'w1', stickerId: 'sticker-1', stickerNumber: '001', stickerName: 'Mascote', warning: 'Conflito' } as WantedStickerResponse));
    api.deleteWanted.and.returnValue(of(void 0));
    api.stickers.and.returnValue(of(page([sticker])));

    TestBed.configureTestingModule({});
    component = TestBed.runInInjectionContext(() => new CollectionComponent(api, router, snackBar));
  });

  describe('Dado a tela de coleção', () => {
    it('Então carrega álbuns, seleciona o primeiro e carrega coleção', () => {
      // Arrange

      // Act
      component.ngOnInit();

      // Assert
      expect(api.albums).toHaveBeenCalledOnceWith(0, 100);
      expect(component.albums()).toEqual([album]);
      expect(component.selectedAlbumId()).toBe('album-1');
      expect(component.collection()).toEqual([item]);
      expect(component.loading()).toBeFalse();
    });

    it('Então selectAlbum limpa coleção e carrega a primeira página', () => {
      // Arrange
      component.collection.set([item]);

      // Act
      component.selectAlbum('album-2');

      // Assert
      expect(component.selectedAlbumId()).toBe('album-2');
      expect(api.collection).toHaveBeenCalledWith('album-2', {
        q: '',
        filter: 'ALL',
        page: 0,
        size: 25
      });
    });

    it('Então filtro, paginação e busca recarregam coleção', fakeAsync(() => {
      // Arrange
      component.ngOnInit();
      api.collection.calls.reset();

      // Act
      component.setFilter('WANTED');
      component.page({ pageIndex: 2, pageSize: 50 } as PageEvent);
      component.queryControl.setValue('mascote');
      tick(250);

      // Assert
      expect(api.collection).toHaveBeenCalledWith('album-1', { q: '', filter: 'WANTED', page: 0, size: 25 });
      expect(api.collection).toHaveBeenCalledWith('album-1', { q: '', filter: 'WANTED', page: 2, size: 50 });
      expect(api.collection).toHaveBeenCalledWith('album-1', { q: 'mascote', filter: 'WANTED', page: 0, size: 50 });
    }));
  });

  describe('Dado edição de repetidas e faltantes', () => {
    it('Então setQuantity atualiza item local quando filtro permite manter a linha', () => {
      // Arrange
      component.collection.set([item]);

      // Act
      component.setQuantity(item, '2');

      // Assert
      expect(api.setRepeated).toHaveBeenCalledOnceWith('sticker-1', 2);
      expect(component.collection()[0]).toEqual(jasmine.objectContaining({ repeatedQuantity: 2, warning: 'Conflito' }));
    });

    it('Então setQuantity recarrega quando filtro atual remove quantidade zero', () => {
      // Arrange
      component.selectAlbum('album-1');
      api.collection.calls.reset();
      component.filter.set('REPEATED');

      // Act
      component.setQuantity(item, -1);

      // Assert
      expect(api.setRepeated).toHaveBeenCalledWith('sticker-1', 0);
      expect(api.collection).toHaveBeenCalled();
    });

    it('Então toggleWanted marcado atualiza item local fora do filtro de conflito', () => {
      // Arrange
      const notWanted = { ...item, wanted: false, repeatedQuantity: 1 };
      component.collection.set([notWanted]);

      // Act
      component.toggleWanted(notWanted, true);

      // Assert
      expect(api.setWanted).toHaveBeenCalledOnceWith('sticker-1');
      expect(component.collection()[0]).toEqual(jasmine.objectContaining({ wanted: true, warning: 'Conflito' }));
    });

    it('Então toggleWanted marcado recarrega quando filtro é conflito', () => {
      // Arrange
      component.selectAlbum('album-1');
      api.collection.calls.reset();
      component.filter.set('CONFLICT');

      // Act
      component.toggleWanted(item, true);

      // Assert
      expect(api.collection).toHaveBeenCalled();
    });

    it('Então toggleWanted desmarcado atualiza item local fora dos filtros de remoção', () => {
      // Arrange
      component.collection.set([item]);

      // Act
      component.toggleWanted(item, false);

      // Assert
      expect(api.deleteWanted).toHaveBeenCalledOnceWith('sticker-1');
      expect(component.collection()[0]).toEqual(jasmine.objectContaining({ wanted: false, warning: null }));
    });

    it('Então toggleWanted desmarcado recarrega nos filtros wanted e conflict', () => {
      // Arrange
      component.selectAlbum('album-1');
      api.collection.calls.reset();
      component.filter.set('WANTED');

      // Act
      component.toggleWanted(item, false);

      // Assert
      expect(api.collection).toHaveBeenCalled();
    });
  });

  describe('Dado entrada rápida de figurinha', () => {
    it('Então exibe erro quando entrada rápida está incompleta', () => {
      // Arrange
      component.selectedAlbumId.set('album-1');
      component.quickCodeControl.setValue('');
      component.quickQuantityControl.setValue(0);
      component.quickWantedControl.setValue(false);

      // Act
      component.saveQuickEntry();

      // Assert
      expect(snackBar.open).toHaveBeenCalledOnceWith('Informe código, quantidade ou faltante.', 'Fechar', { duration: 3500 });
      expect(api.stickers).not.toHaveBeenCalled();
    });

    it('Então exibe erro quando código não existe no álbum', () => {
      // Arrange
      api.stickers.and.returnValue(of(page([])));
      component.selectedAlbumId.set('album-1');
      component.quickCodeControl.setValue('999');
      component.quickQuantityControl.setValue(1);

      // Act
      component.saveQuickEntry();

      // Assert
      expect(snackBar.open).toHaveBeenCalledOnceWith('Figurinha não encontrada neste álbum.', 'Fechar', { duration: 3500 });
      expect(component.savingQuick()).toBeFalse();
    });

    it('Então registra repetida e faltante, reseta campos e recarrega coleção', () => {
      // Arrange
      component.selectedAlbumId.set('album-1');
      component.quickCodeControl.setValue('001');
      component.quickQuantityControl.setValue(2);
      component.quickWantedControl.setValue(true);
      api.collection.calls.reset();

      // Act
      component.saveQuickEntry();

      // Assert
      expect(api.stickers).toHaveBeenCalledWith('album-1', { q: '001', page: 0, size: 10 });
      expect(api.setRepeated).toHaveBeenCalledWith('sticker-1', 2);
      expect(api.setWanted).toHaveBeenCalledWith('sticker-1');
      expect(component.quickCodeControl.value).toBe('');
      expect(component.quickQuantityControl.value).toBe(1);
      expect(component.quickWantedControl.value).toBeFalse();
      expect(api.collection).toHaveBeenCalledWith('album-1', { q: '', filter: 'ALL', page: 0, size: 25 });
    });
  });

  describe('Dado busca de titulares', () => {
    it('Então navega para busca com album, sticker e código', () => {
      // Arrange
      component.selectedAlbumId.set('album-1');

      // Act
      component.findHolders(item);

      // Assert
      expect(router.navigate).toHaveBeenCalledOnceWith(['/search'], {
        queryParams: {
          albumId: 'album-1',
          stickerId: 'sticker-1',
          q: '001'
        }
      });
    });
  });
});
