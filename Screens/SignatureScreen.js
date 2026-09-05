import { useRef } from "react";
import { Dimensions, View, TouchableOpacity, Text, StyleSheet } from "react-native";
import Signature from "react-native-signature-canvas";

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
    <View style={styles.signatureView}>
      <Signature
        onOK={handleOK}
        ref={ref}
        webStyle={`.m-signature-pad--footer {display: none; margin: 0px;}`}
      />
      <View style={styles.signatureRow}>
        <TouchableOpacity style={styles.sigClearBtn} onPress={handleClear}>
          <Text style={styles.logoutBtnText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sigSaveBtn} onPress={handleConfirm}>
          <Text style={styles.logoutBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.sigCancelBtn}
        onPress={() => setShowSignatureScreen(false)}
      >
        <Text style={styles.logoutBtnText}>Cancel</Text>
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

const { width, height } = Dimensions.get("window");
let textStyle = 12;
if (width >= 380 && width <= 600) textStyle = 16;
else if (width > 600) textStyle = 20;

const styles = StyleSheet.create({
  logoutBtnText: {
    color: "#ffffff",
    fontSize: textStyle,
  },
  signatureView: {
    alignItems: "center",
    justifyContent: "center",
    height: width,
    width: height,
    padding: 10,
    backgroundColor: "#6A89A7",
    transform: [{ rotate: "270deg" }],
  },
  signatureRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    alignItems: "center",
  },
  sigClearBtn: {
    width: "25%",
    backgroundColor: "#2C3444",
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
    backgroundColor: "#2C3444",
    borderRadius: 20,
    marginTop: 15,
    height: "15%",
    alignItems: "center",
    justifyContent: "center",
    ...shadowStyle,
  },
});
