import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

class DiagnosticService {
  private baseUrl: string;
  private commonLocalIPs = [
    '10.131.2.230',      // Localhost
    'localhost'       // Alternative localhost
  ];

  private async findWorkingIP(): Promise<string> {
    for (const ip of this.commonLocalIPs) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`http://${ip}:8081/diagnostic/health`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('Found working IP:', ip);
          return ip;
        }
      } catch (error: any) {
        console.log(`IP ${ip} not working:`, error?.message || 'Unknown error');
      }
    }
    // If no IP works, return localhost as fallback
    console.log('No working IP found, using fallback: localhost');
    return '127.0.0.1';
  }

  public constructor() {
    this.baseUrl = "http://127.0.0.1:8001/diagnostic";
  }

  public async initialize() {
    const ip = await this.findWorkingIP();
    console.log('Using IP:', ip);
    this.baseUrl = `http://${ip}:8001/diagnostic`;
    console.log('Service initialized with IP:', ip);
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

  async  convertImageToBase64(uri: string) {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  
    return `data:image/jpeg;base64,${base64}`; // Adjust MIME type if needed
  }

  /**
   * Uploads the image to the server.
   * @param uri - The URI of the image.
   * @param userID - The user ID.
   */
  async uploadImage(uri: string, userID: number) {
    const formData = new FormData();
    formData.append("file", {
      uri: uri,
      name: "photo.jpg",
      type: "image/jpeg",
    } as any);
    formData.append("user_id", userID.toString());

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/post`, {
        method: 'POST',
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Upload success:", data);
      return data;
    } catch (error) {
      console.error("Upload error:", error);
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

      const formData = new FormData();
      formData.append("file", {
        uri: uri,
        name: "photo.jpg",
        type: "image/jpeg"
      } as any);
      formData.append("user_id", userID.toString());

      let imageData = uri;
      if (uri.startsWith("file")) {
        imageData = await this.convertImageToBase64(uri);
      }

      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/get_diagnosis`, {
        method: 'POST',
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageData,
          user_id: userID,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Diagnostics success:", data);
      return data;
    } catch (error) {
      console.error("Error fetching diagnostics:", error);
      throw error;
    }
  }

  /**
   * Saves a diagnostic report to the database.
   * @param imageUrl - The URL of the analyzed image.
   * @param result - The diagnostic result.
   * @param userID - The user ID.
   */
  async saveDiagnosticReport(imageUrl: string, result: any, userID: number) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/post`, {
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
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Report saved successfully:", data);
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
      // Get auth headers
      console.log('Getting auth headers...');
      const headers = await this.getAuthHeaders();
      console.log('Auth headers:', headers);
      
      // Construct URL
      const url = `http://127.0.0.1:8001/diagnostic/${diagnosticId}`;
      console.log('Delete URL:', url);
      
      // Make request
      console.log('Sending DELETE request...');
      console.log('Request details:', {
        method: 'DELETE',
        url: url,
        headers: headers
      });
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response received:');
      console.log('- Status:', response.status);
      console.log('- Status text:', response.statusText);
      console.log('- Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.log('Response not OK, attempting to read error data...');
        const errorText = await response.text();
        console.log('Error response body:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}, Body: ${errorText}`);
      }
      
      console.log('=== DIAGNOSTIC SERVICE DELETE SUCCESS ===');
      return true;
    } catch (error: any) {
      console.error('=== DIAGNOSTIC SERVICE DELETE ERROR ===');
      console.error('Error details:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        type: error?.constructor?.name || 'Unknown type'
      });
      throw error;
    }
  }
}

export default new DiagnosticService();
