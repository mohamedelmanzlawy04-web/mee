import React, { createContext, useContext, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetMe,
  useLogin,
  useLogout,
  useRegister,
  getGetMeQueryKey,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
} from '@workspace/api-client-react';
import { toast } from 'sonner';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetMe({
    query: {
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const registerMutation = useRegister();

  const login = useCallback(async (input: LoginInput) => {
    await loginMutation.mutateAsync(input);
    await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    toast.success('Welcome back');
  }, [loginMutation, queryClient]);

  const register = useCallback(async (input: RegisterInput) => {
    await registerMutation.mutateAsync(input);
    await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    toast.success('Account created');
  }, [registerMutation, queryClient]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    queryClient.setQueryData(getGetMeQueryKey(), null);
    await queryClient.invalidateQueries();
    toast.success('Signed out');
  }, [logoutMutation, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
