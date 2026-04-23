import React, { useRef } from "react";
import { View, TouchableOpacity, Text, StyleSheet as RNStyleSheet } from "react-native";
import Signature from "react-native-signature-canvas";
import AppStyleSheet from "../StyleSheet";

export default function SignatureScreen({
  setShowSignatureScreen,
  setSignature,
}) {
  const ref = useRef();

  async function handleOK(signatureDataUrl) {
    try {
      setSignature(signatureDataUrl);
      setShowSignatureScreen(false);
    } catch (err) {
      console.error(err);
    }
  }

  function handleClear() {
    ref.current?.clearSignature();
  }

  function handleConfirm() {
    ref.current?.readSignature();
  }

  return (
    <View style={AppStyleSheet.signatureView}>
      <Signature
        onOK={handleOK}
        ref={ref}
        webStyle={`.m-signature-pad--footer {display: none; margin: 0px;}`}
      />
      <View style={AppStyleSheet.signatureRow}>
        <TouchableOpacity style={styles.sigClearBtn} onPress={handleClear}>
          <Text style={AppStyleSheet.logoutBtnText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sigSaveBtn} onPress={handleConfirm}>
          <Text style={AppStyleSheet.logoutBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.sigCancelBtn}
        onPress={() => setShowSignatureScreen(false)}
      >
        <Text style={AppStyleSheet.logoutBtnText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const shadowStyle = {
  elevation: 6,
  shadowColor: "black",
  shadowOffset: { width: 0, height: 10 },
  shadowRadius: 6,
  shadowOpacity: 0.25,
};

const styles = RNStyleSheet.create({
  sigClearBtn: {
    width: "25%",
    backgroundColor: "#3e3e3e",
    borderRadius: 20,
    marginTop: "5%",
    height: "35%",
    alignItems: "center",
    justifyContent: "center",
    ...shadowStyle,
  },
  sigSaveBtn: {
    width: "25%",
    backgroundColor: "#F47C20",
    borderRadius: 20,
    marginTop: "5%",
    height: "35%",
    alignItems: "center",
    justifyContent: "center",
    ...shadowStyle,
  },
  sigCancelBtn: {
    width: "30%",
    backgroundColor: "#3e3e3e",
    borderRadius: 20,
    marginTop: 15,
    height: "15%",
    alignItems: "center",
    justifyContent: "center",
    ...shadowStyle,
  },
});
