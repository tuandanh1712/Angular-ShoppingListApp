import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
// import { Actions, ofType, Effect } from '@ngrx/effects'; // Effect is not supported by recent versions of NgRx
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, catchError, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import * as AuthActions from './auth.actions';
import { User } from '../user.model';
import { AuthService } from '../auth.service';

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}
const handleAuthentication = (
  expiresIn: number,
  email: string,
  userId: string,
  token: string
) => {
  const expirationDate = new Date(new Date().getTime() + +expiresIn);
  const user = new User(email, userId, token, expirationDate);
  localStorage.setItem('userData', JSON.stringify(user));
  return new AuthActions.AuthenticateSuccess({
    email: email,
    userId: userId,
    token: token,
    expirationDate: expirationDate,
    redirect: true,
  });
};
const handleError = (errorRes: any) => {
  let errorMessage = 'An unknown error occurred!';
  if (!errorRes.error || !errorRes.error.error) {
    return of(new AuthActions.Authenticate_Fail(errorMessage));
    // Alternative syntax:
    // return of(
    //   new AuthActions.loginFail({error: errorMessage})
    // );
  }
  switch (errorRes.error.error.message) {
    case 'EMAIL_EXISTS':
      errorMessage = 'This email exists already';
      break;
    case 'EMAIL_NOT_FOUND':
      errorMessage = 'This email does not exist.';
      break;
    case 'INVALID_PASSWORD':
      errorMessage = 'This password is not correct.';
      break;
  }
  return of(new AuthActions.Authenticate_Fail(errorMessage));
};
@Injectable()
export class AuthEffects {
  authSignup = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.SIGNUP_START),
      // Alternative syntax:
      // ofType(AuthActions.loginStart),
      switchMap((signupAction: AuthActions.SignupStart) => {
        return this.http
          .post<AuthResponseData>(
            'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=' +
              environment.firebaseAPIKey,
            {
              email: signupAction.payload.email,
              password: signupAction.payload.password,
              returnSecureToken: true,
            }
          )
          .pipe(
            tap((resData) => {
              this.authService.setLogoutTimer(+resData.expiresIn * 1000);
            }),
            map((resData) => {
              return handleAuthentication(
                +resData.expiresIn,
                resData.email,
                resData.localId,
                resData.idToken
              );
              // Alternative syntax:
              // return new AuthActions.login({
              //   email: resData.email,
              //   userId: resData.localId,
              //   token: resData.idToken,
              //   expirationDate: expirationDate
              // });
            }),
            catchError((errorRes) => {
              return handleError(errorRes);
              // Alternative syntax:
              // return of(
              //   new AuthActions.loginFail({error: errorMessage})
              // );
            })
          );
      })
    )
  );

  authLogin = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.LOGIN_START),
      // Alternative syntax:
      // ofType(AuthActions.loginStart),
      switchMap((authData: AuthActions.LoginStart) => {
        return this.http
          .post<AuthResponseData>(
            'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=' +
              environment.firebaseAPIKey,
            {
              email: authData.payload.email,
              password: authData.payload.password,
              returnSecureToken: true,
            }
            // Alternative syntax:
            // {
            //   email: authData.email,
            //   password: authData.password,
            //   returnSecureToken: true
            // }
          )
          .pipe(
            tap((resData) => {
              this.authService.setLogoutTimer(+resData.expiresIn * 1000);
            }),
            map((resData) => {
              // Alternative syntax:
              // return new AuthActions.login({
              //   email: resData.email,
              //   userId: resData.localId,
              //   token: resData.idToken,
              //   expirationDate: expirationDate
              // });
              return handleAuthentication(
                +resData.expiresIn,
                resData.email,
                resData.localId,
                resData.idToken
              );
            }),
            catchError((errorRes) => {
              return handleError(errorRes);
              // Alternative syntax:
              // return of(
              //   new AuthActions.loginFail({error: errorMessage})
              // );
            })
          );
      })
    )
  );

  authRedirect = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.AUTHENTICATE_SUCCESS),
        tap((authSuccessAction: AuthActions.AuthenticateSuccess) => {
          if (authSuccessAction.payload.redirect) {
            this.router.navigate(['/']);
          }
        })
      ),
    { dispatch: false }
  );
  authLogout = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.LOGOUT),
        tap(() => {
          this.authService.clearLogoutTimer();
          localStorage.removeItem('user');
          this.router.navigate(['/auth']);
        })
      ),
    { dispatch: false }
  );
  autoLogin = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.AUTO_LOGIN),
      map(() => {
        const userData: {
          email: string;
          id: string;
          _token: string;
          _tokenExpirationDate: string;
        } = JSON.parse(localStorage.getItem('userData'));
        if (!userData) {
          return { type: 'DUMMY' };
        }

        const loadedUser = new User(
          userData.email,
          userData.id,
          userData._token,
          new Date(userData._tokenExpirationDate)
        );

        if (loadedUser.token) {
          // this.user.next(loadedUser);
          const expirationDuration =
            new Date(userData._tokenExpirationDate).getTime() -
            new Date().getTime();
          this.authService.setLogoutTimer(expirationDuration * 1000);
          return new AuthActions.AuthenticateSuccess({
            email: loadedUser.email,
            userId: loadedUser.id,
            token: loadedUser.token,
            expirationDate: new Date(userData._tokenExpirationDate),
            redirect: false,
          });

          // Alternative syntax:
          // this.store.dispatch(
          //   AuthActions.login({
          //     email: loadedUser.email,
          //     userId: loadedUser.id,
          //     token: loadedUser.token,
          //     expirationDate: new Date(userData._tokenExpirationDate),
          //   })
          // );
          // const expirationDuration =
          //   new Date(userData._tokenExpirationDate).getTime() -
          //   new Date().getTime();
          // this.autoLogout(expirationDuration);
        }
        return { type: 'DUMMY' };
      })
    )
  );
  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}
}

