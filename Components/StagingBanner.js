import { environment } from "../Config";
import { Text, View } from "react-native";

import StyleSheet from "../StyleSheet";

export default function StagingBanner() {
  if (environment.envName !== "production") {
    return (
      <View style={StyleSheet.stagingBannerView}>
        <Text style={StyleSheet.stagingBannerText}>Staging</Text>
      </View>
    );
  }
  return null;
}
