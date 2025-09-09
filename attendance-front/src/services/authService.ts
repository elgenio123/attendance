import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  user_type: 'teacher' | 'student';
  registration_number?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    name: string;
    email: string;
    user_type: 'teacher' | 'student';
    registration_number?: string;
    created_at: string;
    updated_at: string;
  };
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async refresh(): Promise<AuthResponse> {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  async me(): Promise<AuthResponse['user']> {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
