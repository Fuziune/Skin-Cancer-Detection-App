import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Diagnostic {
  id: number;
  image_url: string;
  result: string;
  confidence: number;
  created_at: string;
}

class DiagnosticService {
  private static instance: DiagnosticService;
  private baseUrl: string;
  private readonly TIMEOUT = 10000; // 10 seconds timeout

  private constructor() {
    // Using the computer's IP address for mobile devices
    this.baseUrl = "http://172.20.10.4:8001";
    console.log('DiagnosticService initialized with base URL:', this.baseUrl);
  }

  public static getInstance(): DiagnosticService {
    if (!DiagnosticService.instance) {
      DiagnosticService.instance = new DiagnosticService();
    }
    return DiagnosticService.instance;
  }

  public setBaseUrl(url: string) {
    console.log('Setting new base URL:', url);
    this.baseUrl = "http://172.20.10.4:8001";
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getAuthToken();
    return {
      "Accept": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  }

  private async convertImageToBase64(uri: string): Promise<string> {
    if (Platform.OS === 'web') {
      // For web platform
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = base64data.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error converting image to base64 on web:', error);
        throw error;
      }
    } else {
      // For native platforms
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
      } catch (error) {
        console.error('Error converting image to base64 on native:', error);
        throw error;
      }
    }
  }

  /**
   * Uploads the image to the server.
   * @param uri - The URI of the image.
   * @param userID - The user ID.
   */
  async uploadImage(uri: string, userID: number) {
    try {
      // Convert image to base64 using platform-specific method
      const base64 = await this.convertImageToBase64(uri);

      const headers = await this.getAuthHeaders();
      const requestHeaders = {
        ...headers,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      console.log('Making upload request to:', `${this.baseUrl}/post`);

      const response = await fetch(`${this.baseUrl}/post`, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          image_data: base64,
          user_id: userID
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
      }

      const data = await response.json();
      console.log("Upload success");
      return data;
    } catch (error: any) {
      console.error("Upload error:", error);
      if (error.message) {
        console.error("Error message:", error.message);
      }
      throw error;
    }
  }

  /**
   * Makes a diagnostic request to the server.
   * @param uri - The URI of the image.
   * @param userID - The user ID.
   */
  async makeDiagnostics(uri: string, userID: number) {
    try {
      if (!uri) {
        throw new Error('No image URI provided');
      }

      // Convert image to base64 using platform-specific method
      const base64 = await this.convertImageToBase64(uri);

      const headers = await this.getAuthHeaders();
      const requestHeaders = {
        ...headers,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      console.log('Making diagnostic request to:', `${this.baseUrl}/diagnostic/get_diagnosis`);

      const response = await fetch(`${this.baseUrl}/diagnostic/get_diagnosis`, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          image_url: uri,
          user_id: userID
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Diagnostic request failed with status:', response.status);
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
      }

      const data = await response.json();
      console.log("Diagnostics success");
      return data;
    } catch (error: any) {
      console.error("Error making diagnostics:", error);
      if (error.message) {
        console.error("Error message:", error.message);
      }
      throw error;
    }
  }

  /**
   * Saves a diagnostic report to the database.F
   * @param imageUrl - The URL of the analyzed image.
   * @param result - The diagnostic result.
   * @param userID - The user ID.
   */
  async saveDiagnosticReport(imageUrl: string, result: any, userID: number) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/diagnostic/post`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          result: result,
          user_id: userID,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
      }

      const data = await response.json();
      console.log("Report saved successfully");
      return data;
    } catch (error) {
      console.error("Error saving report:", error);
      throw error;
    }
  }

  async deleteDiagnostic(diagnosticId: number) {
    console.log('=== DIAGNOSTIC SERVICE DELETE START ===');
    console.log('Making delete request for ID:', diagnosticId);
    
    try {
      // Ensure we have the correct IP
      await this.initialize();
      
      // Get auth headers
      const headers = await this.getAuthHeaders();
      
      // Construct URL using the current baseUrl
      const url = `${this.baseUrl}/diagnostic/${diagnosticId}`;
      console.log('Delete URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete failed:', response.status);
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      console.log('=== DIAGNOSTIC SERVICE DELETE SUCCESS ===');
      return true;
    } catch (error: any) {
      console.error('=== DIAGNOSTIC SERVICE DELETE ERROR ===');
      console.error('Error details:', error?.message || 'Unknown error');
      throw error;
    }
  }

  async getDiagnostics(): Promise<Diagnostic[]> {
    try {
      console.log('=== GET DIAGNOSTICS START ===');
      console.log('Current base URL:', this.baseUrl);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('No authentication token found');
        throw new Error('No authentication token found');
      }
      console.log('Token found:', token.substring(0, 10) + '...');

      // Get user ID from AsyncStorage
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        throw new Error('No user data found');
      }
      const user = JSON.parse(userData);
      const userId = user.id;

      const url = `${this.baseUrl}/diagnostics/user/${userId}`;
      console.log('Making request to:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch diagnostics:', response.status);
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Diagnostics fetched successfully');
      console.log('=== GET DIAGNOSTICS END ===');
      return data;
    } catch (error: any) {
      console.error('=== GET DIAGNOSTICS ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  async initialize() {
    try {
      console.log('=== INITIALIZATION START ===');
      console.log('Using base URL:', this.baseUrl);
      // No health check
      console.log('=== INITIALIZATION END ===');
    } catch (error) {
      console.error('=== INITIALIZATION ERROR ===');
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error('Error stack:', error.stack);
      }
      console.warn('Continuing despite initialization error...');
    }
  }
}

// Export a singleton instance
export default DiagnosticService.getInstance();
