import * as React from "react";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar } from "react-native-paper";
import { format, fromUnixTime, getUnixTime } from "date-fns";

import StyleSheet from "../../StyleSheet";
import CustomInput from "../CustomInput";
import SignatureScreen from "../../Screens/SignatureScreen";
import {
  insertFinalCheckOutSqlite,
  postFinalCheckListApi,
  postFinalCheckoutApi,
  updateFinalCheckOutSqlite,
} from "../../Database/FinalCheckOutDatabase";
import {
  selectWorkOrderSqlite,
  updateWorkOrderSqlite,
} from "../../Database/WorkOrderDatabase";
import { lastLoggedinUserSqlite } from "../../Database/UserDatabase";
import { useSQLiteContext } from "expo-sqlite";
import * as Network from "expo-network";
import { useJob } from "../Context";

function SummaryRow({ icon, label, value }) {
  return (
    <View style={StyleSheet.workLogComment}>
      <View style={StyleSheet.rowView}>
        <Avatar.Icon
          style={StyleSheet.avatarIconCheckout}
          icon={icon}
          size={30}
        />
        <Text style={StyleSheet.TextDescript}>
          {label}:{"\n"}
          {` ${value}`}
        </Text>
      </View>
    </View>
  );
}

export default function FinalCheckOut({
  checkoutFormVisible,
  setCheckoutFormVisible,
  checkInOutData,
  finalCheckoutData,
  selectedJob,
  onDismiss,
}) {
  const db = useSQLiteContext();
  const { setJobResult } = useJob();
  const [workLog, setWorkLog] = useState(false);
  const [servicePerf, setServicePerf] = useState(false);
  const [materialInst, setMaterialInst] = useState(false);
  const [walkthrough, setWalkthrough] = useState(false);
  const [returnNeeded, setReturnNeeded] = useState(false);
  const [showSignatureScreen, setShowSignatureScreen] = useState(false);
  const [signature, setSignature] = useState("");
  const [forceValidate, setForceValidate] = useState(false);
  const [formData, setFormData] = useState({
    service_perf: "",
    desc_service_perf: "",
    material_inst: "",
    desc_material_inst: "",
    workOrder_100: "",
    walkThrough_comp: "",
    return_needed: "",
    desc_return_needed: "",
    desc_misc_notes: "",
    manager_name: "",
    signature_base64: "",
    signature_size: "",
    signature_md5: "",
    signature_modification_time: "",
    job_purchase_order_id: "",
  });

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  async function onSubmit() {
    setForceValidate(true);
    if (!servicePerf) setServicePerf(true);
    if (!materialInst) setMaterialInst(true);

    const boolToString = (val) => (val ? "1" : "0");

    const payload = {
      ...formData,
      service_perf: servicePerf,
      material_inst: materialInst,
      workOrder_100: "1",
      walkThrough_comp: walkthrough,
      return_needed: returnNeeded,
      signature_base64: signature,
      job_purchase_order_id: selectedJob[0]?.id,
    };

    const requiredFields = [
      "desc_service_perf",
      "desc_material_inst",
      "manager_name",
    ];

    const missingFields = requiredFields.filter(
      (field) => !payload[field] || !payload[field].trim(),
    );

    if (missingFields.length > 0) {
      Alert.alert("Please fill in all required fields.");
      return;
    }
    if (
      servicePerf === false ||
      materialInst === false ||
      walkthrough === false
    ) {
      Alert.alert("Please fill in all required fields");
      return;
    }

    if (!signature) {
      Alert.alert("Missing Signature", "Manager signature is required.");
      return;
    }

    setForceValidate(false);

    try {
      const userData = await lastLoggedinUserSqlite(db);
      const apiPayload = {
        ...payload,
        service_perf: boolToString(servicePerf),
        material_inst: boolToString(materialInst),
        workOrder_100: "1",
        walkThrough_comp: boolToString(walkthrough),
        return_needed: boolToString(returnNeeded),
        modified_date: getUnixTime(new Date()),
        submittedToARC: "Pending",
      };

      await insertFinalCheckOutSqlite(db, apiPayload);
      await updateWorkOrderSqlite(
        db,
        "workflow_step_label",
        "Completed",
        "id",
        apiPayload.job_purchase_order_id,
      );

      const sqliteJobs = await selectWorkOrderSqlite(
        db,
        "user_id",
        userData.user_id,
      );
      setJobResult(sqliteJobs);

      const networkState = await Network.getNetworkStateAsync();
      const online = Boolean(
        networkState?.isConnected && networkState?.isInternetReachable,
      );
      let submittedStatus = "Pending";

      if (online) {
        try {
          const listRes = await postFinalCheckListApi(
            userData.access_token,
            apiPayload,
          );
          if (listRes) {
            submittedStatus = "Yes";
            try {
              await postFinalCheckoutApi(
                userData.access_token,
                apiPayload.desc_misc_notes,
                apiPayload.job_purchase_order_id,
              );
            } catch {
              console.log(
                "postFinalCheckoutApi failed after posting the final check list succeeded",
              );
            }
          }
        } catch {
          console.log("postFinalCheckListApi failed");
          submittedStatus = "Pending";
        }
      }

      await updateFinalCheckOutSqlite(
        db,
        "submittedToARC",
        submittedStatus,
        "job_purchase_order_id",
        apiPayload.job_purchase_order_id,
      );

      setCheckoutFormVisible(false);
      onDismiss();
    } catch (err) {
      Alert.alert("Submission Error", err.message);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={"height"}>
      <ScrollView contentContainerStyle={StyleSheet.container}>
        <View style={StyleSheet.jobNavContent}>
          <View style={StyleSheet.rowView}>
            <Text style={StyleSheet.switchLabel}>Work Log</Text>
            <Switch
              style={StyleSheet.switch}
              value={workLog}
              onValueChange={(value) => setWorkLog(value)}
              thumbColor={workLog ? "#F47C20" : "#f4f3f4"}
            />
          </View>
          {workLog && (
            <>
              {checkInOutData.map((checkin) => (
                <View style={StyleSheet.workLogComment} key={checkin.id}>
                  <View style={StyleSheet.rowView}>
                    <Avatar.Icon
                      style={StyleSheet.avatarIconCheckout}
                      icon="message-reply-text"
                      size={30}
                    />
                    {checkin.checking_out === 0 && (
                      <Text style={StyleSheet.TextDescript}>
                        Check in comments:
                        {"\n"}
                        {` ${checkin.comment || "No Comment Left"}`}
                      </Text>
                    )}
                    {checkin.checking_out === 1 && (
                      <Text style={StyleSheet.TextDescript}>
                        Check out comments:
                        {"\n"}
                        {` ${checkin.comment || "No Comment Left"}`}
                      </Text>
                    )}
                  </View>
                  <View style={StyleSheet.rowView}>
                    <Avatar.Icon
                      style={StyleSheet.avatarIconCheckout}
                      icon="clipboard-text-clock"
                      size={30}
                    />
                    {checkin.checking_out === 0 && (
                      <Text style={StyleSheet.TextDescript}>
                        Check in time:
                        {"\n"}
                        {format(
                          fromUnixTime(checkin.checkin_date),
                          "MMM d, yyyy h:mm a",
                        )}
                      </Text>
                    )}
                    {checkin.checking_out === 1 && (
                      <Text style={StyleSheet.TextDescript}>
                        Check out time:
                        {"\n"}
                        {format(
                          fromUnixTime(checkin.checkin_date),
                          "MMM d, yyyy h:mm a",
                        )}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}

          {!checkoutFormVisible && finalCheckoutData && (
            <>
              <View style={StyleSheet.horizontalRule} />
              <Text style={StyleSheet.TextTitle}>Final Checkout Summary</Text>
              <View style={StyleSheet.horizontalRule} />

              {finalCheckoutData.modified_date ? (
                <SummaryRow
                  icon="calendar-check"
                  label="Completed"
                  value={format(
                    fromUnixTime(finalCheckoutData.modified_date),
                    "MMM d, yyyy h:mm a",
                  )}
                />
              ) : null}

              <SummaryRow
                icon="wrench"
                label="Service Performed"
                value={finalCheckoutData.service_perf === "1" ? "Yes" : "No"}
              />
              {finalCheckoutData.service_perf === "1" &&
                finalCheckoutData.desc_service_perf ? (
                <SummaryRow
                  icon="text"
                  label="Service Description"
                  value={finalCheckoutData.desc_service_perf}
                />
              ) : null}

              <SummaryRow
                icon="package-variant-closed"
                label="Material Installed"
                value={finalCheckoutData.material_inst === "1" ? "Yes" : "No"}
              />
              {finalCheckoutData.material_inst === "1" &&
                finalCheckoutData.desc_material_inst ? (
                <SummaryRow
                  icon="text"
                  label="Material Description"
                  value={finalCheckoutData.desc_material_inst}
                />
              ) : null}

              <SummaryRow
                icon="walk"
                label="Walkthrough Complete"
                value={
                  finalCheckoutData.walkThrough_comp === "1" ? "Yes" : "No"
                }
              />

              <SummaryRow
                icon="keyboard-return"
                label="Return Needed"
                value={finalCheckoutData.return_needed === "1" ? "Yes" : "No"}
              />
              {finalCheckoutData.return_needed === "1" &&
                finalCheckoutData.desc_return_needed ? (
                <SummaryRow
                  icon="text"
                  label="Return Reason"
                  value={finalCheckoutData.desc_return_needed}
                />
              ) : null}

              {finalCheckoutData.desc_misc_notes ? (
                <SummaryRow
                  icon="note-text"
                  label="Misc Notes"
                  value={finalCheckoutData.desc_misc_notes}
                />
              ) : null}

              <View style={StyleSheet.horizontalRule} />

              <SummaryRow
                icon="account-tie"
                label="Manager Sign-off"
                value={finalCheckoutData.manager_name}
              />

              {finalCheckoutData.signature_base64 ? (
                <View style={{ alignItems: "center", marginTop: 10, width: "100%" }}>
                  <Text style={StyleSheet.textMuted}>Signature</Text>
                  <View style={{ width: "90%", backgroundColor: "#ffffff", borderRadius: 8, marginTop: 8, padding: 4 }}>
                    <Image
                      source={{ uri: finalCheckoutData.signature_base64 }}
                      style={{ width: "100%", height: 120 }}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              ) : null}
            </>
          )}

          {checkoutFormVisible && (
            <>
              <View style={StyleSheet.rowView}>
                <Text style={StyleSheet.switchLabel}>Service Performed *</Text>
                <Switch
                  style={StyleSheet.switch}
                  value={servicePerf}
                  onValueChange={(value) => setServicePerf(value)}
                  thumbColor={servicePerf ? "#01ab52" : "#f4f3f4"}
                />
              </View>
              {servicePerf && (
                <CustomInput
                  label="desc_service_perf"
                  required={true}
                  forceValidate={forceValidate}
                  style={StyleSheet.inputAreaView}
                  value={formData.desc_service_perf}
                  placeholder="Describe service performed..."
                  multiline={true}
                  onChangeText={(text) => {
                    handleInputChange("desc_service_perf", text);
                  }}
                  maxLength={40}
                />
              )}

              <View style={StyleSheet.rowView}>
                <Text style={StyleSheet.switchLabel}>Material Installed *</Text>
                <Switch
                  style={StyleSheet.switch}
                  value={materialInst}
                  onValueChange={(value) => setMaterialInst(value)}
                  thumbColor={materialInst ? "#F47C20" : "#f4f3f4"}
                />
              </View>
              {materialInst && (
                <CustomInput
                  label="desc_material_inst"
                  required={true}
                  forceValidate={forceValidate}
                  style={StyleSheet.inputAreaView}
                  value={formData.desc_material_inst}
                  placeholder="Describe materials installed..."
                  multiline={true}
                  onChangeText={(text) => {
                    handleInputChange("desc_material_inst", text);
                  }}
                  maxLength={40}
                />
              )}
              <View style={StyleSheet.rowView}>
                <Text style={StyleSheet.switchLabel}>
                  Walkthrough Complete *
                </Text>
                <Switch
                  style={StyleSheet.switch}
                  value={walkthrough}
                  onValueChange={(value) => setWalkthrough(value)}
                  thumbColor={walkthrough ? "#F47C20" : "#f4f3f4"}
                />
              </View>
              {forceValidate && !walkthrough && (
                <CustomInput
                  label="walkthrough"
                  required={true}
                  value={formData.walkThrough_comp}
                  forceValidate={forceValidate}
                />
              )}
              <View style={StyleSheet.rowView}>
                <Text style={StyleSheet.switchLabel}>Return Needed</Text>
                <Switch
                  style={StyleSheet.switch}
                  thumbColor={returnNeeded ? "#F47C20" : "#f4f3f4"}
                  onValueChange={(value) => setReturnNeeded(value)}
                  value={returnNeeded}
                />
              </View>
              {returnNeeded && (
                <CustomInput
                  label="desc_return_needed"
                  required={returnNeeded}
                  style={StyleSheet.inputAreaView}
                  value={formData.desc_return_needed}
                  placeholder={"Explain why a return is needed..."}
                  multiline={true}
                  onChangeText={(text) => {
                    handleInputChange("desc_return_needed", text);
                  }}
                  maxLength={40}
                />
              )}
              <CustomInput
                label="desc_misc_notes"
                style={StyleSheet.inputAreaView}
                value={formData.desc_misc_notes}
                placeholder={"Misc Job Comments..."}
                multiline={true}
                onChangeText={(text) => {
                  handleInputChange("desc_misc_notes", text);
                }}
                maxLength={40}
              />
              <View style={StyleSheet.profileLable}>
                <Text style={StyleSheet.Text}>Manager Name *</Text>
              </View>
              <CustomInput
                label="manager_name"
                required={true}
                forceValidate={forceValidate}
                style={StyleSheet.inputView}
                value={formData.manager_name}
                placeholder={"Manager's Name Here"}
                onChangeText={(text) => handleInputChange("manager_name", text)}
                maxLength={40}
              />

              <View style={StyleSheet.checkoutFormBtns}>
                <TouchableOpacity
                  style={StyleSheet.logoutBtn}
                  onPress={() => setShowSignatureScreen(true)}
                >
                  <Text style={StyleSheet.logoutBtnText}>Manager Signoff</Text>
                </TouchableOpacity>
                <Modal
                  visible={showSignatureScreen}
                  onRequestClose={() => setShowSignatureScreen(false)}
                  animationType={"slide"}
                  transparent={true}
                >
                  <View style={StyleSheet.signatureModal}>
                    <SignatureScreen
                      setShowSignatureScreen={setShowSignatureScreen}
                      setSignature={setSignature}
                    />
                  </View>
                </Modal>
                <TouchableOpacity
                  style={StyleSheet.submitBtn}
                  onPress={onSubmit}
                >
                  <Text style={StyleSheet.logoutBtnText}>Final Check Out</Text>
                </TouchableOpacity>
              </View>
              <Text style={StyleSheet.textWhite}>* Required Fields</Text>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
