import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useMemo } from "react";

import StyleSheet from "../StyleSheet";
import JobCard from "../Components/JobCard";
import Loading from "../Components/Loading";
import { useJob } from "../Components/Context";
import { Avatar, Card, Text } from "react-native-paper";
import AppSyncManager from "../Components/AppSyncManager";
import { BLURHASH, SAFE_AREA_EDGES, getActiveJobs } from "../Components/constants";

export default function JobsList() {
  const { jobResult, isJobsLoading } = useJob();

  const jobData = useMemo(() => getActiveJobs(jobResult), [jobResult]);

  if (isJobsLoading) {
    return <Loading />;
  }

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
          <Text style={StyleSheet.Text}>Active Jobs</Text>
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
                There are currently no active jobs.
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
