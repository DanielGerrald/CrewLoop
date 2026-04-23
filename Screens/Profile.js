import React, { useEffect, useState } from "react";
import { View, Text, Switch, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StyleSheet from "../StyleSheet";
import { SAFE_AREA_EDGES } from "../Components/constants";
import AvatarIcon from "../Components/AvatarIcon";
import {
  lastLoggedinUserSqlite,
  postUserApi,
  selectUserSqlite,
  updateUserSqlite,
} from "../Database/UserDatabase";
import CustomInput from "../Components/CustomInput";
import AsyncStorage from "expo-sqlite/kv-store";
import Version from "../Components/Version";
import { useSQLiteContext } from "expo-sqlite";
import AppSyncManager from "../Components/AppSyncManager";
import { useJob } from "../Components/Context";

export default function Profile(props) {
  const db = useSQLiteContext();
  const [lastLoggedIn, setLastLoggedIn] = useState(null);
  const [updatedUser, setUpdatedUser] = useState(null);
  const [isEnabledSMS, setIsEnabledSMS] = useState(false);
  const [isEnabledEmail, setIsEnabledEmail] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_nbr: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await lastLoggedinUserSqlite(db);
        if (user) {
          setLastLoggedIn(user);
          setUpdatedUser(user);
          setFormData({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone_nbr: user.phone_nbr.toString(),
          });
          setIsEnabledSMS(user.notify_sms === 1);
          setIsEnabledEmail(user.notify_email === 1);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Failed to load user data.");
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const onSubmit = async () => {
    const { first_name, last_name, email, phone_nbr } = formData;

    if (first_name && last_name && email && phone_nbr) {
      const updatedData = {
        ...formData,
        username: lastLoggedIn.username,
        notify_sms: isEnabledSMS ? 1 : 0,
        notify_email: isEnabledEmail ? 1 : 0,
      };

      await updateUserSqlite(db, updatedData);
      await selectUserSqlite(db, updatedData).then((r) => {
        postUserApi(r);
        setUpdatedUser(r);
      });

      Alert.alert("User Profile updated successfully!");
    } else {
      Alert.alert("Please fill in all required fields.");
    }
  };

  if (!lastLoggedIn) {
    return (
      <SafeAreaView style={StyleSheet.SafeArea} edges={SAFE_AREA_EDGES}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={StyleSheet.SafeArea} edges={SAFE_AREA_EDGES}>
      <AppSyncManager>
        <View style={StyleSheet.header}>
          <AvatarIcon />
          <Text style={StyleSheet.Text} name="username">
            {lastLoggedIn.username}
          </Text>
        </View>
        <View style={StyleSheet.profileForm}>
          <CustomInput
            label="first_name"
            style={StyleSheet.inputView}
            value={formData.first_name}
            placeholder={"First Name"}
            onChangeText={(text) => handleInputChange("first_name", text)}
          />
          <CustomInput
            label="last_name"
            style={StyleSheet.inputView}
            value={formData.last_name}
            placeholder={"Last Name"}
            onChangeText={(text) => handleInputChange("last_name", text)}
          />
          <CustomInput
            label="email"
            style={StyleSheet.inputView}
            value={formData.email}
            placeholder={"Email Address"}
            onChangeText={(text) => handleInputChange("email", text)}
            keyboardType="email-address"
          />
          <CustomInput
            label="phone_nbr"
            style={StyleSheet.inputView}
            value={formData.phone_nbr}
            placeholder={"Phone Number"}
            onChangeText={(text) => handleInputChange("phone_nbr", text)}
            autoComplete="tel"
            keyboardType="phone-pad"
          />

          <View style={StyleSheet.rowView}>
            <Text style={StyleSheet.switchLabel}>Email Notifications</Text>
            <Switch
              style={StyleSheet.switch}
              trackColor={{ false: "#999", true: "#F47C20" }}
              ios_backgroundColor="#2C3444"
              thumbColor={isEnabledEmail ? "#F47C20" : "#f4f3f4"}
              onValueChange={(value) => setIsEnabledEmail(value)}
              value={isEnabledEmail}
            />
          </View>
          <View style={StyleSheet.rowView}>
            <Text style={StyleSheet.switchLabel}>SMS Notifications</Text>
            <Switch
              style={StyleSheet.switch}
              trackColor={{ false: "#999", true: "#F47C20" }}
              ios_backgroundColor="#2C3444"
              thumbColor={isEnabledSMS ? "#F47C20" : "#f4f3f4"}
              onValueChange={(value) => setIsEnabledSMS(value)}
              value={isEnabledSMS}
            />
          </View>

          <View style={StyleSheet.profileFormButtons}>
            <Pressable style={StyleSheet.submitBtn} onPress={onSubmit}>
              <Text style={StyleSheet.buttonText}>Update</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                await updateUserSqlite(db, { ...updatedUser, logged_in: 0 });
                await AsyncStorage.removeItem("userName");
                props.navigation.navigate("Login");
              }}
              style={StyleSheet.logoutBtn}
            >
              <Text style={StyleSheet.logoutBtnText}>Log Out</Text>
            </Pressable>
          </View>
        </View>
        <Version />
      </AppSyncManager>
    </SafeAreaView>
  );
}
