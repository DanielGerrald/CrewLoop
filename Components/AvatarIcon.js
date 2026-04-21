import { Alert, Image, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Avatar } from "react-native-paper";

import StyleSheet from "../StyleSheet";
import profileIcon from "../assets/user.png";
import {
  lastLoggedinUserSqlite,
  updateUserSqlite,
} from "../Database/UserDatabase";
import { useSQLiteContext } from "expo-sqlite";

export default function AvatarIcon() {
  const db = useSQLiteContext();
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
  }, []);

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newImageUri = result.assets[0].uri;
      setSelectedImage(newImageUri);

      if (lastLoggedIn) {
        const updatedUser = { ...lastLoggedIn, avatar: newImageUri };
        try {
          await updateUserSqlite(db, updatedUser);
          setLastLoggedIn(updatedUser);
        } catch (error) {
          console.error("Error updating user:", error);
          Alert.alert("Failed to update profile image.");
        }
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
