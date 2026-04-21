import { Pressable, Text } from "react-native";
import * as WebBrowser from "expo-web-browser";
import StyleSheet from "../StyleSheet";

export function SignupButton() {
  const handlePress = async () => {
    await WebBrowser.openBrowserAsync("https://www.light-serve.com/contact-us/");
  };

  return (
    <Pressable onPress={handlePress}>
      <Text style={StyleSheet.signupText}>Contact Lightserve</Text>
    </Pressable>
  );
}
