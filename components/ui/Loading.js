import { Dimensions, StyleSheet, View, Text, ActivityIndicator } from "react-native";

const { width } = Dimensions.get("window");
let textStyle = 12;
if (width >= 380 && width <= 600) textStyle = 16;
else if (width > 600) textStyle = 20;

export default function Loading() {
  return (
    <View style={styles.container}>
      <View
        style={{ alignContent: "center", justifyContent: "center", flex: 1 }}
      >
        <ActivityIndicator size={"large"} color={"#01ab52"} />
        <Text style={styles.Text}>Loading...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#1E2530",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
  },
  Text: {
    color: "#ffffff",
    fontSize: textStyle,
    justifyContent: "flex-start",
  },
});
