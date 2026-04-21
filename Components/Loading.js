import { View, Text, ActivityIndicator } from "react-native";

import StyleSheet from "../StyleSheet";

export default function Loading() {
  return (
    <View style={StyleSheet.container}>
      <View
        style={{ alignContent: "center", justifyContent: "center", flex: 1 }}
      >
        <ActivityIndicator size={"large"} color={"#01ab52"} />
        <Text style={StyleSheet.Text}>Loading...</Text>
      </View>
    </View>
  );
}
