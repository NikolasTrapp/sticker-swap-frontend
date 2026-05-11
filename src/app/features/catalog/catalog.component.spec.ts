import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PageEvent } from '@angular/material/paginator';
import { of } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { AlbumResponse, Page, StickerResponse } from '../../core/api/api.types';
import { CatalogComponent } from './catalog.component';

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

function page<T>(content: T[], patch: Partial<Page<T>> = {}): Page<T> {
  return { content, totalElements: content.length, totalPages: 1, size: 25, number: 0, ...patch };
}

describe('CatalogComponent', () => {
  let api: jasmine.SpyObj<ApiService>;
  let component: CatalogComponent;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['albums', 'stickers']);
    api.albums.and.returnValue(of(page([album])));
    api.stickers.and.returnValue(of(page([sticker])));

    TestBed.configureTestingModule({});
    component = TestBed.runInInjectionContext(() => new CatalogComponent(api));
  });

  describe('Dado a tela de catálogo', () => {
    it('Então carrega álbuns e seleciona o primeiro álbum disponível', () => {
      // Arrange

      // Act
      component.ngOnInit();

      // Assert
      expect(api.albums).toHaveBeenCalledOnceWith(0, 100);
      expect(component.albums()).toEqual([album]);
      expect(component.selectedAlbum()).toEqual(album);
      expect(component.stickers()).toEqual([sticker]);
    });

    it('Então não carrega figurinhas quando não existe álbum selecionado', () => {
      // Arrange

      // Act
      (component as unknown as { loadStickers: (pageIndex: number) => void }).loadStickers(0);

      // Assert
      expect(api.stickers).not.toHaveBeenCalled();
    });

    it('Então troca álbum e carrega figurinhas da página informada', () => {
      // Arrange
      const selected = { ...album, id: 'album-2', name: 'Second' };
      api.stickers.and.returnValue(of(page([sticker], { number: 2, size: 50, totalElements: 80 })));

      // Act
      component.selectAlbum(selected);
      component.page({ pageIndex: 2, pageSize: 50 } as PageEvent);

      // Assert
      expect(component.selectedAlbum()).toEqual(selected);
      expect(api.stickers).toHaveBeenCalledWith('album-2', { q: '', page: 2, size: 50 });
      expect(component.totalElements()).toBe(80);
      expect(component.pageIndex()).toBe(2);
      expect(component.pageSize()).toBe(50);
    });

    it('Então debounce de busca recarrega a primeira página', fakeAsync(() => {
      // Arrange
      component.ngOnInit();
      api.stickers.calls.reset();

      // Act
      component.queryControl.setValue('mascote');
      tick(250);

      // Assert
      expect(api.stickers).toHaveBeenCalledWith('album-1', { q: 'mascote', page: 0, size: 25 });
    }));
  });
});
