import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import DiagnosticService from '../services/user_service';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Diagnostic {
  id: number;
  image_url: string;
  result: string;
  user_id: number;
}

export default function DiagnosticsScreen() {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchDiagnostics = async () => {
    try {
      if (!user) return;
      
      const response = await fetch(`http://127.0.0.1:8001/diagnostics/user/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch diagnostics');
      }
      
      const data = await response.json();
      // Sort diagnostics in reverse order (newest first)
      const sortedData = data.sort((a: Diagnostic, b: Diagnostic) => b.id - a.id);
      setDiagnostics(sortedData);
    } catch (error) {
      console.error('Error fetching diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchDiagnostics();
    }, [user])
  );

  // Initial load
  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const handleDelete = (diagnosticId: number) => {
    console.log('=== DELETE OPERATION START ===');
    console.log('handleDelete called with ID:', diagnosticId);
    
    // Immediate confirmation for testing
    if (window.confirm('Are you sure you want to delete this diagnostic?')) {
      console.log('=== DELETE CONFIRMED ===');
      console.log('User confirmed delete for ID:', diagnosticId);
      
      // Set loading state
      console.log('Setting loading state to true');
      setLoading(true);
      
      // Debug the service call
      console.log('About to call DiagnosticService.deleteDiagnostic');
      DiagnosticService.deleteDiagnostic(diagnosticId)
        .then((result) => {
          console.log('=== DELETE REQUEST SUCCESS ===');
          console.log('Delete service returned:', result);
          console.log('Refreshing diagnostics list...');
          return fetchDiagnostics();
        })
        .then(() => {
          console.log('=== LIST REFRESHED ===');
          console.log('Successfully refreshed diagnostics list');
          alert("Diagnostic deleted successfully");
        })
        .catch((error) => {
          console.error('=== DELETE ERROR ===');
          console.error('Error during delete operation:', error);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
          });
          alert("Failed to delete diagnostic");
        })
        .finally(() => {
          console.log('=== OPERATION COMPLETE ===');
          console.log('Setting loading state to false');
          setLoading(false);
        });
    } else {
      console.log('=== DELETE CANCELLED ===');
      console.log('User cancelled the delete operation');
    }
  };

  const renderDiagnosticItem = ({ item }: { item: Diagnostic }) => {
    const result = JSON.parse(item.result);
    const diagnosisDetails = getDiagnosisDetails(result.predicted_class);

    return (
      <View style={styles.diagnosticCard}>
        <TouchableOpacity 
          style={styles.diagnosticContent}
          onPress={() => router.push({
            pathname: '/diagnostic',
            params: {
              image_url: item.image_url,
              result: JSON.stringify(result),
              fromHistory: 'true'
            }
          })}
        >
          <Image 
            source={{ uri: item.image_url }} 
            style={styles.diagnosticImage}
          />
          <View style={styles.diagnosticInfo}>
            <Text style={styles.diagnosticTitle}>
              {diagnosisDetails.layman}
            </Text>
            <Text style={styles.diagnosticDate}>
              {new Date(item.id).toLocaleDateString()}
            </Text>
            <Text style={styles.diagnosticDescription} numberOfLines={2}>
              {diagnosisDetails.description}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => {
            console.log('=== DELETE BUTTON PRESSED ===');
            console.log('Button pressed for diagnostic:', item);
            console.log('Diagnostic ID:', item.id);
            console.log('Current loading state:', loading);
            handleDelete(item.id);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading diagnostics...</Text>
      </View>
    );
  }

  if (diagnostics.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDiagnosticsText}>No saved diagnostics yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={diagnostics}
        renderItem={renderDiagnosticItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const getDiagnosisDetails = (result: string) => {
  const details = {
    'nv': {
      layman: 'Common mole',
      description: 'Benign (non-cancerous) mole composed of melanocytes. These are usually harmless but should still be monitored for changes.',
    },
    'mel': {
      layman: 'Skin cancer (malignant)',
      description: 'A dangerous form of skin cancer that originates in melanocytes. Can spread quickly if untreated.',
    },
    'bkl': {
      layman: 'Non-cancerous skin growths',
      description: 'Often warty or scaly patches. These are benign but sometimes mimic cancer visually.',
    },
    'bcc': {
      layman: 'A common type of skin cancer',
      description: 'Slow-growing cancer that typically appears as a translucent or pearly bump. Rarely spreads but can damage local tissue.',
    },
    'akiec': {
      layman: 'Precancerous skin lesion',
      description: 'Rough, scaly patches caused by sun damage. Can progress to squamous cell carcinoma if untreated.',
    },
    'df': {
      layman: 'Benign fibrous nodule',
      description: 'Firm, often dark bumps typically found on the legs. Harmless.',
    },
    'vasc': {
      layman: 'Blood vessel lesions',
      description: 'Bright red, purple, or bluish spots caused by blood vessels. Usually benign.',
    }
  };

  return details[result as keyof typeof details] || {
    layman: 'Unknown',
    description: 'No specific information available for this diagnosis.',
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    padding: 16,
  },
  listContainer: {
    paddingBottom: 20,
    paddingHorizontal: 8,
  },
  diagnosticCard: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    width: '92%',
    alignSelf: 'center',
    flexDirection: 'row',
  },
  diagnosticContent: {
    flex: 1,
  },
  diagnosticImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  diagnosticInfo: {
    padding: 16,
  },
  diagnosticTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  diagnosticDate: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 8,
  },
  diagnosticDescription: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  deleteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#3c3c3e',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  noDiagnosticsText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
}); 