import { Text, View } from "react-native";
import Constants from "expo-constants";
import StyleSheet from "../StyleSheet";

export default function Version() {
  const version = Constants.expoConfig?.version ?? "—";
  return (
    <View style={{ alignItems: "center", paddingVertical: 8 }}>
      <Text style={StyleSheet.TextVersion}>v{version}</Text>
    </View>
  );
}