// Old syntax:
// Using @Effect() (which is not supported by recent NgRx versions).
// @Injectable()
// export class AuthEffects {
//   @Effect()
//   authLogin = this.actions$.pipe(
//     ofType(AuthActions.LOGIN_START),
//     switchMap((authData: AuthActions.LoginStart) => {
//       return this.http
//         .post<AuthResponseData>(
//           'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=' +
//             environment.firebaseAPIKey,
//           {
//             email: authData.payload.email,
//             password: authData.payload.password,
//             returnSecureToken: true
//           }
//         )
//         .pipe(
//           map(resData => {
//             const expirationDate = new Date(
//               new Date().getTime() + +resData.expiresIn * 1000
//             );
//             return new AuthActions.Login({
//               email: resData.email,
//               userId: resData.localId,
//               token: resData.idToken,
//               expirationDate: expirationDate
//             });
//           }),
//           catchError(errorRes => {
//             let errorMessage = 'An unknown error occurred!';
//             if (!errorRes.error || !errorRes.error.error) {
//               return of(new AuthActions.LoginFail(errorMessage));
//             }
//             switch (errorRes.error.error.message) {
//               case 'EMAIL_EXISTS':
//                 errorMessage = 'This email exists already';
//                 break;
//               case 'EMAIL_NOT_FOUND':
//                 errorMessage = 'This email does not exist.';
//                 break;
//               case 'INVALID_PASSWORD':
//                 errorMessage = 'This password is not correct.';
//                 break;
//             }
//             return of(new AuthActions.LoginFail(errorMessage));
//           })
//         );
//     })
//   );

//   @Effect({ dispatch: false })
//   authSuccess = this.actions$.pipe(
//     ofType(AuthActions.LOGIN),
//     tap(() => {
//       this.router.navigate(['/']);
//     })
//   );

//   constructor(
//     private actions$: Actions,
//     private http: HttpClient,
//     private router: Router
//   ) {}
// }
