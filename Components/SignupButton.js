import { Pressable, Text } from "react-native";
import * as WebBrowser from "expo-web-browser";
import StyleSheet from "../StyleSheet";

export function SignupButton() {
  const handlePress = async () => {
    await WebBrowser.openBrowserAsync("https://github.com/DanielGerrald/CrewLoop");
  };

  return (
    <Pressable onPress={handlePress}>
      <Text style={StyleSheet.signupText}>View on GitHub</Text>
    </Pressable>
  );
}
