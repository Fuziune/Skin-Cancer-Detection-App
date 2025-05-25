import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import AuthService from '../services/auth_service';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: signIn called');
      const response = await AuthService.login(email, password);
      console.log('AuthContext: Login response received');
      
      if (response.access_token) {
        console.log('AuthContext: Token received, storing...');
        await AsyncStorage.setItem('userToken', response.access_token);
        setUser(response.user);
        console.log('AuthContext: User state updated');
      } else {
        console.log('AuthContext: No token in response');
        throw new Error('No token received from server');
      }
    } catch (error: any) {
      console.log('AuthContext: Error during sign in:', error.message);
      // Clear any existing token on failed login
      await AsyncStorage.removeItem('userToken');
      setUser(null);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('AuthContext: signUp called');
      const response: LoginResponse = await AuthService.register(email, password, name);
      
      if (response.access_token) {
        console.log('AuthContext: Registration successful, storing data...');
        const userData = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('token', response.access_token);
        setUser(userData);
        console.log('AuthContext: User data stored successfully');
      } else {
        console.log('AuthContext: No token in response');
        throw new Error('No token received from server');
      }
    } catch (error: any) {
      console.log('AuthContext: Error during sign up:', error.message);
      // Clear any existing data on error
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setUser(null);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setUser(null);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider; 