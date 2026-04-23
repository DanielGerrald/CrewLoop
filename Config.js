import * as Updates from "expo-updates";

export const environment = getEnvironment();

function getEnvironment() {
  switch (Updates.channel) {
    case "production":
      return {
        envName: "production",
        icon: "✅",
        apiUrl: "https://api.crewloop-demo.com/crewloopApi",
        enableHiddenFeatures: false,
        apikey: null,
        staging: false,
      };

    case "staging":
      return {
        envName: "staging",
        icon: "🚧",
        apiUrl: "https://staging.crewloop-demo.com/crewloopApi",
        enableHiddenFeatures: true,
        apikey: null,
        staging: true,
      };

    case "development":
      return {
        envName: "development",
        icon: "⚙️",
        // Point to local mock API server — run `npm run mock-api` before launching the app
        apiUrl: "http://localhost:3001",
        enableHiddenFeatures: true,
        apikey: null,
        staging: true,
      };

    default:
      return {
        envName: "demo",
        icon: "🎯",
        // Default also points to local mock API for easy employer demos
        apiUrl: "http://localhost:3001",
        enableHiddenFeatures: true,
        apikey: null,
        staging: true,
      };
  }
}
