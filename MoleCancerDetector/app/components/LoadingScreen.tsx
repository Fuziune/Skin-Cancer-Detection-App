import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated, Easing } from 'react-native';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Analyzing your image...' }: LoadingScreenProps) {
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.circle, { transform: [{ rotate: spin }] }]} />
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.subMessage}>This may take a few moments</Text>
        <ActivityIndicator size="large" color="#4CAF50" style={styles.spinner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: '#4CAF50',
    borderTopColor: 'transparent',
  },
  message: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 16,
    color: '#b0b0b0',
    marginTop: 10,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 20,
  },
}); 