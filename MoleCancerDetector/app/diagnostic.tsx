import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useNavigation } from "expo-router";
import { View, Text, Image, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, Dimensions, useWindowDimensions } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import Button from '@/components/Button';

const getDiagnosisDetails = (result: string) => {
  const details = {
    'nv': {
      layman: 'Common mole',
      description: 'Benign (non-cancerous) mole composed of melanocytes. These are usually harmless but should still be monitored for changes.',
      recommendation: 'Regular monitoring. No immediate concern unless it changes shape, color, or size.',
      icon: '🔹'
    },
    'mel': {
      layman: 'Skin cancer (malignant)',
      description: 'A dangerous form of skin cancer that originates in melanocytes. Can spread quickly if untreated.',
      recommendation: 'Seek a dermatologist immediately for further examination and biopsy.',
      icon: '⚠️'
    },
    'bkl': {
      layman: 'Non-cancerous skin growths (like seborrheic keratosis)',
      description: 'Often warty or scaly patches. These are benign but sometimes mimic cancer visually.',
      recommendation: 'Safe in most cases, but consult a specialist if unsure or if it changes.',
      icon: '🔍'
    },
    'bcc': {
      layman: 'A common type of skin cancer',
      description: 'Slow-growing cancer that typically appears as a translucent or pearly bump. Rarely spreads but can damage local tissue.',
      recommendation: 'Consult a dermatologist for treatment. Usually curable with early intervention.',
      icon: '⚠️'
    },
    'akiec': {
      layman: 'Precancerous skin lesion',
      description: 'Rough, scaly patches caused by sun damage. Can progress to squamous cell carcinoma if untreated.',
      recommendation: 'Dermatological evaluation needed to prevent progression.',
      icon: '⚠️'
    },
    'df': {
      layman: 'Benign fibrous nodule',
      description: 'Firm, often dark bumps typically found on the legs. Harmless.',
      recommendation: 'No treatment required unless symptomatic.',
      icon: '✅'
    },
    'vasc': {
      layman: 'Blood vessel lesions (like angiomas or hemangiomas)',
      description: 'Bright red, purple, or bluish spots caused by blood vessels. Usually benign.',
      recommendation: 'Harmless, but monitor if size or color changes.',
      icon: '✅'
    }
  };

  return details[result as keyof typeof details] || {
    layman: 'Unknown',
    description: 'No specific information available for this diagnosis.',
    recommendation: 'Please consult a healthcare professional.',
    icon: '❓'
  };
};

