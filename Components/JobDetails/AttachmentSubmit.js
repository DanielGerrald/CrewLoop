import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import StyleSheet from "../../StyleSheet";
import { attachmentsProcess } from "./AttachmentsProcess";
import { useSQLiteContext } from "expo-sqlite";

export default function AttachmentSubmit({
  token,
  attachments,
  refreshAttachments,
}) {
  const db = useSQLiteContext();

  const { processPendingAttachments, isProcessing } = attachmentsProcess(
    db,
    token,
    attachments,
    refreshAttachments,
  );

  const pendingAttachments = attachments.filter(
    (att) => att.submittedToARC === "No" || att.submittedToARC === "Pending",
  );
  const showSubmitButton = pendingAttachments.some(
    (att) => att.submittedToARC === "No",
  );

  return (
    <View>
      {showSubmitButton && !isProcessing && (
        <TouchableOpacity
          style={StyleSheet.submitBtnAttachment}
          onPress={processPendingAttachments}
        >
          <Text style={StyleSheet.logoutBtnText}>Submit Attachments</Text>
        </TouchableOpacity>
      )}
      {isProcessing && (
        <TouchableOpacity style={StyleSheet.submitBtnAttachment} disabled>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={StyleSheet.logoutBtnText}>Processing...</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
