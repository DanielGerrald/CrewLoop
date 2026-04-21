import { Alert } from "react-native";

let shownAlerts = {};

export function showOnceAlert(key, title, message) {
  if (shownAlerts[key]) return;

  shownAlerts[key] = true;
  setTimeout(() => {
    shownAlerts[key] = false;
  }, 5000);

  Alert.alert(title, message);
}
