import { Image, StyleSheet, View, Platform } from 'react-native';
import { useEffect } from 'react';

interface ImageViewerProps {
  imgSource: any;
  selectedImage: string;
}

export default function ImageViewer({ imgSource, selectedImage }: ImageViewerProps) {
  useEffect(() => {
    console.log('ImageViewer mounted/updated');
    console.log('selectedImage:', selectedImage);
  }, [selectedImage]);

  const getImageSource = () => {
    if (!selectedImage) {
      console.log('Using placeholder image');
      return imgSource;
    }
    
    // For iOS, ensure the URI is properly formatted
    if (Platform.OS === 'ios') {
      const uri = selectedImage.startsWith('file://') ? selectedImage : `file://${selectedImage}`;
      console.log('iOS image source:', uri);
      return { uri };
    }
    
    console.log('Android image source:', selectedImage);
    return { uri: selectedImage };
  };

  const source = getImageSource();
  console.log('Final image source:', source);

  return (
    <View style={styles.imageContainer}>
      <Image 
        source={source}
        style={styles.image}
        resizeMode="cover"
        onLoadStart={() => console.log('Image load started')}
        onLoad={(event) => {
          console.log('Image loaded successfully');
          console.log('Image dimensions:', event.nativeEvent.source);
        }}
        onError={(error) => {
          console.error('Error loading image:', error.nativeEvent.error);
          console.error('Failed source:', source);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
}); 