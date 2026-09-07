import { Dimensions, Pressable, StyleSheet, Text } from "react-native";
import * as WebBrowser from "expo-web-browser";
import Colors from "../../constants/colors";

const { width } = Dimensions.get("window");
let textStyle = 12;
if (width >= 380 && width <= 600) textStyle = 16;
else if (width > 600) textStyle = 20;

export function SignupButton() {
  const handlePress = async () => {
    await WebBrowser.openBrowserAsync("https://github.com/DanielGerrald/Ohmly");
  };

  return (
    <Pressable onPress={handlePress}>
      <Text style={styles.signupText}>View on GitHub</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  signupText: {
    color: Colors.accent,
    fontSize: textStyle,
    justifyContent: "flex-start",
  },
});
