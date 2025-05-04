import { Text, View, StyleSheet } from 'react-native';
import Button from '@/components/Button';
import * as ImagePicker from 'expo-image-picker';
import DiagnosticService from './services/user_service';
import { useState } from 'react';
import IconButton from '@/components/IconButton';
import CircleButton from '@/components/CircleButton';
import ImageViewer from '@/components/ImageViewer';
import { useRouter } from "expo-router";


const PlaceHolderImage = require('@/assets/images/animated mole image.jpg')

export default function Index() {
  const [selectedImage, setSelectImage] = useState<string>("");
  const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
  const router = useRouter()

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

  const onGetDiagnostic  = async () => {
    try {
      // console.log("ce faceti baaaa",selectedImage)
      const diagnostic = await DiagnosticService.makeDiagnostics(selectedImage,1);

      router.push({pathname: "/diagnostic",
        params: {
          user_id: diagnostic.user_id,
          image_url:diagnostic.image_url,
          result: diagnostic.result
        }
      }
      );
      // console.log("User diagnostics:", diagnostic);

  } catch (error) {
      console.error("Error fetching diagnostics:", error);
  }
  };

  const onSaveImageAsync = async () => {
    localStorage.setItem("image_url",JSON.stringify(selectedImage));
    if (!selectedImage) {
      alert("No image selected!");
      return;
  } 
  await DiagnosticService.uploadImage(selectedImage, 1);
  };  

  return (
    <View style={styles.container}>
    <View style={styles.imageContainer}>
      <ImageViewer imgSource={PlaceHolderImage} selectedImage={selectedImage} />
    </View>
    {showAppOptions ? (
         <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            <IconButton icon="refresh" label="Reset" onPress={onReset} />
            <CircleButton onPress={onGetDiagnostic} />
            <IconButton icon="save-alt" label="Save" onPress={onGetDiagnostic} />
          </View>
        </View>
    ) : (
      <View style={styles.footerContainer}>
        <Button theme="primary" label="Choose a photo" onPress={pickImageAsync} />
        <Button label="Use this photo" onPress={() => setShowAppOptions(true)} />
      </View>
    )}
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: 'center',
  },
  optionsContainer: {
    position: 'absolute',
    bottom: 80,
  },
  optionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});