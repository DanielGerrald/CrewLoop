import {
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as React from "react";
import { Avatar } from "react-native-paper";
import * as Linking from "expo-linking";

import StyleSheet from "../../StyleSheet";
import OpenMap from "./OpenMap";

export default function Contacts({ selectedJob, contacts }) {
  function CoordinatorCall() {
    let number = "";
    if (!contacts[0].job_coordinator_phone_nbr) {
      number = "(800) 644-2566";
    } else {
      number = contacts[0].job_coordinator_phone_nbr;
    }
    Linking.openURL(`tel:${number}`);
  }

  function AftHrsCall() {
    let number = "";
    if (!contacts[0].job_coordinator_after_hours_nbr) {
      number = "(866) 780-4500";
    } else {
      number = contacts[0].job_coordinator_after_hours_nbr;
    }

    Linking.openURL(`tel:${number}`);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={"height"}>
      <ScrollView contentContainerStyle={StyleSheet.container}>
        <View style={StyleSheet.jobNavContent}>
          <Text style={StyleSheet.TextTitle}>Location Information</Text>
          <View style={StyleSheet.containerRowView}>
            <View style={{ flex: 1 }}>
              <Text style={StyleSheet.TextDescript}>
                {selectedJob[0].name || ""}
                {"\n"}
                {selectedJob[0].store_nbr || ""}
                {"\n"}
                {selectedJob[0].addr_1}
                {selectedJob[0].addr_2 && (
                  <>
                    {"\n"}
                    {selectedJob[0].addr_2}
                  </>
                )}
                {selectedJob[0].addr_3 && (
                  <>
                    {"\n"}
                    {selectedJob[0].addr_3}
                  </>
                )}
                {"\n"}
                {selectedJob[0].city}, {selectedJob[0].state}{" "}
                {selectedJob[0].zip}
                {"\n"}
                {selectedJob[0].phone_nbr}
                {selectedJob[0].phone_nbr_ext && (
                  <>{selectedJob[0].phone_nbr_ext}</>
                )}
              </Text>
            </View>
            <View style={StyleSheet.contactIcon}>
              {selectedJob?.[0]?.latitude && (
                <TouchableOpacity
                  onPress={() =>
                    OpenMap(
                      selectedJob[0].latitude,
                      selectedJob[0].longitude,
                      selectedJob[0].location_name,
                    )
                  }
                >
                  <Avatar.Icon
                    style={StyleSheet.avatarIconBtn}
                    icon="map-marker"
                    size={40}
                    color={"#ffffff"}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={StyleSheet.containerRowView}>
            <View style={StyleSheet.horizontalRule} />
          </View>
          <Text style={StyleSheet.TextTitle}>Lightserve Contact</Text>
          <View style={StyleSheet.containerRowView}>
            <View style={{ flex: 1 }}>
              <Text style={StyleSheet.TextDescript}>
                {contacts?.[0]?.job_coordinator_first_name || ""}{" "}
                {contacts?.[0]?.job_coordinator_last_name || ""}
                {"\n"}
                {contacts?.[0]?.job_coordinator_email || ""}
                {"\n"}
                Phone:{" "}
                {contacts?.[0]?.job_coordinator_phone_nbr || "(800) 644-2566"}
                {"\n"}
                Fax: {contacts?.[0]?.job_coordinator_fax_nbr || ""}
              </Text>
            </View>
            <View style={StyleSheet.contactIcon}>
              <TouchableOpacity onPress={CoordinatorCall}>
                <Avatar.Icon
                  style={StyleSheet.avatarIconBtn}
                  icon="phone"
                  size={40}
                  color={"#ffffff"}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={StyleSheet.containerRowView}>
            <View style={StyleSheet.horizontalRule} />
          </View>
          <Text style={StyleSheet.TextTitle}>After Hours Contact</Text>
          <View style={StyleSheet.containerRowView}>
            <View style={{ flex: 1 }}>
              <Text style={StyleSheet.TextDescript}>
                Call after 5:30 PM EST
                {"\n"}
                {contacts?.[0]?.job_coordinator_after_hours_nbr ||
                  "(866) 780-4500"}
              </Text>
            </View>
            <View style={StyleSheet.contactIcon}>
              <TouchableOpacity onPress={AftHrsCall}>
                <Avatar.Icon
                  style={StyleSheet.avatarIconBtn}
                  icon="phone"
                  size={40}
                  color={"#ffffff"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
