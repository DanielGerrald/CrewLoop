import React from "react";
import { Platform, View, Text, TouchableOpacity, Linking } from "react-native";
import * as Application from "expo-application";

import StyleSheet from "../StyleSheet"; // adjust path if needed
import { getMinimums } from "../Database/UpdateGateApi";

const IOS_APP_STORE_URL = "https://apps.apple.com/app/id6743240172";
const ANDROID_PACKAGE = "com.lightserve.lightserveConnect";
const ANDROID_PLAY_STORE_WEB = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
const ANDROID_PLAY_STORE_MARKET = `market://details?id=${ANDROID_PACKAGE}`;

// Hard-coded OS minimums — used when the backend doesn't return OS version fields.
// iOS 16 and Android API 24 (7.0) match Expo SDK 55 minimum requirements.
const DEFAULT_MIN_IOS_VERSION = "16.0";
const DEFAULT_MIN_ANDROID_API = 35; // Temporarily raised for OS gate testing — revert to 24 (or your real minimum) when done

function compareSemver(a, b) {
  const pa = String(a)
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
  const pb = String(b)
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
  const len = Math.max(pa.length, pb.length);

  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

async function openStoreListing() {
  if (Platform.OS === "android") {
    const canOpenMarket = await Linking.canOpenURL(ANDROID_PLAY_STORE_MARKET);
    await Linking.openURL(
      canOpenMarket ? ANDROID_PLAY_STORE_MARKET : ANDROID_PLAY_STORE_WEB,
    );
    return;
  }
  await Linking.openURL(IOS_APP_STORE_URL);
}

function isOsSupported(minimum) {
  if (Platform.OS === "ios") {
    const minIos = minimum.minIosVersion ?? DEFAULT_MIN_IOS_VERSION;
    return compareSemver(String(Platform.Version), minIos) >= 0;
  }
  if (Platform.OS === "android") {
    const minApi = minimum.minAndroidApi ?? DEFAULT_MIN_ANDROID_API;
    return (Platform.Version ?? 0) >= minApi;
  }
  return true;
}

// In-memory cache (avoid calling API constantly)
let cachedMinimums = null;
const MINIMUMS_TTL_MS = 5 * 60 * 1000;

async function fetchMinimums() {
  if (
    cachedMinimums &&
    Date.now() - cachedMinimums.fetchedAt < MINIMUMS_TTL_MS
  ) {
    return cachedMinimums.value;
  }

  const value = await getMinimums();
  cachedMinimums = { value, fetchedAt: Date.now() };
  return value;
}

export function useForcedUpdateGate() {
  const [state, setState] = React.useState({ status: "checking" });

  const check = React.useCallback(async () => {
    try {
      const installedVersion = Application.nativeApplicationVersion ?? "0.0.0";
      const minimum = await fetchMinimums();

      if (!isOsSupported(minimum)) {
        setState({ status: "unsupported_os" });
        return;
      }

      const versionTooLow =
        compareSemver(installedVersion, minimum.minVersion) < 0;

      if (versionTooLow) {
        setState({
          status: "required",
          installedVersion,
          minVersion: minimum.minVersion,
        });
      } else {
        setState({ status: "ok" });
      }
    } catch (e) {
      // dev: fail-open so you don't lock yourself out if local server is off
      if (__DEV__) {
        setState({ status: "ok" });
        return;
      }
      setState({ status: "error", error: e?.message ?? "Unknown error" });
    }
  }, []);

  React.useEffect(() => {
    check();
  }, [check]);

  return { state, retry: check };
}

export function UnsupportedOSScreen() {
  const osName = Platform.OS === "ios" ? "iOS" : "Android";
  const minVersion =
    Platform.OS === "ios"
      ? DEFAULT_MIN_IOS_VERSION
      : `API ${DEFAULT_MIN_ANDROID_API}`;

  return (
    <View style={StyleSheet.modalPopup}>
      <View style={StyleSheet.modalPopupContent}>
        <Text style={StyleSheet.TextTitle}>Device Not Supported</Text>

        <Text style={StyleSheet.TextDescript}>
          This app requires {osName} {minVersion} or later.{"\n\n"}
          Please upgrade your operating system or use a newer device to continue.
        </Text>
      </View>
    </View>
  );
}

export function UpdateRequiredScreen({ installedVersion, minVersion }) {
  return (
    <View style={StyleSheet.modalPopup}>
      <View style={StyleSheet.modalPopupContent}>
        <Text style={StyleSheet.TextTitle}>Update Required</Text>

        <Text style={StyleSheet.TextDescript}>
          To continue using the app, please update to the latest version.
          {"\n"}
        </Text>

        <Text style={StyleSheet.TextDescript}>
          Installed: v{installedVersion}
          {"\n"}
          Required: v{minVersion}+
        </Text>

        <View style={StyleSheet.checkoutFormBtns}>
          <TouchableOpacity
            onPress={openStoreListing}
            style={StyleSheet.submitBtn}
          >
            <Text style={StyleSheet.logoutBtnText}>Update now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
