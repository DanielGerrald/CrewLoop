import { useState } from "react";
import { Alert, Modal, Text, TouchableOpacity, View } from "react-native";

import StyleSheet from "../StyleSheet";
import CustomInput from "./CustomInput";

export default function ReauthModal({ visible, onCancel, onConfirm }) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = () => {
    setPassword("");
    onCancel();
  };

  const handleConfirm = async () => {
    if (!password) {
      Alert.alert("Please enter your password");
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(password);
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <View style={StyleSheet.modalPopup}>
        <View style={StyleSheet.modalPopupContent}>
          <Text style={StyleSheet.Text}>
            For your security, please confirm your password to continue.
          </Text>
          <CustomInput
            label="password"
            style={StyleSheet.inputView}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <View style={StyleSheet.checkoutFormBtns}>
            <TouchableOpacity
              style={StyleSheet.logoutBtn}
              onPress={handleCancel}
              disabled={submitting}
            >
              <Text style={StyleSheet.logoutBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={StyleSheet.submitBtn}
              onPress={handleConfirm}
              disabled={submitting}
            >
              <Text style={StyleSheet.logoutBtnText}>
                {submitting ? "Verifying..." : "Confirm"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