export default function DiagnosticScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  const [predictionResult, setPredictionResult] = useState({
    predicted_class: 'unknown',
    probabilities: {}
  });

  useEffect(() => {
    // Parse the result JSON string with proper error handling
    try {
      if (params.result) {
        console.log('Raw result:', params.result);
        const parsedResult = JSON.parse(params.result as string);
        console.log('Parsed result:', parsedResult);

        // The actual diagnostic result is inside the 'result' string property
        const diagnosticDataString = parsedResult.result;

        if (diagnosticDataString) {
          const diagnosticDataObject = JSON.parse(diagnosticDataString);
          console.log('Parsed diagnostic data object:', diagnosticDataObject);

          // Check if the diagnostic data contains an error
          if (diagnosticDataObject.error) {
            console.error('Diagnostic error:', diagnosticDataObject.error);
            setPredictionResult({
              predicted_class: 'error',
              probabilities: {}
            });
            console.log('State updated after error:', 'error');
          } else {
            setPredictionResult({
              predicted_class: diagnosticDataObject.predicted_class || 'unknown',
              probabilities: diagnosticDataObject.probabilities || {}
            });
            console.log('State updated with predicted_class:', diagnosticDataObject.predicted_class);
          }
        } else {
           console.error('Diagnostic data string is empty or null');
           setPredictionResult({
             predicted_class: 'unknown',
             probabilities: {}
           });
           console.log('State updated due to empty diagnostic data string:', 'unknown');
        }
      }
    } catch (e) {
      console.error('Error parsing result:', e);
      // If parsing fails, try to use the raw result
      if (params.result) {
        setPredictionResult(prevState => ({
          ...prevState,
          predicted_class: params.result as string
        }));
        console.log('State updated with raw result:', params.result);
      }
    }
  }, [params.result]); // Re-run effect when params.result changes
  
  const diagnosisDetails = getDiagnosisDetails(predictionResult.predicted_class);
  
  // Handle image URL with proper base64 checking
  const getImageSource = () => {
    if (!params.image_url) return null;
    
    const imageUrl = Array.isArray(params.image_url) ? params.image_url[0] : params.image_url;
    
    // Check if it's a base64 string
    if (imageUrl.startsWith('data:image')) {
      return { uri: imageUrl };
    }
    
    // Check if it's a truncated base64 string
    if (imageUrl.startsWith('/9j/')) {
      return { uri: `data:image/jpeg;base64,${imageUrl}` };
    }
    
    return { uri: imageUrl };
  };
  
  const imageSource = getImageSource();

  // Prepare data for the chart
  const chartData = {
    labels: Object.keys(predictionResult.probabilities).map(key => key.toUpperCase()),
    datasets: [{
      data: Object.values(predictionResult.probabilities).map(value => Number(value))
    }]
  };

  // Calculate chart dimensions based on screen size
  const chartConfig = {
    backgroundColor: '#2c2c2e',
    backgroundGradientFrom: '#2c2c2e',
    backgroundGradientTo: '#2c2c2e',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(255, 211, 61, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.5,
    propsForLabels: {
      fontSize: 12,
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: '#3c3c3e',
    },
  };

  const handleSaveReport = async () => {
    try {
      // Here you can implement the logic to save the report
      // For now, we'll just show an alert
      alert('Report saved successfully!');
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Failed to save report. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.header}>Diagnostic Report</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {predictionResult.predicted_class === 'error' ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error Processing Image</Text>
              <Text style={styles.errorDescription}>
                There was an error processing your image. Please try again with a different image.
              </Text>
            </View>
          ) : (
            <React.Fragment>
              <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>Analysis Result:</Text>
                <Text style={styles.resultText}>
                  {predictionResult.predicted_class ? predictionResult.predicted_class.toUpperCase() : 'UNKNOWN'}
                </Text>
                {predictionResult.probabilities && Object.keys(predictionResult.probabilities).length > 0 && (
                  <View style={styles.probabilitiesContainer}>
                    <Text style={styles.probabilitiesTitle}>Confidence Levels:</Text>
                    {Object.entries(predictionResult.probabilities).map(([key, value]) => (
                      <Text key={key} style={styles.probabilityText}>
                        {key.toUpperCase()}: {Number(value).toFixed(2)}%
                      </Text>
                    ))}
                  </View>
                )}
              </View>
              
              {imageSource && (
                <View style={styles.imageContainer}>
                  <Image
                    source={imageSource}
                    style={styles.image}
                  />
                </View>
              )}

              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Diagnosis Details</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Layman's Term:</Text>
                  <Text style={styles.detailText}>{diagnosisDetails.layman}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailText}>{diagnosisDetails.description}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Recommendation:</Text>
                  <Text style={[styles.detailText, styles.recommendationText]}>
                    {diagnosisDetails.icon} {diagnosisDetails.recommendation}
                  </Text>
                </View>
              </View>

              {Object.keys(predictionResult.probabilities).length > 0 && (
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Probability Distribution</Text>
                  <View style={styles.chartWrapper}>
                    <BarChart
                      data={chartData}
                      width={screenWidth - 40}
                      height={Math.min(screenHeight * 0.4, 300)}
                      yAxisSuffix="%"
                      yAxisLabel=""
                      chartConfig={chartConfig}
                      style={styles.chart}
                      showValuesOnTopOfBars
                      fromZero
                      segments={5}
                      yAxisInterval={1}
                    />
                  </View>
                </View>
              )}

              <View style={styles.saveButtonContainer}>
                <Button 
                  theme="primary" 
                  label="Save Report" 
                  onPress={handleSaveReport} 
                />
              </View>
            </React.Fragment>
          )}
        </ScrollView>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#2c2c2e',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 20,
    color: '#ff6b6b',
    fontWeight: '600',
    marginBottom: 10,
  },
  errorDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
  },
  resultContainer: {
    width: '100%',
    backgroundColor: '#2c2c2e',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  resultLabel: {
    fontSize: 16,
    color: '#a0a0a0',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 10,
  },
  probabilitiesContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#3c3c3e',
  },
  probabilitiesTitle: {
    fontSize: 16,
    color: '#a0a0a0',
    marginBottom: 8,
  },
  probabilityText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    borderRadius: 40,
  },
  image: {
    width: 350,
    height: 350,
    borderRadius: 10,
  },
  descriptionContainer: {
    width: '100%',
    backgroundColor: '#2c2c2e',
    padding: 20,
    borderRadius: 15,
    marginTop: 20,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  detailItem: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 16,
    color: '#a0a0a0',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  recommendationText: {
    color: '#ffd33d',
    fontWeight: '600',
  },
  chartContainer: {
    width: '100%',
    backgroundColor: '#2c2c2e',
    padding: 20,
    borderRadius: 15,
    marginTop: 20,
    marginBottom: 20,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  saveButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
});
