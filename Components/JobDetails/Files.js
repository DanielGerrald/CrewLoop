import {
  Alert,
  View,
  TouchableOpacity,
  Linking,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Text, Avatar, Chip, Icon } from "react-native-paper";
import * as React from "react";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { useSQLiteContext } from "expo-sqlite";

import StyleSheet from "../../StyleSheet";
import { selectCategoryLabelSqlite } from "../../Database/LabelDatabase";
import moment from "moment/moment";
import {
  deleteAttachmentSqlite,
  insertAttachmentSqlite,
  updateAttachmentSqlite,
} from "../../Database/AttachmentDatabase";
import { lastLoggedinUserSqlite } from "../../Database/UserDatabase";
import Loading from "../Loading";
import AttachmentSubmit from "./AttachmentSubmit";

export default function Files({ selectedJob, fetchFiles, files }) {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [labels, setLabels] = useState([]);
  const workOrderId = selectedJob[0].expanded_id.split("-")[1];
  const [token, setToken] = useState([]);

  useEffect(() => {
    fetchLabels();
    fetchFiles();
  }, []);

  const fetchLabels = async () => {
    try {
      const result = await selectCategoryLabelSqlite(
        db,
        "type_group",
        "Document Label",
      );
      const formattedLabels = result.map((item) => ({
        type_id: item.type_id,
        type_label: item.type_label,
      }));
      setLabels(formattedLabels);
    } catch (error) {
      console.error("Error loading labels:", error);
    }
  };

  const pickFile = async (labelId, label) => {
    try {
      const lastLoggedIn = await lastLoggedinUserSqlite(db);
      setToken(lastLoggedIn.access_token);
      let result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: false,
        multiple: false,
        type: ["application/pdf", "image/jpeg"],
      });

      if (!result.canceled) {
        if (Platform.OS === "ios") {
          const documentDirectoryUri =
            FileSystem.documentDirectory + result.assets[0].name;
          await FileSystem.copyAsync({
            from: result.assets[0].uri,
            to: documentDirectoryUri,
          });
          result.assets[0].uri = documentDirectoryUri;
        }

        result.assets[0].fileName = result.assets[0].name;
        delete result.assets[0].name;

        const selectedFiles = result.assets.map((asset) => ({
          label_id: labelId,
          uri: asset.uri,
          fileName: asset.fileName || "Unnamed file",
          label: label,
          job_purchase_order_id: selectedJob[0].id,
          type: "File",
          mimeType: asset.mimeType,
          workord_id: workOrderId,
          date: moment().unix(),
          submittedToARC: "No",
        }));

        const updatedFiles = [...files];
        for (const file of selectedFiles) {
          const existingFileIndex = updatedFiles.findIndex(
            (f) => f.uri === file.uri,
          );

          if (existingFileIndex > -1) {
            Alert.alert(
              "File Already Exists",
              `The file "${file.fileName}" already exists. Do you want to replace it?`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Replace",
                  style: "destructive",
                  onPress: async () => {
                    updatedFiles[existingFileIndex] = file;
                    await updateAttachmentSqlite(db, file);
                    await fetchFiles();
                  },
                },
              ],
            );
          } else {
            setLoading(true);
            updatedFiles.push(file);
            await insertAttachmentSqlite(db, file);
            await fetchFiles();
            setLoading(false);
          }
        }
      }
    } catch (error) {
      console.error("Error picking file:", error);
    } finally {
      setModalVisible(false);
    }
  };

  const deleteFile = (id) => {
    Alert.alert("Delete File", "Are you sure you want to delete this file?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAttachmentSqlite(db, id);
            await fetchFiles();
          } catch (error) {
            console.error("Error deleting document:", error);
            Alert.alert("Error", "There was an issue deleting the Document.");
          }
        },
      },
    ]);
  };

  const openFile = async (uri) => {
    try {
      if (Platform.OS === "ios") {
        await Sharing.shareAsync(uri);
      } else {
        await Linking.openURL(uri);
      }
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert("Error", "There was a problem opening the file.");
    }
  };

  const showModal = () => {
    setModalVisible(true);
  };

  const notSubmittedFiles = useMemo(() => {
    return files.filter((file) => file?.submittedToARC === "No");
  }, [files]);

  const submittedFiles = useMemo(() => {
    return files.filter(
      (file) =>
        file?.submittedToARC === "Yes" || file?.submittedToARC === "Pending",
    );
  }, [files]);

  if (selectedJob[0].workflow_step_label !== "Completed") {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={"height"}>
        <ScrollView contentContainerStyle={StyleSheet.container}>
          <View style={StyleSheet.jobNavContent}>
            <Modal
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
              animationType={"slide"}
              transparent={true}
            >
              {loading && <Loading />}
              {!loading && (
                <View style={StyleSheet.modalPopup}>
                  <View style={StyleSheet.modalPopupContent}>
                    <Text style={StyleSheet.Text}>Select a Label Category</Text>
                    {labels.map((label, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          pickFile(label.type_id, label.type_label);
                        }}
                      >
                        <Chip
                          icon={() => (
                            <Icon source="tag" color={"blue"} size={20} />
                          )}
                          style={StyleSheet.chip}
                        >
                          <Text variant="labelLarge"> {label.type_label}</Text>
                        </Chip>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={StyleSheet.logoutBtn}
                    >
                      <Text style={StyleSheet.logoutBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Modal>
            <TouchableOpacity
              onPress={() => showModal()}
              style={StyleSheet.submitBtn}
            >
              <View style={StyleSheet.rowView}>
                <Avatar.Icon
                  style={StyleSheet.avatarIconImage}
                  icon="file-multiple"
                  size={30}
                />
                <Text style={StyleSheet.logoutBtnText}>Select Files</Text>
              </View>
            </TouchableOpacity>

            <AttachmentSubmit
              token={token}
              attachments={files}
              refreshAttachments={fetchFiles}
            />

            {notSubmittedFiles && (
              <View style={StyleSheet.thumbnailView}>
                {notSubmittedFiles.map((file, index) => (
                  <TouchableOpacity
                    key={index.toString()}
                    onPress={() => openFile(file.uri)}
                    onLongPress={() => deleteFile(file.id)}
                  >
                    <View style={StyleSheet.rowView}>
                      <View style={StyleSheet.fileIconRow}>
                        <Avatar.Icon
                          style={StyleSheet.avatarIconBtn}
                          icon="file-document"
                          size={45}
                        />
                      </View>
                      <View style={StyleSheet.fileTextRow}>
                        <Text style={StyleSheet.TextDescript}>
                          {file.fileName}
                        </Text>
                      </View>
                    </View>
                    <View style={StyleSheet.labelView}>
                      <Chip
                        icon={() => (
                          <Icon source="tag" color={"blue"} size={20} />
                        )}
                        style={StyleSheet.chip}
                      >
                        <Text variant="labelSmall"> {file.label}</Text>
                      </Chip>
                      <Chip
                        icon={() => (
                          <Icon source="clock" color={"green"} size={20} />
                        )}
                        style={StyleSheet.chip}
                      >
                        <Text variant="labelSmall">{moment().format("L")}</Text>
                      </Chip>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {submittedFiles && submittedFiles.length > 0 && (
              <>
                <View style={StyleSheet.rowView}>
                  <View style={StyleSheet.horizontalRule} />
                </View>
                <View style={StyleSheet.rowView}>
                  <Text style={StyleSheet.TextTitle}>Submitted Documents</Text>
                </View>

                {submittedFiles.map((file, index) => (
                  <View style={StyleSheet.thumbnailView} key={index}>
                    <TouchableOpacity
                      key={index}
                      onPress={() => openFile(file.uri)}
                      //onLongPress={() => deleteFile(file.id)}
                    >
                      <View style={StyleSheet.rowView}>
                        <View style={StyleSheet.fileIconRow}>
                          <Avatar.Icon
                            style={StyleSheet.avatarIconBtn}
                            icon="file-document"
                            size={45}
                          />
                        </View>
                        <View style={StyleSheet.fileTextRow}>
                          <Text style={StyleSheet.TextDescript}>
                            {file.fileName}
                          </Text>
                        </View>
                      </View>
                      <View style={StyleSheet.labelView}>
                        <Chip
                          icon={() => (
                            <Icon source="tag" color={"blue"} size={20} />
                          )}
                          style={StyleSheet.chip}
                        >
                          <Text variant="labelSmall"> {file.label}</Text>
                        </Chip>
                        <Chip
                          icon={() => (
                            <Icon source="clock" color={"green"} size={20} />
                          )}
                          style={StyleSheet.chip}
                        >
                          <Text variant="labelSmall">
                            {moment().format("L")}
                          </Text>
                        </Chip>
                        {file.submittedToARC === "Pending" && (
                          <Chip style={StyleSheet.chip} icon="cloud-upload">
                            Pending
                          </Chip>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  } else {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={"height"}>
        <ScrollView contentContainerStyle={StyleSheet.container}>
          <View style={StyleSheet.jobNavContent}>
            <View style={StyleSheet.thumbnailView}>
              {files.map((file, index) => (
                <TouchableOpacity
                  key={index.toString()}
                  onPress={() => openFile(file.uri)}
                  onLongPress={() => deleteFile(file.id)}
                >
                  <View style={StyleSheet.rowView}>
                    <View style={StyleSheet.fileIconRow}>
                      <Avatar.Icon
                        style={StyleSheet.avatarIconBtn}
                        icon="file-document"
                        size={45}
                      />
                    </View>
                    <View style={StyleSheet.fileTextRow}>
                      <Text style={StyleSheet.TextDescript}>
                        {file.fileName}
                      </Text>
                    </View>
                  </View>
                  <View style={StyleSheet.labelView}>
                    <Chip
                      icon={() => (
                        <Icon source="tag" color={"blue"} size={20} />
                      )}
                      style={StyleSheet.chip}
                    >
                      <Text variant="labelSmall"> {file.label}</Text>
                    </Chip>
                    <Chip
                      icon={() => (
                        <Icon source="clock" color={"green"} size={20} />
                      )}
                      style={StyleSheet.chip}
                    >
                      <Text variant="labelSmall">
                        {moment.unix(file.date).format("L")}
                      </Text>
                    </Chip>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}
