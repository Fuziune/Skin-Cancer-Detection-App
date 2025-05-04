import * as FileSystem from 'expo-file-system';

class DiagnosticService {
  private baseUrl: string;

  public constructor() {
    this.baseUrl = "http://172.20.10.4:8001/diagnostic";
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

    // Append the image to the FormData object
    formData.append("file", {
      uri: uri,
      name: "photo.jpg",
      type: "image/jpeg",
    } as any);

    // Append the user_id to the FormData object
    formData.append("user_id", userID.toString()); // user_id must be a string

    // Log the FormData for debugging
    formData.forEach((value, key) => {
      console.log(key, value);
    });

    try {
      const response = await fetch(`${this.baseUrl}/post`, {
        method: 'POST',
        headers: {
          "Accept": "application/json",
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
    }
  }

  /**
   * Makes a diagnostic request to the server.
   * @param uri - The URI of the image.
   * @param userID - The user ID.
   */
  async makeDiagnostics(uri: string, userID: number) {
    const formData = new FormData()
    
    formData.append("file",{
      uri:uri,
      name: "photo.jpg",
      type: "image/jpeg"
    }as any);

    formData.append("user_id", userID.toString())

    if (uri.startsWith("file")){
        uri = (await this.convertImageToBase64(uri)).toString()
    }

    try {
      const response = await fetch(`${this.baseUrl}/get_diagnosis`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          image_url: uri,
          user_id: userID,  
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      // console.log("Diagnostics success:", data);
      return data;
    } catch (error) {
      console.error("Error fetching diagnostics:", error);
    }
  }
}

export default new DiagnosticService();
