import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@react-navigation/native';

const About = () => {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#1a1a1a' }]}>
      <Stack.Screen options={{ 
        title: 'About',
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        headerShadowVisible: false,
      }} />
      
      <View style={styles.section}>
        <Text style={[styles.title, { color: '#fff' }]}>Mole Cancer Detector</Text>
        <Text style={[styles.description, { color: '#e0e0e0' }]}>
          A mobile application designed to help users detect potential skin cancer by analyzing images of moles and skin lesions.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: '#2a2a2a' }]}>
        <Text style={[styles.subtitle, { color: '#fff' }]}>How It Works</Text>
        <Text style={[styles.text, { color: '#e0e0e0' }]}>
          1. Take a photo of a mole or skin lesion using your device's camera{'\n\n'}
          2. Upload the image to our system{'\n\n'}
          3. Our AI model analyzes the image and provides a diagnosis{'\n\n'}
          4. View detailed results and recommendations{'\n\n'}
          5. Save the report for future reference
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: '#2a2a2a' }]}>
        <Text style={[styles.subtitle, { color: '#fff' }]}>Features</Text>
        <Text style={[styles.text, { color: '#e0e0e0' }]}>
          • Real-time skin lesion analysis{'\n\n'}
          • High-accuracy cancer detection{'\n\n'}
          • Detailed diagnostic reports{'\n\n'}
          • Secure storage of medical history{'\n\n'}
          • User-friendly interface{'\n\n'}
          • Offline capability for saved reports
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: '#2a2a2a' }]}>
        <Text style={[styles.subtitle, { color: '#fff' }]}>AI Model</Text>
        <Text style={[styles.text, { color: '#e0e0e0' }]}>
          Our application uses a ResNet18 deep learning model trained on the HAM10000 dataset, which contains over 10,000 dermatoscopic images of common pigmented skin lesions. The model has been specifically trained to identify various types of skin conditions, including:{'\n\n'}
          • Melanoma{'\n'}
          • Basal Cell Carcinoma{'\n'}
          • Benign Keratosis{'\n'}
          • Dermatofibroma{'\n'}
          • Vascular Lesions{'\n'}
          • Actinic Keratosis{'\n'}
          • Squamous Cell Carcinoma
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: '#2a2a2a' }]}>
        <Text style={[styles.subtitle, { color: '#fff' }]}>Important Note</Text>
        <Text style={[styles.text, { color: '#e0e0e0' }]}>
          This application is designed to assist healthcare professionals and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
        </Text>
      </View>
    </ScrollView>
  );
};

export default About;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    alignItems: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
});