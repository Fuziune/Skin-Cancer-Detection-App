import { StyleSheet } from 'react-native';
import { Image, type ImageSource } from 'expo-image';

type Props = {
  imgSource: ImageSource;
  selectedImage?: string;
};

export default function ImageViewer({ imgSource, selectedImage }: Props) {
  const imageSource = selectedImage 
    ? { uri: selectedImage.startsWith('data:') ? selectedImage : `data:image/jpeg;base64,${selectedImage}` }
    : imgSource;

  return <Image source={imageSource} style={styles.image} />;
}

const styles = StyleSheet.create({
  image: {
    width: 350,
    height: 350,
    borderRadius: 10,
    marginBottom: 20
  },
});
