import { KeyboardAvoidingView, ScrollView, Text, View } from "react-native";
import StyleSheet from "../../StyleSheet";

export default function Details({ details }) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={"height"}>
      <ScrollView contentContainerStyle={StyleSheet.container}>
        <View style={StyleSheet.jobNavContent}>
          <Text style={StyleSheet.TextTitle}>Work Description</Text>
          <View style={StyleSheet.containerRowView}>
            <Text style={StyleSheet.TextDescript}>
              {details[0].desc_of_work}
            </Text>
          </View>
          <View style={StyleSheet.rowView}>
            <View style={StyleSheet.horizontalRule} />
          </View>
          <Text style={StyleSheet.TextTitle}>Contractor Requirements</Text>
          <View style={StyleSheet.containerRowView}>
            <Text style={StyleSheet.TextDescript}>
              {details[0].contractor_requirements}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
