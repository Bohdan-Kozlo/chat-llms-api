export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface UserData {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface AuthResult extends UserData {
  token: string;
}

export interface RequestUser {
  id: string;
  email: string;
}
