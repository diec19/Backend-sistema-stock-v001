export interface LoginDTO {
  username: string;
  password: string;
}

export interface RegisterDTO {
  username: string;
  password: string;
  name: string;
  role?: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}