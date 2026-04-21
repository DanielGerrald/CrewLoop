import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Platform,
} from "react-native";
import * as React from "react";
import { useState } from "react";
import { IconButton } from "react-native-paper";

import StyleSheet from "../../StyleSheet";
import CustomInput from "../CustomInput";
import {
  insertCheckInOutSqlite,
  postCheckInOutApi,
} from "../../Database/CheckInOutDatabase";
import { lastLoggedinUserSqlite } from "../../Database/UserDatabase";
import { useSQLiteContext } from "expo-sqlite";
import { getUnixTime } from "date-fns";
import * as Network from "expo-network";

export default function CheckInOut({
  setShowDetails,
  setShowContacts,
  setShowFiles,
  setShowPhotos,
  setShowFinalCheckOut,
  setCheckoutFormVisible,
  jobPurchaseOrderID,
  checkedIn,
  setCheckedIn,
  setCheckInOutData,
}) {
  const db = useSQLiteContext();

  const [checkOutQuestion, setCheckOutQuestion] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hideModal = () => {
    setModalVisible(false);
    setCommentVisible(false);
    setCheckOutQuestion(false);
  };

  async function onSubmitCheckin(isCheckingOut) {
    if (submitting) return;

    setSubmitting(true);
    try {
      const userData = await lastLoggedinUserSqlite(db);

      const checkinDate = getUnixTime(new Date());
      const checkingOutFlag = isCheckingOut ? 1 : 0;

      const payload = {
        comment,
        checkin_date: checkinDate,
        job_purchase_order_id: jobPurchaseOrderID,
        checking_out: checkingOutFlag,
        contractor_tech_id: userData.user_id,
        submittedToARC: "",
      };

      const networkState = await Network.getNetworkStateAsync();
      const online = Boolean(
        networkState?.isConnected && networkState?.isInternetReachable,
      );

      if (online) {
        try {
          const success = await postCheckInOutApi(
            payload,
            userData.access_token,
          );
          if (success) {
            payload.submittedToARC = "Yes";
            await insertCheckInOutSqlite(db, payload);
          } else {
            payload.submittedToARC = "Pending";
            await insertCheckInOutSqlite(db, payload);
          }
        } catch {
          payload.submittedToARC = "Pending";
          await insertCheckInOutSqlite(db, payload);
        }
      } else {
        payload.submittedToARC = "Pending";
        await insertCheckInOutSqlite(db, payload);
      }

      setCheckInOutData((prevData) => [
        ...prevData,
        {
          id: checkinDate,
          comment: payload.comment,
          checkin_date: payload.checkin_date,
          checking_out: payload.checking_out,
        },
      ]);

      setComment("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {checkedIn && (
        <TouchableOpacity
          onPress={() => {
            setShowDetails(false);
            setShowContacts(false);
            setShowFiles(false);
            setShowPhotos(false);
            setShowFinalCheckOut(true);
            setCheckOutQuestion(true);
            setCommentVisible(false);
            setModalVisible(true);
          }}
          style={StyleSheet.checkInOutBtn}
        >
          <Text style={StyleSheet.logoutBtnText}>Check Out</Text>
        </TouchableOpacity>
      )}

      {!checkedIn && (
        <TouchableOpacity
          onPress={() => {
            setShowDetails(true);
            setShowContacts(false);
            setShowFiles(false);
            setShowPhotos(false);
            setShowFinalCheckOut(false);
            setCheckOutQuestion(false);
            setCommentVisible(true);
            setModalVisible(true);
          }}
          style={StyleSheet.checkInOutBtn}
        >
          <Text style={StyleSheet.logoutBtnText}>Check In</Text>
        </TouchableOpacity>
      )}

      <Modal
        key={jobPurchaseOrderID}
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={hideModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 5 : 0}
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={StyleSheet.modalPopup}>
              <View style={StyleSheet.modalPopupContent}>
                {checkOutQuestion && (
                  <>
                    <Text style={StyleSheet.Text}>
                      Are you performing a final checkout?
                    </Text>
                    <View style={StyleSheet.checkoutRow}>
                      <View style={StyleSheet.checkoutColumn}>
                        <IconButton
                          icon="check"
                          size={30}
                          iconColor={"white"}
                          onPress={() => {
                            setShowFinalCheckOut(true);
                            setCheckoutFormVisible(true);
                            hideModal();
                          }}
                        />
                        <Text style={StyleSheet.TextDescript}>Yes</Text>
                      </View>
                      <View style={StyleSheet.checkoutColumn}>
                        <IconButton
                          icon="close"
                          size={30}
                          iconColor={"white"}
                          onPress={() => {
                            setShowFinalCheckOut(true);
                            setCheckoutFormVisible(false);
                            setCommentVisible(true);
                            setCheckOutQuestion(false);
                          }}
                        />
                        <Text style={StyleSheet.TextDescript}>No</Text>
                      </View>
                    </View>
                  </>
                )}

                {commentVisible && (
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    style={StyleSheet.modalScroll}
                    contentContainerStyle={StyleSheet.modalScrollContent}
                  >
                    <CustomInput
                      label="comment"
                      style={StyleSheet.inputAreaView}
                      value={comment}
                      placeholder="comments..."
                      multiline={true}
                      onChangeText={setComment}
                      maxLength={300}
                    />
                    <View style={StyleSheet.checkoutFormBtns}>
                      <TouchableOpacity
                        onPress={async () => {
                          await onSubmitCheckin(checkedIn);
                          hideModal();
                          setCheckedIn((prevState) => !prevState);
                        }}
                        style={StyleSheet.submitBtn}
                        disabled={submitting}
                      >
                        <Text style={StyleSheet.logoutBtnText}>
                          {submitting ? "Submitting..." : "Submit Comment"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={hideModal}
                        style={StyleSheet.submitBtn}
                        disabled={submitting}
                      >
                        <Text style={StyleSheet.logoutBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
