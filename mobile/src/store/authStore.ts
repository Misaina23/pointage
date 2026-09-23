import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { authApi, personnelApi } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
}

interface Personnel {
  id: number;
  nom: string;
  prenom: string;
  direction_id: number;
  service: string;
  grade: string;
  corp: string;
  fonction: string;
  IM: string;
  email: string;
  photo?: string;
  qr_code: string;
  role: 'employee' | 'security';
  direction?: {
    id: number;
    nom: string;
    description: string;
  };
}

interface AuthState {
  user: User | null;
  personnel: Personnel | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  registerPersonnel: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updatePassword: (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  verifyEmail: (id: string, hash: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchPersonnelProfile: () => Promise<void>;
  fetchBadge: () => Promise<string>;
  clearError: () => void;
  setError: (error: string) => void;
}

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      personnel: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      initializeAuth: async () => {
        try {
          const token = await SecureStore.getItemAsync('auth_token');
          const userData = await SecureStore.getItemAsync('user_data');
          const personnelData = await SecureStore.getItemAsync('personnel_data');

          if (token && userData) {
            const user = JSON.parse(userData);
            const personnel = personnelData ? JSON.parse(personnelData) : null;
            
            set({ 
              token, 
              user, 
              personnel,
              isAuthenticated: true 
            });

            // Fetch fresh data
            try {
              await get().fetchUser();
              if (personnel) {
                await get().fetchPersonnelProfile();
              }
            } catch (error) {
              console.error('Failed to refresh auth data:', error);
            }
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
        }
      },

      login: async (email, password, remember = false) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(email, password, remember);
          const { user, token } = response.data;

          await SecureStore.setItemAsync('auth_token', token);
          await SecureStore.setItemAsync('user_data', JSON.stringify(user));

          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Identifiants invalides';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          const { user, token } = response.data;

          await SecureStore.setItemAsync('auth_token', token);
          await SecureStore.setItemAsync('user_data', JSON.stringify(user));

          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Erreur lors de la création';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      registerPersonnel: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          const { user, token } = response.data;

          await SecureStore.setItemAsync('auth_token', token);
          await SecureStore.setItemAsync('user_data', JSON.stringify(user));

          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Erreur lors de l\'inscription';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('user_data');
          await SecureStore.deleteItemAsync('personnel_data');
          set({ 
            user: null, 
            personnel: null, 
            token: null, 
            isAuthenticated: false 
          });
        }
      },

      updatePassword: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.updatePassword(data);
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.forgotPassword(email);
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Erreur lors de l\'envoi';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      resetPassword: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.resetPassword(data);
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Erreur lors de la réinitialisation';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      verifyEmail: async (id, hash) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.verifyEmail(id, hash);
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Lien invalide';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      sendEmailVerification: async () => {
        set({ isLoading: true, error: null });
        try {
          await authApi.sendEmailVerification();
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Erreur lors de l\'envoi';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      fetchUser: async () => {
        try {
          const response = await authApi.getUser();
          const user = response.data;
          await SecureStore.setItemAsync('user_data', JSON.stringify(user));
          set({ user });
        } catch (error) {
          console.error('Failed to fetch user:', error);
          throw error;
        }
      },

      fetchPersonnelProfile: async () => {
        try {
          const response = await personnelApi.getProfile();
          const personnel = response.data;
          await SecureStore.setItemAsync('personnel_data', JSON.stringify(personnel));
          set({ personnel });
        } catch (error) {
          console.error('Failed to fetch personnel profile:', error);
          throw error;
        }
      },

      fetchBadge: async () => {
        try {
          const response = await personnelApi.getBadge();
          return response.data.qr_code_svg;
        } catch (error) {
          console.error('Failed to fetch badge:', error);
          throw error;
        }
      },

      clearError: () => set({ error: null }),
      setError: (error: string) => set({ error }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        personnel: state.personnel,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);