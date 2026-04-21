import { Image } from "expo-image";
import {
  Alert,
  Pressable,
  Text,
  View,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import * as Network from "expo-network";
import { IconButton } from "react-native-paper";

import StyleSheet from "../StyleSheet";
import {
  getLoginApi,
  getUserProfileApi,
  insertUserSqlite,
  selectUserSqlite,
  updateUserSqlite,
} from "../Database/UserDatabase";
import CustomInput from "../Components/CustomInput";
import { SignupButton } from "../Components/SignupButton.js";
import {
  cleanupWorkOrderSqlite,
  getCompletedWorkOrderApi,
  getWorkOrderApi,
  getWorkOrderDetailsApi,
  insertWorkOrderSqlite,
} from "../Database/WorkOrderDatabase";
import { insertCategoryLabelSqlite } from "../Database/LabelDatabase";
import { isTokenExpired, useSessionManager } from "../Components/SessionManager";
import {
  cleanupCheckInOutSqlite,
  getCheckInOutApi,
  insertCheckInOutSqlite,
} from "../Database/CheckInOutDatabase";
import {
  cleanupContactSqlite,
  getWorkOrderContactsApi,
  insertContactSqlite,
} from "../Database/ContactDatabase";
import { cleanupAttachmentSqlite } from "../Database/AttachmentDatabase";
import { cleanupFinalCheckOutSqlite } from "../Database/FinalCheckOutDatabase";
import Loading from "../Components/Loading";
import Version from "../Components/Version";
import { useSQLiteContext } from "expo-sqlite";
import { BLURHASH } from "../Components/constants";

export default function Login(props) {
  useSessionManager();
  const db = useSQLiteContext();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  async function insertJobs(jobs) {
    for (const job of jobs) {
      try {
        await insertWorkOrderSqlite(db, job);
      } catch (error) {
        console.error("Error inserting job into SQLite:", error);
      }
    }
  }

  async function onSubmit() {
    const { username, password } = formData;

    if (!username || !password) {
      Alert.alert("Please enter a valid username and password");
      return;
    }

    setLoading(true);

    try {
      const networkState = await Network.getNetworkStateAsync();

      const apiLoginData = await getLoginApi(formData);

      if (!networkState.isInternetReachable) {
        await handleOfflineLogin();
        return;
      } else {
        if (!apiLoginData) {
          setLoading(false);
          Alert.alert("Username and/or password is incorrect");
          return;
        }
      }

      const userProfile = await getUserProfileApi(apiLoginData);
      delete userProfile.id;

      const existingUser = await selectUserSqlite(db, formData);
      const userData = {
        ...apiLoginData,
        ...userProfile,
        logged_in: 1,
      };

      if (!existingUser) {
        await insertUserSqlite(db, userData);
      } else {
        await updateUserSqlite(db, userData);
      }

      const updatedUser = await selectUserSqlite(db, formData);

      if (!updatedUser) {
        setLoading(false);
        Alert.alert("User data not found. Please log in again.");
        return;
      }

      if (await isTokenExpired(updatedUser.token_expire_date)) {
        setLoading(false);
        Alert.alert("Session expired. Please log in again.");
        return;
      }

      const openJobs = await getWorkOrderApi(updatedUser);
      const completedJobs = await getCompletedWorkOrderApi(
        updatedUser.access_token,
      );

      const jobs = [...openJobs, ...completedJobs];

      if (jobs.length > 0) {
        await cleanupWorkOrderSqlite(db, jobs);
        await cleanupContactSqlite(db, jobs);
        await cleanupCheckInOutSqlite(db, jobs);
        await cleanupAttachmentSqlite(db, jobs);
        await cleanupFinalCheckOutSqlite(db, jobs);
        for (const job of jobs) {
          job.work_order.user_id = updatedUser.user_id;
          let details = await getWorkOrderDetailsApi(
            updatedUser.access_token,
            job.work_order.id,
          );
          job.work_order.contractor_requirements =
            details.work_order.contractor_requirements;
          job.work_order.desc_of_work = details.work_order.desc_of_work;
          let contacts = await getWorkOrderContactsApi(
            updatedUser.access_token,
            job.work_order.id,
          );
          if (contacts !== undefined) {
            contacts.job_purchase_order_id = job.work_order.id;

            await insertContactSqlite(db, contacts);
          }
          const checkinArray = await getCheckInOutApi(
            updatedUser.access_token,
            job.work_order.id,
          );
          for (const checkin of checkinArray) {
            checkin.submittedToARC = "Yes";
            await insertCheckInOutSqlite(db, checkin);
          }
        }
        await insertCategoryLabelSqlite(db, jobs[0].job.attachment_types);
        await insertJobs(jobs);
      }
      setLoading(false);
      props.navigation.navigate("Home");
    } catch (error) {
      console.error("Error during login process:", error);
      setLoading(false);
      Alert.alert("An error occurred. Please try again.");
    }
  }

  async function handleOfflineLogin() {
    setLoading(false);
    const sqliteUserData = await selectUserSqlite(db, formData);
    if (sqliteUserData === null) {
      Alert.alert(
        "The username does not exist!",
        "Try again when you have internet access",
      );
    } else if (!(await isTokenExpired(sqliteUserData.token_expire_date))) {
      props.navigation.navigate("Home");
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={StyleSheet.SafeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {loading ? (
            <Loading />
          ) : (
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                padding: 20,
              }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={StyleSheet.header}>
                <Image
                  style={StyleSheet.loginLogo}
                  source={require("../assets/logo.png")}
                  contentFit={"contain"}
                  placeholder={BLURHASH}
                />
                <Text style={StyleSheet.loginTitle}>Lightserve Connect</Text>
              </View>
              <View style={StyleSheet.loginForm}>
                <CustomInput
                  label="username"
                  style={StyleSheet.inputView}
                  placeholder={"User Name"}
                  value={formData.username}
                  onChangeText={(text) => handleInputChange("username", text)}
                  textContentType="username"
                  autoComplete="username"
                />

                <View style={StyleSheet.passwordInputContainer}>
                  <CustomInput
                    label="password"
                    style={StyleSheet.inputView}
                    placeholder={"Password"}
                    value={formData.password}
                    onChangeText={(text) => handleInputChange("password", text)}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    autoComplete="password"
                  />
                  <IconButton
                    icon={showPassword ? "eye-off" : "eye"}
                    color={"#25292e"}
                    size={20}
                    onPress={togglePasswordVisibility}
                    style={StyleSheet.passwordVisibilityButton}
                  />
                </View>

                <View style={StyleSheet.loginFormButtons}>
                  <Pressable
                    onPress={() => props.navigation.navigate("Forgot Password")}
                  >
                    <Text style={StyleSheet.signupText}>Forgot Password?</Text>
                  </Pressable>
                  <Pressable onPress={onSubmit} style={StyleSheet.loginBtn}>
                    <Text style={StyleSheet.buttonText}>LOGIN</Text>
                  </Pressable>
                  <SignupButton />
                </View>
              </View>
              <Version />
            </ScrollView>
          )}
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
