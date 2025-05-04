import { useLocalSearchParams, useNavigation } from "expo-router";
import { View, Text, Button, Image, StyleSheet } from "react-native";

export default function DiagnosticScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();

  const imageUrl = Array.isArray(params.image_url) ? params.image_url[0] : params.image_url;


  return (
    <View style={styles.container}>
      <Text style={styles.header}>Diagnostic Report</Text>
      <Text>User ID: {params.user_id}</Text>
      <Text>Result: {params.result}</Text>
      
      {/* Displaying the image */}
      {params.image_url && (
        <Image
          source={{ uri: imageUrl }} // URI from params
          style={styles.image}
        />
      )}
      
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginTop: 20,
    resizeMode: "contain", // This ensures the image scales correctly
  },
});
