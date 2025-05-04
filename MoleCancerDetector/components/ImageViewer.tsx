import { StyleSheet } from 'react-native';
import { Image,type ImageSource } from 'expo-image';

type Props = {
  imgSource: ImageSource;
  selectedImage?: String
};

export default function ImageViewer({ imgSource, selectedImage }: Props) {
  const imageSource = selectedImage ? { uri: selectedImage } : imgSource;

  return <Image source={imageSource} style={styles.image} />;}

const styles = StyleSheet.create({
  image: {
    width: 300,
    height: 440,
    borderRadius: 18,
    marginBottom: 20
  },
});
