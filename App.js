import React, { useEffect, Suspense } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { SQLiteProvider } from "expo-sqlite";
import * as ScreenOrientation from "expo-screen-orientation";
import * as MediaLibrary from "expo-media-library";

import Login from "./screens/Login";
import ForgotPassword from "./screens/ForgotPassword";
import Home from "./screens/Home";
import Loading from "./components/ui/Loading";
import { JobProvider } from "./components/Context";
import { AuthContextProvider, useAuth } from "./components/AuthContext";
import { navigationRef } from "./components/NavigationRef";
import StagingBanner from "./components/ui/StagingBanner";
import setupDatabase from "./Database/SetupDatabase";
import {
  useForcedUpdateGate,
  UpdateRequiredScreen,
  UnsupportedOSScreen,
} from "./components/UpdateGate";

const AuthStack = createNativeStackNavigator();
const AuthenticatedStack = createNativeStackNavigator();

function LoggedOutNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="Login"
      screenOptions={{ fullScreenGestureEnabled: true }}
      id="auth-stack"
    >
      <AuthStack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <AuthStack.Screen
        name="Forgot Password"
        component={ForgotPassword}
        options={{ headerShown: false, gestureEnabled: true }}
      />
    </AuthStack.Navigator>
  );
}

function LoggedInNavigator() {
  return (
    <AuthenticatedStack.Navigator
      screenOptions={{ fullScreenGestureEnabled: true }}
      id="authenticated-stack"
    >
      <AuthenticatedStack.Screen
        name="Home"
        component={Home}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </AuthenticatedStack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  return isAuthenticated ? <LoggedInNavigator /> : <LoggedOutNavigator />;
}

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
          <AuthContextProvider>
            <JobProvider>
              <StagingBanner />
              <RootNavigator />
            </JobProvider>
          </AuthContextProvider>
        </SQLiteProvider>
        <StatusBar style="light" />
      </NavigationContainer>
    </Suspense>
  );
}
