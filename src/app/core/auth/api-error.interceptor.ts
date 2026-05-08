import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../api/api.types';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const snackBar = inject(MatSnackBar);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!request.url.includes('assets/config.json')) {
        snackBar.open(errorMessage(error), 'Fechar', { duration: 6000 });
      }
      return throwError(() => error);
    })
  );
};

function errorMessage(error: HttpErrorResponse): string {
  const body = error.error as Partial<ApiError> | null;
  if (body?.fieldErrors?.length) {
    const firstError = body.fieldErrors[0];
    return `${firstError?.field}: ${firstError?.message}`;
  }
  if (body?.message) {
    return body.message;
  }
  if (error.status === 0) {
    return 'Não foi possível conectar ao servidor.';
  }
  return `Erro ${error.status}: ${error.statusText || 'falha inesperada'}`;
}
