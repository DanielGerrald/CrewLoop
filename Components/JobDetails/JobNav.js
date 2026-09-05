import { StyleSheet } from "react-native";
import { Card, IconButton } from "react-native-paper";

const TABS = [
  { key: "details", icon: "format-list-bulleted" },
  { key: "contacts", icon: "contacts" },
  { key: "files", icon: "file-document-multiple" },
  { key: "photos", icon: "image-multiple" },
  { key: "finalCheckOut", icon: "clipboard-check" },
];

export default function JobNav({
  showDetails,
  setShowDetails,
  showContacts,
  setShowContacts,
  showFiles,
  setShowFiles,
  showPhotos,
  setShowPhotos,
  showFinalCheckOut,
  setShowFinalCheckOut,
}) {
  const active = {
    details: showDetails,
    contacts: showContacts,
    files: showFiles,
    photos: showPhotos,
    finalCheckOut: showFinalCheckOut,
  };
  const setActive = {
    details: setShowDetails,
    contacts: setShowContacts,
    files: setShowFiles,
    photos: setShowPhotos,
    finalCheckOut: setShowFinalCheckOut,
  };

  const selectTab = (key) => {
    for (const tab of TABS) {
      setActive[tab.key](tab.key === key);
    }
  };

  return (
    <Card.Content style={styles.rowView}>
      {TABS.map((tab) => (
        <IconButton
          key={tab.key}
          icon={tab.icon}
          size={35}
          iconColor={active[tab.key] ? "#ffffff" : "#25292e"}
          style={styles.jobNavIcon}
          onPress={() => selectTab(tab.key)}
        />
      ))}
    </Card.Content>
  );
}

const styles = StyleSheet.create({
  jobNavIcon: {
    flex: 1,
    elevation: 6,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 2,
    shadowOpacity: 0.1,
  },
  rowView: {
    flexDirection: "row",
    alignItems: "center",
  },
});
