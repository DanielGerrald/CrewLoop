import React, { useEffect, useRef, useState } from "react";
import { AppState, View, Text } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { selectAttachmentSqlite } from "../Database/AttachmentDatabase";
import { selectCheckInOutSqlite } from "../Database/CheckInOutDatabase";
import { selectFinalCheckOutSqlite } from "../Database/FinalCheckOutDatabase";

const POLL_MS_WHEN_ACTIVE = 2000; // poll while app is foregrounded

export default function BannerOnPendingSync() {
  const db = useSQLiteContext();
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerText, setBannerText] = useState("");
  const appStateRef = useRef(AppState.currentState);
  const intervalRef = useRef(null);

  const checkPendingItems = async () => {
    try {
      const [attachments, checkIns, finals] = await Promise.all([
        selectAttachmentSqlite(db, "submittedToARC", "Pending"),
        selectCheckInOutSqlite(db, "submittedToARC", "Pending"),
        selectFinalCheckOutSqlite(db, "submittedToARC", "Pending"),
      ]);

      const a = attachments?.length || 0;
      const c = checkIns?.length || 0;
      const f = finals?.length || 0;
      const total = a + c + f;

      if (total > 0) {
        setBannerText(
          "Offline items pending. Pull down to sync when network restored",
        );
        //setBannerText(
        // `Pending sync items: ${total}` +
        //    `  • Attachments: ${a}  • Check-ins: ${c}  • Final checkouts: ${f}`,
        //);
        setBannerVisible(true);
      } else {
        setBannerVisible(false);
        setBannerText("");
      }
    } catch (err) {
      console.warn("Error checking pending items:", err);
    }
  };

  const startPolling = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(checkPendingItems, POLL_MS_WHEN_ACTIVE);
  };
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      const was = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === "active") {
        checkPendingItems();
        startPolling();
      } else if (was === "active" && nextState.match(/inactive|background/)) {
        stopPolling();
      }
    });

    // Initial mount: check & maybe start polling if already active
    checkPendingItems();
    if (appStateRef.current === "active") startPolling();

    return () => {
      sub.remove();
      stopPolling();
    };
  }, []);

  if (!bannerVisible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: "#058CFF",
        zIndex: 9999,
      }}
    >
      <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
        {bannerText}
      </Text>
    </View>
  );
}
