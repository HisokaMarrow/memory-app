import { Stack } from "expo-router";
import { LogBox, Platform } from "react-native";

if (Platform.OS === "web") {
  LogBox.ignoreLogs(["Animated: `useNativeDriver` is not supported"]);
}

export default function RootLayout() {
  const transitionOptions = Platform.OS === "web" ? {} : { animation: "fade" as const };

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0A0A0A" },
        ...transitionOptions,
      }}
    />
  );
}
