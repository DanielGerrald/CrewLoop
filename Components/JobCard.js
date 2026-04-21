import * as React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Card, Avatar } from "react-native-paper";
import moment from "moment";
import { useState } from "react";

import StyleSheet from "../StyleSheet";
import JobModal from "./JobDetails/JobModal";
import { selectWorkOrderSqlite } from "../Database/WorkOrderDatabase";
import { selectContactSqlite } from "../Database/ContactDatabase";
import { useSQLiteContext } from "expo-sqlite";

export default function JobCard({ jobData }) {
  const db = useSQLiteContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState([]);
  const [selectedContact, setSelectedContact] = useState([]);

  const showModal = async (jobId) => {
    setModalVisible(false);
    setSelectedJob(await selectWorkOrderSqlite(db, "id", jobId));
    setSelectedContact(
      await selectContactSqlite(db, "job_purchase_order_id", jobId),
    );
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    setSelectedJob([]);
    setSelectedContact([]);
  };

  return (
    <>
      {jobData.map((job) => (
        <TouchableOpacity
          style={StyleSheet.jobCardTouchable}
          key={job.id}
          onPress={() => showModal(job.id)}
        >
          <Card style={StyleSheet.jobCard}>
            <Card.Content style={StyleSheet.jobCardContent}>
              <View style={StyleSheet.columnView}>
                <View style={StyleSheet.rowView}>
                  <View style={StyleSheet.columnView}>
                    <Text style={StyleSheet.jobCardContentTitle}>
                      {`${job.type}#  `}
                      {job.expanded_id}
                    </Text>
                  </View>
                </View>
                <View style={StyleSheet.columnView}>
                  <Text style={StyleSheet.jobCardContentTitleSub}>
                    {job.category}
                  </Text>
                </View>
              </View>
            </Card.Content>

            <Card.Content style={StyleSheet.jobCardContent}>
              <Avatar.Icon
                style={StyleSheet.avatarIcon}
                icon="office-building-marker"
                size={40}
              />
              <View style={StyleSheet.columnView}>
                <View style={StyleSheet.rowView}>
                  <View style={StyleSheet.columnView}>
                    <Text style={StyleSheet.jobCardContentLabel}>
                      {`${job.name}:`}
                    </Text>
                  </View>
                </View>
                <View style={StyleSheet.columnView}>
                  <Text style={StyleSheet.jobCardContentText}>
                    {job.store_nbr}
                  </Text>
                </View>
              </View>
            </Card.Content>

            <Card.Content style={StyleSheet.jobCardContent}>
              <Avatar.Icon
                style={StyleSheet.avatarIcon}
                icon="map-marker"
                size={40}
              />
              <View style={StyleSheet.columnView}>
                <View style={StyleSheet.rowView}>
                  <View style={StyleSheet.columnView}>
                    <Text style={StyleSheet.jobCardContentLabel}>Address:</Text>
                  </View>
                </View>
                <View style={StyleSheet.columnView}>
                  <Text style={StyleSheet.jobCardContentText}>
                    {job.addr_1}
                    {job.addr_2 && (
                      <>
                        {"\n"}
                        {job.addr_2}
                      </>
                    )}
                    {job.addr_3 && (
                      <>
                        {"\n"}
                        {job.addr_3}
                      </>
                    )}
                    {"\n"}
                    {job.city}, {job.state} {job.zip}
                  </Text>
                </View>
              </View>
            </Card.Content>

            <Card.Content style={StyleSheet.jobCardContent}>
              <Avatar.Icon
                style={StyleSheet.avatarIcon}
                icon="calendar-clock"
                size={40}
              />
              <View style={StyleSheet.columnView}>
                <View style={StyleSheet.rowView}>
                  <View style={StyleSheet.columnView}>
                    <Text style={StyleSheet.jobCardContentLabel}>
                      Scheduled:
                    </Text>
                  </View>
                </View>
                <View style={StyleSheet.columnView}>
                  <Text style={StyleSheet.jobCardContentText}>
                    {moment(job.scheduled_date).format("MMM Do YYYY")}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      ))}
      <JobModal
        visible={modalVisible}
        onDismiss={hideModal}
        selectedJob={selectedJob}
        selectedContact={selectedContact}
      />
    </>
  );
}
