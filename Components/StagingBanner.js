import { environment } from "../Config";
import { Dimensions, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");
let textStyle = 12;
if (width >= 380 && width <= 600) textStyle = 16;
else if (width > 600) textStyle = 20;

export default function StagingBanner() {
  if (environment.envName !== "production") {
    return (
      <View style={styles.stagingBannerView}>
        <Text style={styles.stagingBannerText}>Staging</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  stagingBannerText: { color: "white", fontSize: textStyle },
  stagingBannerView: {
    top: 0,
    backgroundColor: "#1B3A6B",
    paddingTop: height / 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
