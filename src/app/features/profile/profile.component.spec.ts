import { DestroyRef } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { BlockedUserResponse, CepLookupResponse, MyProfileResponse, Page } from '../../core/api/api.types';
import { ProfileComponent } from './profile.component';
import { PublicProfileComponent } from './public-profile.component';
import { convertToParamMap } from '@angular/router';

const profile: MyProfileResponse = {
  userId: 'user-1',
  nickname: 'Niko',
  cep: '01310-100',
  city: 'São Paulo',
  state: 'SP',
  approximateLatitude: null,
  approximateLongitude: null,
  showCityStatePublicly: true,
  useLocationForSearch: false
};

const blockedUser: BlockedUserResponse = {
  userId: 'blocked-1',
  nickname: 'Bloqueado',
  city: 'Rio',
  state: 'RJ',
  blockedAt: '2026-01-01T10:00:00Z'
};

function page<T>(content: T[], patch: Partial<Page<T>> = {}): Page<T> {
  return { content, totalElements: content.length, totalPages: 1, size: 10, number: 0, ...patch };
}

function routeWithUser(userId: string | null) {
  return {
    snapshot: {
      paramMap: convertToParamMap(userId ? { userId } : {})
    }
  };
}

describe('ProfileComponent', () => {
  let api: jasmine.SpyObj<ApiService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let component: ProfileComponent;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'blockedUsers',
      'lookupCep',
      'myProfile',
      'unblockUser',
      'updateProfile'
    ]);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    api.myProfile.and.returnValue(of(profile));
    api.blockedUsers.and.returnValue(of(page([blockedUser])));
    api.lookupCep.and.returnValue(of({ cep: '01310100', city: 'São Paulo', state: 'SP', found: true }));
    api.updateProfile.and.returnValue(of(profile));
    api.unblockUser.and.returnValue(of(void 0));

    TestBed.configureTestingModule({});
    component = TestBed.runInInjectionContext(
      () => new ProfileComponent(api, new FormBuilder(), TestBed.inject(DestroyRef), snackBar)
    );
  });

  describe('Dado o perfil autenticado', () => {
    it('Então carrega perfil e usuários bloqueados ao montar', () => {
      // Arrange

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.getRawValue()).toEqual({
        nickname: 'Niko',
        cep: '01310-100',
        city: 'São Paulo',
        state: 'SP',
        showCityStatePublicly: true,
        useLocationForSearch: false
      });
      expect(component.blockedUsers()).toEqual([blockedUser]);
      expect(component.blockedTotalElements()).toBe(1);
    });

    it('Então salva payload normalizado quando formulário é válido', () => {
      // Arrange
      component.form.setValue({
        nickname: '  Nick  ',
        cep: '',
        city: '',
        state: 'sp',
        showCityStatePublicly: false,
        useLocationForSearch: true
      });

      // Act
      component.save();

      // Assert
      expect(api.updateProfile).toHaveBeenCalledOnceWith({
        nickname: 'Nick',
        cep: null,
        city: null,
        state: 'SP',
        showCityStatePublicly: false,
        useLocationForSearch: true
      });
      expect(component.saved()).toBeTrue();
      expect(component.saving()).toBeFalse();
    });

    it('Então não salva quando formulário está inválido', () => {
      // Arrange
      component.form.controls.cep.setValue('abc');

      // Act
      component.save();

      // Assert
      expect(api.updateProfile).not.toHaveBeenCalled();
      expect(component.form.touched).toBeTrue();
    });

    it('Então não salva enquanto lookup de CEP está carregando', () => {
      // Arrange
      component.cepLookupLoading.set(true);

      // Act
      component.save();

      // Assert
      expect(api.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('Dado busca automática de CEP', () => {
    it('Então preenche cidade e UF quando CEP é encontrado', fakeAsync(() => {
      // Arrange
      component.ngOnInit();

      // Act
      component.form.controls.cep.setValue('01310-100');
      tick(300);

      // Assert
      expect(api.lookupCep).toHaveBeenCalledWith('01310100');
      expect(component.form.controls.city.value).toBe('São Paulo');
      expect(component.form.controls.state.value).toBe('SP');
      expect(component.cepLookupResolved()).toBeTrue();
      expect(component.cepLookupLoading()).toBeFalse();
    }));

    it('Então marca cepNotFound quando backend não encontra CEP', fakeAsync(() => {
      // Arrange
      api.lookupCep.and.returnValue(of({ cep: '00000000', city: null, state: null, found: false } as CepLookupResponse));
      component.ngOnInit();

      // Act
      component.form.controls.cep.setValue('00000-000');
      tick(300);

      // Assert
      expect(component.form.controls.cep.hasError('cepNotFound')).toBeTrue();
      expect(component.cepLookupResolved()).toBeFalse();
    }));

    it('Então trata falha de lookup como resultado ausente', fakeAsync(() => {
      // Arrange
      api.lookupCep.and.returnValue(throwError(() => new Error('cep down')));
      component.ngOnInit();

      // Act
      component.form.controls.cep.setValue('01310-100');
      tick(300);

      // Assert
      expect(component.form.controls.cep.hasError('cepNotFound')).toBeFalse();
      expect(component.cepLookupResolved()).toBeFalse();
      expect(component.cepLookupLoading()).toBeFalse();
    }));

    it('Então limpa erro cepNotFound quando valor deixa de ter oito dígitos', fakeAsync(() => {
      // Arrange
      component.ngOnInit();
      component.form.controls.cep.setErrors({ cepNotFound: true });

      // Act
      component.form.controls.cep.setValue('123');
      tick(300);

      // Assert
      expect(component.form.controls.cep.hasError('cepNotFound')).toBeFalse();
      expect(api.lookupCep).not.toHaveBeenCalledWith('123');
    }));
  });

  describe('Dado usuários bloqueados', () => {
    it('Então pagina usuários bloqueados', () => {
      // Arrange

      // Act
      component.pageBlockedUsers({ pageIndex: 2, pageSize: 25 } as PageEvent);

      // Assert
      expect(api.blockedUsers).toHaveBeenCalledWith(2, 25);
      expect(component.blockedPageIndex()).toBe(0);
      expect(component.blockedPageSize()).toBe(10);
    });

    it('Então volta uma página quando página atual fica vazia', () => {
      // Arrange
      api.blockedUsers.and.returnValues(
        of(page([], { number: 1, size: 10, totalElements: 1 })),
        of(page([blockedUser], { number: 0, size: 10, totalElements: 1 }))
      );

      // Act
      component.pageBlockedUsers({ pageIndex: 1, pageSize: 10 } as PageEvent);

      // Assert
      expect(api.blockedUsers).toHaveBeenCalledWith(1, 10);
      expect(api.blockedUsers).toHaveBeenCalledWith(0, 10);
      expect(component.blockedPageIndex()).toBe(0);
    });

    it('Então desbloqueia usuário, mostra feedback e recarrega página atual', () => {
      // Arrange
      component.blockedPageIndex.set(3);

      // Act
      component.unblock(blockedUser);

      // Assert
      expect(api.unblockUser).toHaveBeenCalledOnceWith('blocked-1');
      expect(snackBar.open).toHaveBeenCalledOnceWith('Usuário desbloqueado.', 'Fechar', { duration: 3500 });
      expect(api.blockedUsers).toHaveBeenCalledWith(3, 10);
    });
  });
});

describe('PublicProfileComponent', () => {
  describe('Dado rota com userId', () => {
    it('Então carrega perfil público', () => {
      // Arrange
      const api = jasmine.createSpyObj<ApiService>('ApiService', ['publicProfile']);
      api.publicProfile.and.returnValue(of({ userId: 'user-2', nickname: 'Ana', city: 'Rio', state: 'RJ' }));
      const component = new PublicProfileComponent(api, routeWithUser('user-2') as never);

      // Act
      component.ngOnInit();

      // Assert
      expect(api.publicProfile).toHaveBeenCalledOnceWith('user-2');
      expect(component.profile()).toEqual({ userId: 'user-2', nickname: 'Ana', city: 'Rio', state: 'RJ' });
    });
  });

  describe('Dado rota sem userId', () => {
    it('Então não chama API pública', () => {
      // Arrange
      const api = jasmine.createSpyObj<ApiService>('ApiService', ['publicProfile']);
      const component = new PublicProfileComponent(api, routeWithUser(null) as never);

      // Act
      component.ngOnInit();

      // Assert
      expect(api.publicProfile).not.toHaveBeenCalled();
    });
  });
});
