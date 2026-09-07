import React from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Linking,
} from "react-native";
import * as Application from "expo-application";

import { getMinimums } from "../Database/UpdateGateApi";
import Colors from "../constants/colors";

// Update these with your actual App Store / Play Store URLs before publishing
const IOS_APP_STORE_URL = "https://apps.apple.com/app/ohmly";
const ANDROID_PACKAGE = "com.ohmly.fieldops";
const ANDROID_PLAY_STORE_WEB = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
const ANDROID_PLAY_STORE_MARKET = `market://details?id=${ANDROID_PACKAGE}`;

const DEFAULT_MIN_IOS_VERSION = "16.0";
const DEFAULT_MIN_ANDROID_API = 24;

function compareSemver(a, b) {
  const pa = String(a).split(".").map((x) => parseInt(x, 10) || 0);
  const pb = String(b).split(".").map((x) => parseInt(x, 10) || 0);
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
    await Linking.openURL(canOpenMarket ? ANDROID_PLAY_STORE_MARKET : ANDROID_PLAY_STORE_WEB);
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

let cachedMinimums = null;
const MINIMUMS_TTL_MS = 5 * 60 * 1000;

async function fetchMinimums() {
  if (cachedMinimums && Date.now() - cachedMinimums.fetchedAt < MINIMUMS_TTL_MS) {
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

      const versionTooLow = compareSemver(installedVersion, minimum.minVersion) < 0;

      if (versionTooLow) {
        setState({ status: "required", installedVersion, minVersion: minimum.minVersion });
      } else {
        setState({ status: "ok" });
      }
    } catch (e) {
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
    Platform.OS === "ios" ? DEFAULT_MIN_IOS_VERSION : `API ${DEFAULT_MIN_ANDROID_API}`;

  return (
    <View style={styles.modalPopup}>
      <View style={styles.modalPopupContent}>
        <Text style={styles.TextTitle}>Device Not Supported</Text>
        <Text style={styles.TextDescript}>
          This app requires {osName} {minVersion} or later.{"\n\n"}
          Please upgrade your operating system or use a newer device to continue.
        </Text>
      </View>
    </View>
  );
}

export function UpdateRequiredScreen({ installedVersion, minVersion }) {
  return (
    <View style={styles.modalPopup}>
      <View style={styles.modalPopupContent}>
        <Text style={styles.TextTitle}>Update Required</Text>
        <Text style={styles.TextDescript}>
          To continue using the app, please update to the latest version.{"\n"}
        </Text>
        <Text style={styles.TextDescript}>
          Installed: v{installedVersion}{"\n"}
          Required: v{minVersion}+
        </Text>
        <View style={styles.checkoutFormBtns}>
          <TouchableOpacity onPress={openStoreListing} style={styles.submitBtn}>
            <Text style={styles.logoutBtnText}>Update now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get("window");
let textStyle = 12;
if (width >= 380 && width <= 600) textStyle = 16;
else if (width > 600) textStyle = 20;

const styles = StyleSheet.create({
  TextTitle: {
    color: "#ffffff",
    fontSize: textStyle + 5,
    justifyContent: "flex-start",
  },
  TextDescript: {
    color: Colors.textSecondary,
    fontSize: textStyle,
  },
  checkoutFormBtns: {
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 6,
    shadowOpacity: 0.25,
  },
  logoutBtnText: {
    color: "#ffffff",
    fontSize: textStyle,
  },
  modalPopup: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: width * 0.05,
  },
  modalPopupContent: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 560,
    maxHeight: height * 0.8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  submitBtn: {
    width: width * 0.6,
    backgroundColor: Colors.accent,
    borderRadius: 20,
    elevation: 6,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 6,
    shadowOpacity: 0.25,
    marginTop: height * 0.02,
    height: height * 0.07,
    alignItems: "center",
    justifyContent: "center",
  },
});
