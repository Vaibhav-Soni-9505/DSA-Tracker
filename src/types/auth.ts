export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface AuthResponse {
  success: true;
  data: {
    token?: string;
    user: AuthUser;
  };
}
