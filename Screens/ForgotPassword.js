import {
  View,
  Text,
  Pressable,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

import StyleSheet from "../StyleSheet";
import CustomInput from "../Components/CustomInput";
import { useState } from "react";
import { Avatar } from "react-native-paper";
import { postRecoverPasswordAPI } from "../Database/UserDatabase";
import { BLURHASH } from "../Components/constants";

export default function ForgotPassword(props) {

  const [formData, setFormData] = useState({
    Username: "",
  });

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const onSubmit = async () => {
    const { Username } = formData;

    if (!Username) {
      Alert.alert("Please enter your username");
      return;
    }

    try {
      const post = await postRecoverPasswordAPI(Username);
      if (post) {
        Alert.alert(post);
      } else {
        Alert.alert("An unexpected error occurred. Please try again.");
      }

      props.navigation.navigate({
        name: "Login",
      });
    } catch (error) {
      console.error(error);
      Alert.alert(
        "An error occurred while processing your request. Please try again later.",
      );
    }
  };

  return (
    <SafeAreaView style={StyleSheet.SafeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
        <ScrollView
          contentContainerStyle={StyleSheet.container}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={StyleSheet.header}>
            <Image
              style={StyleSheet.loginLogo}
              source={require("../assets/logo.png")}
              contentFit={"contain"}
              placeholder={BLURHASH}
            />

            <Text style={StyleSheet.fpText}>
              If you've forgotten your password, use the form below to start the
              recovery process.
            </Text>
          </View>
          <View style={StyleSheet.fpForm}>
            <CustomInput
              label="Username"
              style={StyleSheet.inputView}
              value={formData.Username}
              placeholder={"Username"}
              onChangeText={(text) => handleInputChange("Username", text)}
              keyboardType={"email-address"}
            />

            <Pressable onPress={onSubmit} style={StyleSheet.fpSubmitBtn}>
              <Text style={StyleSheet.buttonText}>Send Recovery Email</Text>
            </Pressable>

            <TouchableOpacity
              style={StyleSheet.backButton}
              onPress={() => props.navigation.navigate("Login")}
            >
              <Avatar.Icon
                style={StyleSheet.avatarIcon}
                icon="arrow-left"
                size={55}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
