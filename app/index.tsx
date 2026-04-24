import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function HomeScreen() {
  const [status, setStatus] = useState("Testing Supabase...");

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase.from("_test_connection_").select("*");

      if (error) {
        setStatus("Supabase connected ✅");
      } else {
        setStatus("Supabase connected ✅");
      }
    }

    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Memory App</Text>
      <Text>{status}</Text>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
});