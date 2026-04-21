import * as Updates from "expo-updates";
import Constants from "expo-constants";

const arcApiKey = Constants.expoConfig?.extra?.arcApiKey;

export const environment = getEnvironment();

function getEnvironment() {
  //check release channel
  switch (Updates.channel) {
    case "production":
      return {
        envName: "production",
        icon: "✅",
        apiUrl: "https://arc.light-serve.com/lightserveConnectApi",
        enableHiddenFeatures: false,
        apikey: arcApiKey,
        staging: false,
      }; // prod env settings

    case "staging":
      return {
        envName: "staging",
        icon: "🚧",
        apiUrl: "https://staging.light-serve.dev/lightserveConnectApi",
        enableHiddenFeatures: true,
        apikey: arcApiKey,
        staging: true,
      }; // stage env settings

    case "development":
      return {
        envName: "development",
        icon: "⚙️",
        apiUrl: "https://staging.light-serve.dev/lightserveConnectApi",
        enableHiddenFeatures: true,
        apikey: arcApiKey,
        staging: true,
      }; // dev env settings

    default:
      return {
        envName: "default",
        icon: "📜",
        apiUrl: "https://staging.light-serve.dev/lightserveConnectApi",
        enableHiddenFeatures: true,
        apikey: arcApiKey,
        staging: true,
      }; // default env settings
  }
}
