import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService, AuthResponse } from '../services/authService';

interface User {
  id: number;
  name: string;
  email: string;
  user_type: 'teacher' | 'student';
  registration_number?: string;
  token: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { name: string; email: string; password: string; password_confirmation: string; user_type: 'teacher' | 'student'; registration_number?: string }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const initialState: AuthState = (() => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      return { user: parsed, isLoading: false, error: null } as AuthState;
    }
  } catch (e) {
    // ignore
  }
  return { user: null, isLoading: false, error: null } as AuthState;
})();

type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, isLoading: false, user: action.payload, error: null };
    case 'LOGIN_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set token in localStorage
  /*useEffect(() => {
    if (state.user?.token) {
      localStorage.setItem('token', state.user.token);
      localStorage.setItem('user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [state.user]);*/

  // removed async rehydration; we sync-read from localStorage in initialState

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.login({ email, password });
      const user: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        user_type: response.user.user_type,
        registration_number: response.user.registration_number,
        token: response.access_token
      };
      console.log(user)
      localStorage.setItem('token', user.token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
    }
  }, []);

  const register = useCallback(async (userData: { name: string; email: string; password: string; password_confirmation: string; user_type: 'teacher' | 'student'; registration_number?: string }) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.register(userData);
      const user: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        user_type: response.user.user_type,
        registration_number: response.user.registration_number,
        token: response.access_token
      };
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};