import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { format } from "date-fns";

import { lastLoggedinUserSqlite, updateUserSqlite } from "../Database/UserDatabase";

const SESSION_CHECK_INTERVAL_MS = 300_000; // 5 min

export async function isTokenExpired(tokenExpireDate) {
  if (!tokenExpireDate) return true;
  return tokenExpireDate < moment().unix();
}

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: (_userData) => {},
  logout: () => {},
  refreshUser: () => {},
});

export function AuthContextProvider({ children }) {
  const db = useSQLiteContext();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const clearSessionInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startSessionInterval = () => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(checkSession, SESSION_CHECK_INTERVAL_MS);
    }
  };

  const checkSession = useCallback(async () => {
    try {
      const lastLoggedIn = await lastLoggedinUserSqlite(db);

      if (!lastLoggedIn || lastLoggedIn.logged_in !== 1) {
        clearSessionInterval();
        setUser(null);
        return;
      }

      if (await isTokenExpired(lastLoggedIn.token_expire_date)) {
        await updateUserSqlite(db, { ...lastLoggedIn, logged_in: 0 });
        clearSessionInterval();
        setUser(null);
        return;
      }

      setUser(lastLoggedIn);
      const expiresAt = lastLoggedIn.token_expire_date * 1000;
      console.log(
        "Token valid through:",
        format(new Date(expiresAt), "MMM d, yyyy h:mm a"),
      );
      startSessionInterval();
    } catch (error) {
      console.error("Error checking session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  const login = useCallback((userData) => {
    setUser(userData);
    startSessionInterval();
  }, []);

  const logout = useCallback(async () => {
    clearSessionInterval();
    if (user) {
      await updateUserSqlite(db, { ...user, logged_in: 0 });
    }
    await AsyncStorage.removeItem("userName");
    setUser(null);
  }, [db, user]);

  const refreshUser = useCallback(async () => {
    const lastLoggedIn = await lastLoggedinUserSqlite(db);
    if (lastLoggedIn && lastLoggedIn.logged_in === 1) {
      setUser(lastLoggedIn);
    }
  }, [db]);

  useEffect(() => {
    checkSession();

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
        checkSession();
      }

      appState.current = nextAppState;
    });

    return () => {
      clearSessionInterval();
      subscription.remove();
    };
  }, [checkSession]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
