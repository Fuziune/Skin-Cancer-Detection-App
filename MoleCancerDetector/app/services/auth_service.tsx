import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  private baseUrl: string;
  private readonly TIMEOUT = 10000; // 10 seconds timeout

  constructor() {
    // Using the correct IP address
    this.baseUrl = "http://172.20.10.4:8001/auth";
  }

  async initialize() {
    // No need for health check, just log the base URL
    console.log('Auth Service initialized with base URL:', this.baseUrl);
  }

  async login(email: string, password: string) {
    console.log('AuthService: login called with email:', email);
    try {
      // Create form data
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      console.log('AuthService: Making API request to:', `${this.baseUrl}/login`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);
      
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login failed with status:', response.status);
        console.error('Error response:', errorText);
        throw new Error(`Login failed: ${errorText || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('AuthService: Login successful');
      return data;
    } catch (error: any) {
      console.error('AuthService: Error caught:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your network connection and try again.');
      }
      throw error;
    }
  }

  async register(email: string, password: string, name: string) {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await AsyncStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
}

export default new AuthService(); 