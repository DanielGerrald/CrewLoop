import React, { useEffect, Suspense } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { SQLiteProvider } from "expo-sqlite";
import * as ScreenOrientation from "expo-screen-orientation";
import * as MediaLibrary from "expo-media-library";

import Login from "./Screens/Login";
import ForgotPassword from "./Screens/ForgotPassword";
import Home from "./Screens/Home";
import Loading from "./Components/Loading";
import { JobProvider } from "./Components/Context";
import { navigationRef } from "./Components/NavigationRef";
import StagingBanner from "./Components/StagingBanner";
import setupDatabase from "./Database/SetupDatabase";
import {
  useForcedUpdateGate,
  UpdateRequiredScreen,
  UnsupportedOSScreen,
} from "./Components/UpdateGate";

const Stack = createNativeStackNavigator();

async function checkForUpdates() {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch (error) {
    console.error("Error fetching update:", error);
  }
}

export default function App() {
  const [status, requestPermission] = MediaLibrary.usePermissions();
  const { state, retry } = useForcedUpdateGate();

  useEffect(() => {
    (async () => {
      await ScreenOrientation.unlockAsync();

      // Only attempt OTA updates if we're not blocked by a required store update
      if (!__DEV__ && state.status === "ok") {
        await checkForUpdates();
      }
    })();
  }, [state.status]);

  useEffect(() => {
    if (status === null) {
      requestPermission();
    } else if (status?.granted === false) {
      console.warn("Media Library permission denied.");
    }
  }, [status, requestPermission]);

  if (state.status === "unsupported_os") {
    return <UnsupportedOSScreen />;
  }

  if (state.status === "required") {
    return (
      <UpdateRequiredScreen
        installedVersion={state.installedVersion}
        minVersion={state.minVersion}
        onRetry={retry}
      />
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <NavigationContainer ref={navigationRef}>
        <SQLiteProvider
          databaseName="LSconnectDB"
          onInit={setupDatabase}
          useSuspense
        >
          <JobProvider>
            <StagingBanner />
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{ fullScreenGestureEnabled: true }}
              id="stack-navigator"
            >
              <Stack.Screen
                name="Login"
                component={Login}
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="Forgot Password"
                component={ForgotPassword}
                options={{ headerShown: false, gestureEnabled: true }}
              />
              <Stack.Screen
                name="Home"
                component={Home}
                options={{ headerShown: false, gestureEnabled: false }}
              />
            </Stack.Navigator>
          </JobProvider>
        </SQLiteProvider>
        <StatusBar style="light" />
      </NavigationContainer>
    </Suspense>
  );
}
