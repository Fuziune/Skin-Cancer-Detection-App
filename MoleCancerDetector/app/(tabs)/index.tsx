import { Text, View, StyleSheet, SafeAreaView, StatusBar, Modal } from 'react-native';
import Button from '@/components/Button';
import * as ImagePicker from 'expo-image-picker';
import DiagnosticService from '../services/user_service';
import { useState, useEffect } from 'react';
import IconButton from '@/components/IconButton';
import CircleButton from '@/components/CircleButton';
import ImageViewer from '@/components/ImageViewer';
import { useRouter } from "expo-router";

const PlaceHolderImage = require('@/assets/images/animated mole image.jpg')

export default function Index() {
  const [selectedImage, setSelectImage] = useState<string>("");
  const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const router = useRouter()

  useEffect(() => {
    // Initialize the DiagnosticService when component mounts
    DiagnosticService.initialize();
  }, []);

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectImage(result.assets[0].uri)
      setShowAppOptions(true)
    } else {
      alert('You did not select any image.');
    }
  };

  const onReset = () => {
    setShowAppOptions(false);
  };

  const onGetDiagnostic = async () => {
    try {
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
    localStorage.setItem("image_url", JSON.stringify(selectedImage));
    if (!selectedImage) {
      alert("No image selected!");
      return;
    }
    await DiagnosticService.uploadImage(selectedImage, 1);
  };

  const togglePreview = () => {
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
          <ImageViewer imgSource={PlaceHolderImage} selectedImage={selectedImage} />
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
                imgSource={selectedImage ? { uri: selectedImage } : PlaceHolderImage} 
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