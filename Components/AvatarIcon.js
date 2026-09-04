import { Alert, Image, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Network from "expo-network";
import { Avatar } from "react-native-paper";

import StyleSheet from "../StyleSheet";
import profileIcon from "../assets/user.png";
import {
  lastLoggedinUserSqlite,
  postUserAvatarApi,
  updateUserSqlite,
} from "../Database/UserDatabase";
import { useSQLiteContext } from "expo-sqlite";
import { useJob } from "./Context";

export default function AvatarIcon() {
  const db = useSQLiteContext();
  const { syncVersion } = useJob();
  const [lastLoggedIn, setLastLoggedIn] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const profileIconUri = Image.resolveAssetSource(profileIcon).uri;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await lastLoggedinUserSqlite(db);
        setLastLoggedIn(user);
        setSelectedImage(user.avatar || profileIconUri);
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Failed to load user data.");
      }
    };

    fetchUserData();
  }, [syncVersion]);

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      try {
        // Resize/compress down to something reasonable for an avatar and
        // encode as a data URI — the same string works as a local <Image>
        // source and as a portable value we can sync through Firebase,
        // with no separate on-device file to manage.
        const manipulated = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 300 } }],
          {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          },
        );
        const dataUri = `data:image/jpeg;base64,${manipulated.base64}`;
        setSelectedImage(dataUri);

        if (lastLoggedIn) {
          const updatedUser = { ...lastLoggedIn, avatar: dataUri };
          await updateUserSqlite(db, updatedUser);
          setLastLoggedIn(updatedUser);

          const networkState = await Network.getNetworkStateAsync();
          const online = Boolean(
            networkState?.isConnected && networkState?.isInternetReachable,
          );
          if (online) {
            await postUserAvatarApi(
              lastLoggedIn.idToken,
              lastLoggedIn.localId,
              manipulated.base64,
              "image/jpeg",
            );
          }
        }
      } catch (error) {
        console.error("Error updating profile image:", error);
        Alert.alert("Failed to update profile image.");
      }
    }
  };

  return (
    <TouchableOpacity onPress={pickImageAsync}>
      <Avatar.Image
        style={StyleSheet.profilePic}
        source={{ uri: selectedImage || profileIconUri }}
        size={100}
      />
    </TouchableOpacity>
  );
}
