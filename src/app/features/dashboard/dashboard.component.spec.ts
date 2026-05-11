import { AlbumResponse, ConversationResponse, MyProfileResponse, Page } from '../../core/api/api.types';
import { ApiService } from '../../core/api/api.service';
import { DashboardComponent } from './dashboard.component';
import { of } from 'rxjs';

const profile: MyProfileResponse = {
  userId: 'user-1',
  nickname: 'Niko',
  cep: null,
  city: 'São Paulo',
  state: 'SP',
  approximateLatitude: null,
  approximateLongitude: null,
  showCityStatePublicly: true,
  useLocationForSearch: true
};

const album: AlbumResponse = {
  id: 'album-1',
  name: 'World Cup',
  description: null,
  year: 2026,
  active: true,
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z'
};

const conversation: ConversationResponse = {
  conversationId: 'conversation-1',
  otherUserId: 'user-2',
  otherNickname: 'Ana',
  stickerId: 'sticker-1',
  stickerNumber: '001',
  stickerName: 'Mascote',
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-02T10:00:00Z'
};

function page<T>(content: T[]): Page<T> {
  return { content, totalElements: content.length, totalPages: 1, size: 10, number: 0 };
}

describe('DashboardComponent', () => {
  describe('Dado a tela inicial autenticada', () => {
    it('Então carrega perfil, álbuns e conversas em conjunto', () => {
      // Arrange
      const api = jasmine.createSpyObj<ApiService>('ApiService', ['albums', 'conversations', 'myProfile']);
      api.myProfile.and.returnValue(of(profile));
      api.albums.and.returnValue(of(page([album])));
      api.conversations.and.returnValue(of([conversation]));
      const component = new DashboardComponent(api);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.profile()).toEqual(profile);
      expect(component.albums()).toEqual([album]);
      expect(component.chats()).toEqual([conversation]);
    });
  });
});
