import { StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import Colors from "../../constants/colors";

export default function Version() {
  const version = Constants.expoConfig?.version ?? "—";
  return (
    <View style={{ alignItems: "center", paddingVertical: 8 }}>
      <Text style={styles.TextVersion}>v{version}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  TextVersion: {
    color: Colors.muted,
    fontSize: 10,
    justifyContent: "flex-start",
  },
});
