import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, AppState } from "react-native";
import { navigationRef } from "./NavigationRef";
import moment from "moment";
import { format } from "date-fns";

import { useSQLiteContext } from "expo-sqlite";
import {
  lastLoggedinUserSqlite,
  updateUserSqlite,
} from "../Database/UserDatabase";

export function useSessionManager() {
  const db = useSQLiteContext();
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const clearSessionInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log("|| Session check paused");
    }
  };

  const startSessionInterval = () => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(manageSession, 300_000); // 5 min
      console.log("|> Session check running every 5 minutes");
    }
  };

  const handleLogout = async (lastUser) => {
    await updateUserSqlite(db, { ...lastUser, logged_in: 0 });
    await AsyncStorage.removeItem("userName");
    clearSessionInterval();
    Alert.alert("Session has expired. Please login again.");
    if (navigationRef.isReady()) navigationRef.navigate("Login");
  };

  const manageSession = async () => {
    try {
      const lastLoggedIn = await lastLoggedinUserSqlite(db);

      if (!lastLoggedIn || lastLoggedIn.logged_in !== 1) {
        clearSessionInterval();
        if (navigationRef.isReady()) navigationRef.navigate("Login");
        return;
      }

      if (await isTokenExpired(lastLoggedIn.token_expire_date)) {
        await handleLogout(lastLoggedIn);
        return;
      }

      if (navigationRef.isReady()) navigationRef.navigate("Home");
      const unixTimestampMilliseconds = lastLoggedIn.token_expire_date * 1000;
      const DateTime = format(
        new Date(unixTimestampMilliseconds),
        "MMM d, yyyy h:mm a",
      );
      console.log("Token Valid through:", DateTime);
      startSessionInterval();
    } catch (error) {
      console.error("Error managing session:", error);
      Alert.alert("An error occurred. Please try again.");
    }
  };

  // Watch app state to pause/resume interval
  useEffect(() => {
    manageSession();
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        clearSessionInterval();
      }

      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        manageSession();
      }

      appState.current = nextAppState;
    });

    return () => {
      clearSessionInterval();
      subscription.remove();
    };
  }, []);
}

export async function isTokenExpired(tokenExpireDate) {
  if (!tokenExpireDate) return true;
  return tokenExpireDate < moment().unix();
}
