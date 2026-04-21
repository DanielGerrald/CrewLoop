import { Card, IconButton } from "react-native-paper";
import StyleSheet from "../../StyleSheet";

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
  return (
    <Card.Content style={StyleSheet.rowView}>
      <IconButton
        icon="format-list-bulleted"
        size={35}
        iconColor={showDetails ? "#ffffff" : "#25292e"}
        style={StyleSheet.jobNavIcon}
        onPress={() => {
          setShowDetails(true);
          setShowContacts(false);
          setShowFiles(false);
          setShowPhotos(false);
          setShowFinalCheckOut(false);
        }}
      />
      <IconButton
        icon="contacts"
        size={35}
        iconColor={showContacts ? "#ffffff" : "#25292e"}
        style={StyleSheet.jobNavIcon}
        onPress={() => {
          setShowDetails(false);
          setShowContacts(true);
          setShowFiles(false);
          setShowPhotos(false);
          setShowFinalCheckOut(false);
        }}
      />
      <IconButton
        icon="file-document-multiple"
        size={35}
        iconColor={showFiles ? "#ffffff" : "#25292e"}
        style={StyleSheet.jobNavIcon}
        onPress={() => {
          setShowDetails(false);
          setShowContacts(false);
          setShowFiles(true);
          setShowPhotos(false);
          setShowFinalCheckOut(false);
        }}
      />
      <IconButton
        icon="image-multiple"
        size={35}
        iconColor={showPhotos ? "#ffffff" : "#25292e"}
        style={StyleSheet.jobNavIcon}
        onPress={() => {
          setShowDetails(false);
          setShowContacts(false);
          setShowFiles(false);
          setShowPhotos(true);
          setShowFinalCheckOut(false);
        }}
      />
      <IconButton
        icon="clipboard-check"
        size={35}
        iconColor={showFinalCheckOut ? "#ffffff" : "#25292e"}
        style={StyleSheet.jobNavIcon}
        onPress={() => {
          setShowDetails(false);
          setShowContacts(false);
          setShowFiles(false);
          setShowPhotos(false);
          setShowFinalCheckOut(true);
        }}
      />
    </Card.Content>
  );
}
