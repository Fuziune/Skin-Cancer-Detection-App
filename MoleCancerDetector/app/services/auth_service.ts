import axios from 'axios';

const API_URL = 'http://127.0.0.1:8001/auth';

class AuthService {
  async login(email: string, password: string) {
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post(`${API_URL}/login`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data.access_token) {
        return {
          ...response.data,
          email,
          name: response.data.name || email.split('@')[0],
          role: response.data.role || 'patient'
        };
      }
      throw new Error('Login failed: No access token received');
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Login failed. Please try again.');
    }
  }

  async register(email: string, password: string, name: string) {
    try {
      const requestData = {
        email,
        password,
        name,
      };
      
      console.log('Sending registration request with data:', requestData);
      
      const response = await axios.post(`${API_URL}/register`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Registration response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Registration error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        requestData: { email, name } // Don't log password
      });
      
      // Return a more detailed error message
      const errorMessage = error.response?.data?.detail || 
                          (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : 'Registration failed. Please try again.');
      throw new Error(errorMessage);
    }
  }
}

export default new AuthService(); 