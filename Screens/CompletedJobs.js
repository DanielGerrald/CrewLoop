import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Avatar, Card } from "react-native-paper";
import { useMemo } from "react";

import StyleSheet from "../StyleSheet";
import JobCard from "../Components/JobCard";
import { useJob } from "../Components/Context";
import AppSyncManager from "../Components/AppSyncManager";
import { BLURHASH, SAFE_AREA_EDGES, getCompletedJobs } from "../Components/constants";

export default function CompletedJobs() {
  const { jobResult } = useJob();

  const jobData = useMemo(() => getCompletedJobs(jobResult), [jobResult]);

  return (
    <SafeAreaView style={StyleSheet.SafeArea} edges={SAFE_AREA_EDGES}>
      <AppSyncManager>
        <View style={StyleSheet.header}>
          <Image
            style={StyleSheet.logo}
            source={require("../assets/logo.png")}
            contentFit="contain"
            placeholder={BLURHASH}
          />
          <Text style={StyleSheet.Text}>Completed Jobs</Text>
        </View>
        {jobData.length === 0 ? (
          <Card style={StyleSheet.compJobCard}>
            <Card.Content style={StyleSheet.jobCardContent}>
              <Avatar.Icon
                style={StyleSheet.avatarIcon}
                icon="check-decagram"
                size={50}
              />
              <Text variant="bodyMedium" style={StyleSheet.jobCardContentText}>
                There are currently no completed jobs.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <JobCard jobData={jobData} />
        )}
      </AppSyncManager>
    </SafeAreaView>
  );
}
