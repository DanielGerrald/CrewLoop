import * as Updates from "expo-updates";

export const environment = getEnvironment();

function getEnvironment() {
  switch (Updates.channel) {
    case "production":
      return {
        envName: "production",
        icon: "✅",
        apiUrl: "https://crewloop-9564f-default-rtdb.firebaseio.com",
        enableHiddenFeatures: false,
        apikey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        staging: false,
      };

    case "staging":
      return {
        envName: "staging",
        icon: "🚧",
        apiUrl: "https://crewloop-9564f-default-rtdb.firebaseio.com",
        enableHiddenFeatures: true,
        apikey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        staging: true,
      };

    case "development":
      return {
        envName: "development",
        icon: "⚙️",
        apiUrl: "https://crewloop-9564f-default-rtdb.firebaseio.com",
        enableHiddenFeatures: true,
        apikey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        staging: true,
      };

    default:
      return {
        envName: "demo",
        icon: "🎯",
        apiUrl: "https://crewloop-9564f-default-rtdb.firebaseio.com",
        enableHiddenFeatures: true,
        apikey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        staging: true,
      };
  }
}
