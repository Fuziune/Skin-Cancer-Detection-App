import { Text, View, StyleSheet, SafeAreaView, StatusBar, Modal, Platform } from 'react-native';
import Button from '../../components/Button';
import * as ImagePicker from 'expo-image-picker';
import DiagnosticService from '../services/user_service';
import { useState, useEffect } from 'react';
import IconButton from '../../components/IconButton';
import CircleButton from '../../components/CircleButton';
import ImageViewer from '../components/ImageViewer';
import { useRouter } from "expo-router";

const PlaceHolderImage = require('../../assets/images/animated mole image.jpg');

export default function Index() {
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Initialize the DiagnosticService when component mounts
    console.log('Initializing DiagnosticService...');
    DiagnosticService.setBaseUrl("http://172.20.10.4:8001");
    DiagnosticService.initialize();
  }, []);

  // Debug effect to log state changes
  useEffect(() => {
    console.log('Selected image changed:', selectedImage);
  }, [selectedImage]);

  const pickImageAsync = async () => {
    try {
      console.log('Starting image picker...');
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
        exif: false,
      });

      console.log('Image picker result:', JSON.stringify(result, null, 2));

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('Raw image URI:', imageUri);
        
        // For iOS, ensure we have the correct file:// prefix
        const processedUri = Platform.OS === 'ios' 
          ? imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`
          : imageUri;
          
        console.log('Processed image URI:', processedUri);
        setSelectedImage(processedUri);
        setShowAppOptions(true);
      } else {
        console.log('Image selection was canceled or no image was selected');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image. Please try again.');
    }
  };

  const onReset = () => {
    console.log('Resetting image selection');
    setSelectedImage("");
    setShowAppOptions(false);
  };

  const onGetDiagnostic = async () => {
    try {
      if (!selectedImage) {
        alert('Please select an image first');
        return;
      }

      console.log('Getting diagnostic for image:', selectedImage);
      const diagnostic = await DiagnosticService.makeDiagnostics(selectedImage, 1);
      
      if (!diagnostic) {
        alert('Failed to get diagnostic results. Please try again.');
        return;
      }

      router.push({
        pathname: "/diagnostic",
        params: {
          image_url: selectedImage,
          result: JSON.stringify(diagnostic)
        }
      });
    } catch (error) {
      console.error("Error fetching diagnostics:", error);
      alert('An error occurred while getting the diagnostic. Please try again.');
    }
  };

  const onSaveImageAsync = async () => {
    if (!selectedImage) {
      alert("No image selected!");
      return;
    }
    try {
      await DiagnosticService.uploadImage(selectedImage, 1);
      alert("Image saved successfully!");
    } catch (error) {
      console.error("Error saving image:", error);
      alert("Failed to save image. Please try again.");
    }
  };

  const togglePreview = () => {
    console.log('Toggling preview, current image:', selectedImage);
    setShowPreview(!showPreview);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mole Cancer Detector</Text>
          <Text style={styles.subtitle}>Upload a photo for analysis</Text>
        </View>
        
        <View style={styles.imageContainer}>
          <ImageViewer 
            imgSource={PlaceHolderImage}
            selectedImage={selectedImage}
          />
        </View>

        {showAppOptions ? (
          <View style={styles.optionsContainer}>
            <View style={styles.optionsRow}>
              <IconButton icon="refresh" label="Reset" onPress={onReset} />
              <CircleButton onPress={onGetDiagnostic} />
              <IconButton icon="search" label="Preview" onPress={togglePreview} />
            </View>
          </View>
        ) : (
          <View style={styles.footerContainer}>
            <Button theme="primary" label="Choose a photo" onPress={pickImageAsync} />
            <Button label="Use this photo" onPress={() => setShowAppOptions(true)} />
          </View>
        )}

        <Modal
          visible={showPreview}
          transparent={true}
          animationType="fade"
          onRequestClose={togglePreview}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ImageViewer 
                imgSource={PlaceHolderImage}
                selectedImage={selectedImage}
              />
              <IconButton 
                icon="close" 
                label="Close" 
                onPress={togglePreview} 
                style={styles.closeButton}
              />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  footerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  optionsContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#25292e',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
});