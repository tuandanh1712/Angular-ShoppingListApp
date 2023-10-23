import { Action } from '@ngrx/store';

export const LOGIN_START = '[Auth] Login Start';
export const AUTHENTICATE_SUCCESS = '[Auth] Login';
export const AUTHENTICATE_FAIL = '[Auth] Login Fail';
export const SIGNUP_START = '[Auth] Signup Start';
export const CLEAR_ERROR = '[Auth] Clear Error';
export const AUTO_LOGIN = '[Auth] Auto Login';
export const SIGNUP = '[Auth] Signup';
export const LOGOUT = '[Auth] Logout';

export class AuthenticateSuccess implements Action {
  readonly type = AUTHENTICATE_SUCCESS;

  constructor(
    public payload: {
      email: string;
      userId: string;
      token: string;
      expirationDate: Date;
    }
  ) {}
}

export class Logout implements Action {
  readonly type = LOGOUT;
}

export class LoginStart implements Action {
  readonly type = LOGIN_START;

  constructor(public payload: { email: string; password: string }) {}
}

export class Authenticate_Fail implements Action {
  readonly type = AUTHENTICATE_FAIL;

  constructor(public payload: string) {}
}
export class SignupStart implements Action {
  readonly type = SIGNUP_START;

  constructor(public payload: { email: string; password: string }) {}
}
export class ClearError implements Action {
  readonly type = CLEAR_ERROR;
}
export class AutoLogin implements Action {
  readonly type = AUTO_LOGIN;
}

export type AuthActions =
  | AuthenticateSuccess
  | Logout
  | LoginStart
  | Authenticate_Fail
  | SignupStart
  | ClearError
  | AutoLogin;

// Alternative syntax:
// import { createAction, props } from '@ngrx/store';

// export const login = createAction(
//   '[Auth] Login',
//   props<{
//     email: string;
//     userId: string;
//     token: string;
//     expirationDate: Date;
//   }>()
// );

// export const logout = createAction('[Auth] Logout');

// export const loginStart = createAction(
//   '[Auth] Login Start',
//   props<{ email: string; password: string }>()
// );

// export const loginFail = createAction(
//   '[Auth] Login Fail',
//   props<{ error: string }>()
// );
