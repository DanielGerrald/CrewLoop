import { FontAwesome } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Dimensions, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import JobsList from "./JobsList";
import CompletedJobs from "./CompletedJobs";
import Profile from "./Profile";
import { useJob } from "../Components/Context";
import { getActiveJobs } from "../Components/constants";
import { useMemo } from "react";

const Tab = createMaterialTopTabNavigator();

const { width } = Dimensions.get("window");
let textStyle = 12;
if (width >= 380 && width <= 600) textStyle = 16;
else if (width > 600) textStyle = 20;

// Not real view styles — a react-navigation screenOptions config object.
const tabNavIcons = {
  tabBarIndicatorStyle: { backgroundColor: "#F47C20" },
  tabBarActiveTintColor: "#F47C20",
  tabBarInactiveTintColor: "#8A95A3",
  tabBarStyle: {
    backgroundColor: "#1E2530",
  },
  tabBarAllowFontScaling: true,
  tabBarLabelStyle: { fontSize: textStyle - 1 },
};

const styles = StyleSheet.create({
  tabBarBadge: {
    color: "#ffffff",
    backgroundColor: "#FF6B6B",
    paddingHorizontal: textStyle * 0.3,
    borderRadius: 50,
  },
});

export default function Home() {
  const { jobResult } = useJob();
  const { bottom } = useSafeAreaInsets();
  const badge = useMemo(() => getActiveJobs(jobResult).length, [jobResult]);

  const screenOptions = useMemo(() => ({
    ...tabNavIcons,
    tabBarStyle: {
      ...tabNavIcons.tabBarStyle,
      paddingBottom: bottom,
      height: 65 + bottom,
    },
  }), [bottom]);

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={screenOptions}
      id="2"
    >
      <Tab.Screen
        name="Jobs"
        component={JobsList}
        options={{
          tabBarLabel: "Jobs",
          tabBarIcon: ({ color, size = 26 }) => (
            <FontAwesome
              name="lightbulb-o"
              size={size}
              color={color}
              style={{ marginLeft: 5 }}
            />
          ),
          tabBarBadge: () =>
            badge > 0 ? (
              <Text style={styles.tabBarBadge}>{badge}</Text>
            ) : null,
        }}
      />
      <Tab.Screen
        name="Completed"
        component={CompletedJobs}
        options={{
          tabBarLabel: "Completed",
          tabBarIcon: ({ color, size = 25 }) => (
            <FontAwesome name="check-square-o" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size = 23 }) => (
            <FontAwesome
              name="user-o"
              size={size}
              color={color}
              style={{ marginLeft: 3 }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
