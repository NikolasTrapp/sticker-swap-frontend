import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../api/api.types';

const FIELD_LABELS: Record<string, string> = {
  email: 'E-mail',
  password: 'Senha',
  newPassword: 'Nova senha',
  token: 'Link',
  name: 'Nome',
  code: 'Código',
  description: 'Descrição',
  cep: 'CEP',
  city: 'Cidade',
  state: 'UF',
  quantity: 'Quantidade',
  holderId: 'Colecionador'
};

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const snackBar = inject(MatSnackBar);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!request.url.includes('assets/config.json')) {
        snackBar.open(errorMessage(error, request.url), 'Fechar', { duration: 6000 });
      }
      return throwError(() => error);
    })
  );
};

function errorMessage(error: HttpErrorResponse, url: string): string {
  const body = error.error as Partial<ApiError> | null;
  const path = `${url} ${body?.path ?? ''}`;

  if (error.status === 0) {
    return 'Não foi possível conectar ao servidor.';
  }

  if (body?.fieldErrors?.length) {
    const firstError = body.fieldErrors[0];
    const field = FIELD_LABELS[firstError?.field ?? ''] ?? 'Campo';
    return `${field}: ${friendlyValidation(firstError?.message)}`;
  }

  if (path.includes('/oauth2/login') && error.status === 401) {
    return 'E-mail ou senha incorretos.';
  }

  if (path.includes('/auth/register') && error.status === 409) {
    return 'Este e-mail já está cadastrado.';
  }

  if (path.includes('/auth/email-confirmations')) {
    return 'Este link de confirmação expirou ou já foi usado.';
  }

  if (path.includes('/auth/password-resets')) {
    return 'Este link de recuperação expirou ou já foi usado.';
  }

  if (error.status === 401) {
    return 'Sua sessão expirou. Entre novamente.';
  }

  if (error.status === 403) {
    return 'Você não tem permissão para acessar esta área.';
  }

  if (error.status === 404) {
    return 'Não encontramos esse recurso.';
  }

  if (error.status === 409) {
    return friendlyBodyMessage(body?.message) ?? 'Não foi possível concluir porque já existe um registro parecido.';
  }

  if (error.status === 422) {
    return friendlyBodyMessage(body?.message) ?? 'Revise as informações e tente novamente.';
  }

  if (error.status === 429) {
    return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  }

  if (error.status >= 500) {
    return 'Tivemos um problema inesperado. Tente novamente em instantes.';
  }

  return friendlyBodyMessage(body?.message) ?? 'Não foi possível concluir a ação. Tente novamente.';
}

function friendlyValidation(message?: string | null): string {
  if (!message) {
    return 'revise este campo.';
  }
  const normalized = message.toLowerCase();
  if (normalized.includes('must be a well-formed email')) {
    return 'informe um e-mail válido.';
  }
  if (normalized.includes('brazilian zip code')) {
    return 'informe um CEP com 8 dígitos.';
  }
  if (normalized.includes('must not be blank') || normalized.includes('required')) {
    return 'preencha este campo.';
  }
  if (normalized.includes('size must be between')) {
    return 'confira o tamanho informado.';
  }
  if (normalized.includes('must match')) {
    return 'use o formato esperado.';
  }
  return message;
}

function friendlyBodyMessage(message?: string | null): string | null {
  if (!message) {
    return null;
  }
  const normalized = message.toLowerCase();
  if (normalized.includes('bad credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (normalized.includes('invalid or expired token')) {
    return 'Este link expirou ou já foi usado.';
  }
  if (normalized.includes('quantity must be zero or positive')) {
    return 'A quantidade não pode ser negativa.';
  }
  if (normalized.includes('album is not active')) {
    return 'Este álbum não está disponível no momento.';
  }
  if (normalized.includes('sticker code already exists')) {
    return 'Já existe uma figurinha com esse código neste álbum.';
  }
  if (normalized.includes('account is inactive')) {
    return 'Esta conta está inativa.';
  }
  if (normalized.includes('email already registered')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (normalized.includes('cep não encontrado')) {
    return 'Não encontramos esse CEP.';
  }
  if (normalized.includes('validation failed')) {
    return 'Revise os campos destacados e tente novamente.';
  }
  if (normalized.includes('no resource at')) {
    return 'Não encontramos esse recurso.';
  }
  if (normalized.includes('unauthorized')) {
    return 'Sua sessão expirou. Entre novamente.';
  }
  if (normalized.includes('internal server error')) {
    return 'Tivemos um problema inesperado. Tente novamente em instantes.';
  }
  return message;
}
