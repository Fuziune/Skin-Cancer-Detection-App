import { API_URL } from '../config';
import { Platform } from 'react-native';

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

interface ErrorResponse {
  detail: {
    message: string;
    error: string;
  };
}

class AuthService {
  static async login(email: string, password: string): Promise<LoginResponse> {
    console.log('AuthService: login called with email:', email);
    try {
      let body;
      let headers;

      if (Platform.OS === 'web') {
        // For web, use URLSearchParams
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        body = params.toString();
        headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        };
      } else {
        // For native, use FormData
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        body = formData;
        headers = {
          'Accept': 'application/json',
        };
      }

      console.log('AuthService: Making API request to:', `${API_URL}/auth/login`);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers,
        body,
        credentials: 'omit', // Don't include credentials to avoid CORS issues
        mode: 'cors', // Enable CORS
      });

      console.log('AuthService: Response status:', response.status);
      const data = await response.json();
      console.log('AuthService: Response data:', data);

      if (!response.ok) {
        console.log('AuthService: Request failed with status:', response.status);
        if (response.status === 401) {
          const errorMessage = data.detail?.message || 'Invalid email or password';
          console.log('AuthService: Throwing 401 error:', errorMessage);
          throw new Error(errorMessage);
        }
        throw new Error(data.detail?.message || 'Login failed');
      }

      console.log('AuthService: Login successful');
      return data;
    } catch (error: any) {
      console.log('AuthService: Error caught:', error);
      if (error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
      throw error;
    }
  }

  static async register(email: string, password: string, name: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.detail.message);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  }
}

export default AuthService; 