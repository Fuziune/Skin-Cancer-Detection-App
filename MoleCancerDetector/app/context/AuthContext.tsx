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
    let isMounted = true;

    const loadUser = async () => {
      if (!isMounted) return;

      try {
        const [userData, token] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('userToken')
        ]);

        if (!userData || !token) {
          if (isMounted) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        try {
          const parsedUser = JSON.parse(userData);
          if (isMounted) {
            setUser(parsedUser);
            setIsLoading(false);
          }
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('userToken');
          if (isMounted) {
            setUser(null);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await AuthService.login(email, password);
      
      if (response.access_token) {
        await AsyncStorage.setItem('userToken', response.access_token);
        const userData = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role
        };
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } else {
        throw new Error('No token received from server');
      }
    } catch (error: any) {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('AuthContext: signUp called');
      const response = await AuthService.register(email, password, name);
      
      if (response.access_token) {
        console.log('AuthContext: Registration successful, storing data...');
        const userData = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('userToken', response.access_token);
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
      await AsyncStorage.removeItem('userToken');
      setUser(null);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
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