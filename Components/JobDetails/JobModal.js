import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Avatar, Card } from "react-native-paper";
import moment from "moment/moment";
import { AntDesign } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import * as ScreenOrientation from "expo-screen-orientation";
import { SafeAreaView } from "react-native-safe-area-context";

import StyleSheet from "../../StyleSheet";
import { useJob } from "../../Components/Context";
import JobNav from "./JobNav";
import Details from "./Details";
import Contacts from "./Contacts";
import Files from "./Files";
import Photos from "./Photos";
import FinalCheckOut from "./FinalCheckOut";
import CheckInOut from "./CheckInOut";
import { selectCheckInOutSqlite } from "../../Database/CheckInOutDatabase";
import { useSQLiteContext } from "expo-sqlite";
import { selectAttachmentSqlite } from "../../Database/AttachmentDatabase";

export default function JobModal({
  visible,
  onDismiss,
  selectedJob,
  selectedContact,
}) {
  const db = useSQLiteContext();
  const { syncVersion } = useJob();
  const [showDetails, setShowDetails] = useState(true);
  const [showContacts, setShowContacts] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showFinalCheckOut, setShowFinalCheckOut] = useState(false);
  const [checkoutFormVisible, setCheckoutFormVisible] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInOutData, setCheckInOutData] = useState([]);
  const [photoAttachments, setPhotoAttachments] = useState([]);
  const [fileAttachments, setFileAttachments] = useState([]);

  useEffect(() => {
    let isMounted = true;
    ScreenOrientation.unlockAsync();

    async function fetchCheckinData() {
      try {
        if (!selectedJob?.[0]?.id) return;

        const checkInInfo = await selectCheckInOutSqlite(
          db,
          "job_purchase_order_id",
          selectedJob[0].id,
          "checkin_date",
          "DESC",
        );

        if (!isMounted) return;

        setCheckInOutData(checkInInfo);

        if (checkInInfo.length > 0) {
          const lastObj = checkInInfo[0];
          setCheckedIn(!lastObj.checking_out);
        } else {
          setCheckedIn(false);
        }
      } catch (error) {
        console.error("Error fetching check-in/out data:", error);
      }
    }

    fetchCheckinData();

    return () => {
      isMounted = false;
    };
  }, [selectedJob, syncVersion]);

  const fetchPhotos = async () => {
    try {
      const photos = await selectAttachmentSqlite(
        db,
        "job_purchase_order_id",
        selectedJob[0].id,
        "type",
        "Photo",
      );
      setPhotoAttachments(photos);
    } catch (error) {
      console.log("Error fetching photos:", error);
    }
  };

  const fetchFiles = async () => {
    try {
      let files = await selectAttachmentSqlite(
        db,
        "job_purchase_order_id",
        selectedJob[0].id,
        "type",
        "File",
      );
      setFileAttachments(files);
    } catch (error) {
      console.log("Error loading attachments:", error);
    }
  };

  if (selectedJob.length === 0) {
    return null;
  } else {
    return (
      <Modal
        presentationStyle="overFullScreen"
        key={selectedJob[0].id}
        visible={visible}
        animationType={"slide"}
        transparent={false}
        onRequestClose={onDismiss}
      >
        <SafeAreaView style={StyleSheet.SafeArea}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
            <ScrollView
              contentContainerStyle={StyleSheet.container}
              keyboardShouldPersistTaps="handled"
              contentInsetAdjustmentBehavior="automatic"
            >
              <View style={StyleSheet.header}>
                <Text
                  style={StyleSheet.TextTitle}
                >{`${selectedJob[0].type || ""}`}</Text>
                <Text
                  style={StyleSheet.TextTitle}
                >{`${selectedJob[0].expanded_id || ""}`}</Text>
              </View>
              <TouchableOpacity style={StyleSheet.closeButton}>
                <AntDesign
                  name="close-circle"
                  size={30}
                  color="grey"
                  onPress={onDismiss}
                />
              </TouchableOpacity>
              <Card style={StyleSheet.jobCard}>
                <Card.Content style={StyleSheet.jobCardContent}>
                  <Avatar.Icon
                    style={StyleSheet.avatarIcon}
                    icon="office-building-marker"
                    size={40}
                  />
                  <View style={StyleSheet.columnView}>
                    <View style={StyleSheet.rowView}>
                      <View style={StyleSheet.columnView}>
                        <Text
                          variant="bodyMedium"
                          style={StyleSheet.jobCardContentLabel}
                        >
                          {selectedJob[0].name || ""}:
                        </Text>
                      </View>
                    </View>
                    <View style={StyleSheet.columnView}>
                      <Text
                        variant="bodyMedium"
                        style={StyleSheet.jobCardContentText}
                      >
                        {selectedJob[0].store_nbr || ""}
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
                        <Text
                          variant="bodyMedium"
                          style={StyleSheet.jobCardContentLabel}
                        >
                          Scheduled:
                        </Text>
                      </View>
                    </View>
                    <View style={StyleSheet.columnView}>
                      <Text
                        variant="bodyMedium"
                        style={StyleSheet.jobCardContentText}
                      >
                        {moment(selectedJob[0].scheduled_date || "").format(
                          "MMM Do YYYY",
                        )}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
                <Card.Content style={StyleSheet.jobCardContent}>
                  <Avatar.Icon
                    style={StyleSheet.avatarIcon}
                    icon="tag-text"
                    size={40}
                  />
                  <View style={StyleSheet.columnView}>
                    <View style={StyleSheet.rowView}>
                      <View style={StyleSheet.columnView}>
                        <Text
                          variant="bodyMedium"
                          style={StyleSheet.jobCardContentLabel}
                        >
                          {selectedJob[0].type || ""}:
                        </Text>
                      </View>
                    </View>
                    <View style={StyleSheet.columnView}>
                      <Text
                        variant="bodyMedium"
                        style={StyleSheet.jobCardContentText}
                      >
                        {selectedJob[0].category || ""}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
              {selectedJob[0].workflow_step_label !== "Completed" && (
                <CheckInOut
                  setShowDetails={setShowDetails}
                  setShowContacts={setShowContacts}
                  setShowFiles={setShowFiles}
                  setShowPhotos={setShowPhotos}
                  setShowFinalCheckOut={setShowFinalCheckOut}
                  setCheckoutFormVisible={setCheckoutFormVisible}
                  jobPurchaseOrderID={selectedJob[0].id}
                  checkedIn={checkedIn}
                  setCheckedIn={setCheckedIn}
                  setCheckInOutData={setCheckInOutData}
                />
              )}

              <Card style={StyleSheet.jobCard}>
                <JobNav
                  showDetails={showDetails}
                  setShowDetails={setShowDetails}
                  showContacts={showContacts}
                  setShowContacts={setShowContacts}
                  showFiles={showFiles}
                  setShowFiles={setShowFiles}
                  showPhotos={showPhotos}
                  setShowPhotos={setShowPhotos}
                  showFinalCheckOut={showFinalCheckOut}
                  setShowFinalCheckOut={setShowFinalCheckOut}
                />
                {showDetails && <Details details={selectedJob} />}
                {showContacts && (
                  <Contacts
                    selectedJob={selectedJob}
                    contacts={selectedContact}
                  />
                )}
                {showFiles && (
                  <Files
                    selectedJob={selectedJob}
                    fetchFiles={fetchFiles}
                    files={fileAttachments}
                  />
                )}
                {showPhotos && (
                  <Photos
                    selectedJob={selectedJob}
                    fetchPhotos={fetchPhotos}
                    images={photoAttachments}
                  />
                )}
                {showFinalCheckOut && (
                  <FinalCheckOut
                    selectedJob={selectedJob}
                    checkoutFormVisible={checkoutFormVisible}
                    setCheckoutFormVisible={setCheckoutFormVisible}
                    checkInOutData={checkInOutData}
                    onDismiss={onDismiss}
                  />
                )}
              </Card>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    );
  }
}
