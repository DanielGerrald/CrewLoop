import * as React from "react";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Text, Chip, Icon, SegmentedButtons } from "react-native-paper";
import moment from "moment";
import ImageViewer from "react-native-image-viewing";
import { useSQLiteContext } from "expo-sqlite";

import { selectCategoryLabelSqlite } from "../../Database/LabelDatabase";
import {
  deleteAttachmentSqlite,
  insertAttachmentSqlite,
} from "../../Database/AttachmentDatabase";
import { lastLoggedinUserSqlite } from "../../Database/UserDatabase";
import Loading from "../ui/Loading";
import AttachmentSubmit from "./AttachmentSubmit";
import Colors from "../../constants/colors";

function ImageThumbnail({ image, onPress, onLongPress }) {
  return (
    <TouchableOpacity
      style={styles.photoImage}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Image style={styles.image} source={{ uri: image.uri }} />
      <View style={styles.labelView}>
        <Chip
          icon={() => <Icon source="image" color={"purple"} size={20} />}
          style={styles.chip}
        >
          <Text variant="labelSmall" style={styles.chipText}>
            {image.label}
          </Text>
        </Chip>
        <Chip
          icon={() => <Icon source="clock" color={"green"} size={20} />}
          style={styles.chip}
        >
          <Text variant="labelSmall" style={styles.chipText}>
            {moment.unix(image.date).format("L")}
          </Text>
        </Chip>
        {image.syncStatus === "Pending" && (
          <Chip
            style={styles.chip}
            textStyle={styles.chipText}
            icon="cloud-upload"
          >
            Pending
          </Chip>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function Photos({ selectedJob, fetchPhotos, images }) {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageViewVisible, setImageViewVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [cameraStatus, requestCameraPermission] =
    ImagePicker.useCameraPermissions();
  const [labels, setLabels] = useState([]);
  const [actionType, setActionType] = useState(null);
  const [buttonValue, setButtonValue] = React.useState("");
  const workOrderId = selectedJob[0].reference_code.split("-")[1];
  const [token, setToken] = useState([]);

  useEffect(() => {
    fetchLabels();
    lastLoggedIn();
    fetchPhotos();
  }, []);

  const fetchLabels = async () => {
    try {
      const result = await selectCategoryLabelSqlite(
        db,
        "type_group",
        "Photo Label",
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

  const lastLoggedIn = async () => {
    await lastLoggedinUserSqlite(db).then((r) => {
      setToken(r.idToken);
    });
  };

  const generateUniqueFileName = () => {
    const timestamp = moment().unix();
    const randomString = Math.random().toString(36).slice(2, 11);
    return `${timestamp}_${randomString}.jpg`;
  };

  const pickImage = async (labelId, label) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setLoading(true);
        const selectedImages = result.assets.map((asset) => ({
          label_id: labelId,
          uri: asset.uri,
          fileName: generateUniqueFileName(),
          label: label,
          assignment_id: selectedJob[0].id,
          type: "Photo",
          mimeType: asset.mimeType || "image/jpeg",
          assignment_ref_id: workOrderId,
          date: moment().unix(),
          syncStatus: "No",
        }));

        const updatedImages = await saveImage(selectedImages);
        await insertAttachmentSqlite(db, updatedImages);
        await fetchPhotos();
        setLoading(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    } finally {
      setModalVisible(false);
    }
  };

  async function saveImage(selectedImages) {
    const updatedImages = [];
    for (const image of selectedImages) {
      const imageName = `${Date.now()}.jpg`;
      const newPath = `${FileSystem.documentDirectory}${imageName}`;

      try {
        // Re-encoding via manipulateAsync bakes in the EXIF orientation, so
        // landscape photos display upright instead of sideways — <Image>
        // doesn't reliably respect EXIF rotation on its own (esp. Android).
        const normalized = await ImageManipulator.manipulateAsync(
          image.uri,
          [],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
        );

        await FileSystem.copyAsync({
          from: normalized.uri,
          to: newPath,
        });
        image.uri = newPath;
        updatedImages.push(image);
      } catch (error) {
        console.error("Error saving image:", error);
      }
    }

    return updatedImages;
  }

  const deleteImage = (id) => {
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAttachmentSqlite(db, id);
            await fetchPhotos();
          } catch (error) {
            console.error("Error deleting image:", error);
            Alert.alert("Error", "There was an issue deleting the image.");
          }
        },
      },
    ]);
  };

  const handleCameraPermission = useCallback(
    async (labelId, label) => {
      const permission = await requestCameraPermission();

      if (permission?.granted) {
        await cameraLaunch(labelId, label);
      } else {
        Alert.alert(
          "Camera Permission Required",
          "Please grant camera access in settings.",
          [{ text: "OK", onPress: () => Linking.openSettings() }],
        );
      }
    },
    [requestCameraPermission],
  );

  const cameraLaunch = async (labelId, label) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 1,
      });

      if (!result.canceled) {
        setLoading(true);
        const newImage = [
          {
            label_id: labelId,
            uri: result.assets[0].uri,
            fileName: generateUniqueFileName(),
            label: label,
            assignment_id: selectedJob[0].id,
            type: "Photo",
            mimeType: result.assets[0].mimeType || "image/jpeg",
            assignment_ref_id: workOrderId,
            date: moment().unix(),
            syncStatus: "No",
          },
        ];

        const savedImages = await saveImage(newImage);
        await insertAttachmentSqlite(db, savedImages);
        await fetchPhotos();
        setLoading(false);
      }
    } catch (error) {
      console.error("Error launching camera:", error);
    } finally {
      setModalVisible(false);
    }
  };

  const handleAction = (labelId, label) => {
    if (actionType === "select") {
      pickImage(labelId, label);
    } else if (actionType === "take") {
      handleCameraPermission(labelId, label);
    }
  };

  const showModal = (type) => {
    setActionType(type);
    setModalVisible(true);
  };

  const openImageView = (imageUri) => {
    const index = images.findIndex((img) => img.uri === imageUri);
    if (index === -1) return;
    setSelectedImageIndex(index);
    setImageViewVisible(true);
  };

  const closeImageView = () => {
    setImageViewVisible(false);
  };

  const ImageViewerHeader = () => (
    <SafeAreaView style={styles.imageViewerHeader}>
      <TouchableOpacity onPress={closeImageView}>
        <Icon source="close" size={28} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );

  const imageViewerModal = imageViewVisible && selectedImageIndex !== null && (
    <ImageViewer
      images={images.map((img) => ({ uri: img.uri }))}
      imageIndex={selectedImageIndex}
      visible={imageViewVisible}
      onRequestClose={closeImageView}
      HeaderComponent={ImageViewerHeader}
    />
  );

  const notSubmittedImages = useMemo(() => {
    return images.filter((image) => image?.syncStatus === "No");
  }, [images]);

  const submittedImages = useMemo(() => {
    return images.filter(
      (image) =>
        image?.syncStatus === "Yes" || image?.syncStatus === "Pending",
    );
  }, [images]);

  if (selectedJob[0].status_label !== "Completed") {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={"height"}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.jobNavContent}>
            <Modal
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
              animationType={"slide"}
              transparent={true}
            >
              {loading ? (
                <Loading />
              ) : (
                <View style={styles.modalPopup}>
                  <View style={styles.modalPopupContent}>
                    <Text style={styles.Text}>Select a Label Category</Text>
                    {labels.map((label, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          handleAction(label.type_id, label.type_label);
                        }}
                      >
                        <Chip
                          icon={() => (
                            <Icon source="image" color={"purple"} size={20} />
                          )}
                          style={styles.chip}
                        >
                          <Text variant="labelLarge" style={styles.chipText}>
                            {label.type_label}
                          </Text>
                        </Chip>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={styles.logoutBtn}
                    >
                      <Text style={styles.logoutBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Modal>
            <SegmentedButtons
              value={buttonValue}
              onValueChange={setButtonValue}
              style={styles.segmentedBtn}
              buttons={[
                {
                  value: "select",
                  label: "Select Photos",
                  checkedColor: "#ffffff",
                  uncheckedColor: "#ffffff",
                  icon: "image",
                  style: {
                    borderColor: Colors.accent,
                    backgroundColor: Colors.accent,
                  },
                  onPress: () => {
                    showModal("select");
                  },
                },
                {
                  value: "take",
                  label: "Take Photo",
                  checkedColor: "#ffffff",
                  uncheckedColor: "#ffffff",
                  icon: "camera",
                  style: { borderColor: Colors.accent, backgroundColor: Colors.accent },
                  onPress: () => {
                    showModal("take");
                  },
                },
              ]}
            />
            <AttachmentSubmit
              token={token}
              attachments={images}
              refreshAttachments={fetchPhotos}
            />
            {notSubmittedImages && (
              <View style={styles.thumbnailView}>
                {notSubmittedImages.map((image, index) => (
                  <ImageThumbnail
                    key={index}
                    image={image}
                    onPress={() => openImageView(image.uri)}
                    onLongPress={() => deleteImage(image.id)}
                  />
                ))}
              </View>
            )}
            {submittedImages && submittedImages.length > 0 && (
              <>
                <View style={styles.rowView}>
                  <View style={styles.horizontalRule} />
                </View>
                <View style={styles.rowView}>
                  <Text style={styles.TextTitle}>Submitted Images</Text>
                </View>

                {submittedImages.map((image, index) => (
                  <View style={styles.thumbnailView} key={index}>
                    <ImageThumbnail
                      image={image}
                      onPress={() => openImageView(image.uri)}
                      onLongPress={() => deleteImage(image.id)}
                    />
                  </View>
                ))}
              </>
            )}
          </View>
        </ScrollView>
        {imageViewerModal}
      </KeyboardAvoidingView>
    );
  } else {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={"height"}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.jobNavContent}>
            <View style={styles.thumbnailView}>
              {images.map((image, index) => (
                <ImageThumbnail
                  key={index}
                  image={image}
                  onPress={() => openImageView(image.uri)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
        {imageViewerModal}
      </KeyboardAvoidingView>
    );
  }
}

const { width, height } = Dimensions.get("window");
let textStyle = 12;
if (width >= 380 && width <= 600) textStyle = 16;
else if (width > 600) textStyle = 20;

const styles = StyleSheet.create({
  Text: {
    color: "#ffffff",
    fontSize: textStyle,
    justifyContent: "flex-start",
  },
  TextTitle: {
    color: "#ffffff",
    fontSize: textStyle + 5,
    justifyContent: "flex-start",
  },
  chip: {
    backgroundColor: Colors.primary,
    margin: "1%",
    borderRadius: 15,
  },
  chipText: {
    color: "#ffffff",
  },
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    paddingHorizontal: width * 0.05,
  },
  horizontalRule: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.muted,
    marginBottom: 10,
    marginTop: 15,
  },
  image: { height: height * 0.2 },
  imageViewerHeader: {
    width: "100%",
    padding: 16,
    alignItems: "flex-end",
  },
  jobNavContent: {
    marginVertical: height * 0.03,
    flexGrow: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
  },
  labelView: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  logoutBtn: {
    width: width * 0.6,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    height: height * 0.07,
    alignItems: "center",
    justifyContent: "center",
    marginTop: height * 0.02,
    marginBottom: height * 0.02,
    elevation: 6,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 6,
    shadowOpacity: 0.25,
  },
  logoutBtnText: {
    color: "#ffffff",
    fontSize: textStyle,
  },
  modalPopup: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: width * 0.05,
  },
  modalPopupContent: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 560,
    maxHeight: height * 0.8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  photoImage: {
    marginTop: 15,
  },
  rowView: {
    flexDirection: "row",
    alignItems: "center",
  },
  segmentedBtn: {
    width: width * 0.7,
    backgroundColor: Colors.accent,
    borderRadius: 20,
    borderColor: Colors.accent,
    elevation: 6,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 6,
    shadowOpacity: 0.25,
    marginTop: height * 0.02,
    height: height * 0.07,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailView: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});
