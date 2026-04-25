import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Alert,
  View,
  Text,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import * as Network from "expo-network";

import StyleSheet from "../StyleSheet";
import syncLock from "./SyncLock";
import { useJob } from "./Context";
import useAppFocusRefresh from "./AppFocusRefresh";
import { showOnceAlert } from "./AlertManager";
import {
  getUserProfileApi,
  lastLoggedinUserSqlite,
  updateUserSqlite,
} from "../Database/UserDatabase";
import {
  cleanupWorkOrderSqlite,
  getCompletedWorkOrderApi,
  getWorkOrderApi,
  getWorkOrderDetailsApi,
  insertWorkOrderSqlite,
  selectWorkOrderSqlite,
  updateWorkOrderSqlite,
} from "../Database/WorkOrderDatabase";
import {
  cleanupContactSqlite,
  getWorkOrderContactsApi,
  insertContactSqlite,
} from "../Database/ContactDatabase";
import {
  cleanupCheckInOutSqlite,
  deleteCheckInOutDuplicatesSqlite,
  getCheckInOutApi,
  insertCheckInOutSqlite,
  postCheckInOutApi,
  selectCheckInOutSqlite,
  updateCheckInOutSqlite,
} from "../Database/CheckInOutDatabase";
import {
  cleanupAttachmentSqlite,
  postDocumentsApi,
  postPhotosApi,
  selectAttachmentSqlite,
  updateAttachmentSqlite,
} from "../Database/AttachmentDatabase";
import {
  cleanupFinalCheckOutSqlite,
  postFinalCheckListApi,
  postFinalCheckoutApi,
  selectFinalCheckOutSqlite,
  updateFinalCheckOutSqlite,
} from "../Database/FinalCheckOutDatabase";
import { insertCategoryLabelSqlite } from "../Database/LabelDatabase";
import BannerOnPendingSync from "./BannerOnPendingSync";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function useAppSync({
  fetchPhotos,
  fetchFiles,
  autoNavigateHome = true,
  onSyncSuccess,
} = {}) {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const { setJobResult, incrementSyncVersion } = useJob();
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef(null);

  /** AUTH & SESSION **/
  const getAuthenticatedUser = async ({ silent = false } = {}) => {
    const user = await lastLoggedinUserSqlite(db);

    if (!user || user.logged_in !== 1) {
      if (!silent) showOnceAlert("No User", "Not logged in", "Please log in.");
      return null;
    }
    return user;
  };

  /** JOB SYNC (open + completed + details + contacts + checkins) **/
  const fetchAndStoreJobs = async (user) => {
    const token = user.access_token;

    const [openJobs, completedJobs] = await Promise.all([
      getWorkOrderApi(user),
      getCompletedWorkOrderApi(token),
    ]);
    const jobs = [...(openJobs || []), ...(completedJobs || [])];
    if (!jobs.length) {
      await cleanupWorkOrderSqlite(db, []); // still normalize state
      return;
    }

    await Promise.allSettled(
      jobs.map(async (job) => {
        const id = job.work_order.id;
        job.work_order.user_id = user.user_id;
        const [detailsResult, contactsResult, checkinsResult] =
          await Promise.allSettled([
            getWorkOrderDetailsApi(token, id),
            getWorkOrderContactsApi(token, id),
            getCheckInOutApi(token, id),
          ]);

        if (
          detailsResult.status === "fulfilled" &&
          detailsResult.value?.work_order
        ) {
          job.work_order.contractor_requirements =
            detailsResult.value.work_order.contractor_requirements;
          job.work_order.desc_of_work =
            detailsResult.value.work_order.desc_of_work;
        }

        if (
          contactsResult.status === "fulfilled" &&
          contactsResult.value
        ) {
          contactsResult.value.job_purchase_order_id = id;
          try {
            await insertContactSqlite(db, contactsResult.value);
          } catch (err) {
            console.warn(`Failed contacts insert for ${id}:`, err);
          }
        }

        if (
          checkinsResult.status === "fulfilled" &&
          Array.isArray(checkinsResult.value)
        ) {
          for (const c of checkinsResult.value) {
            c.submittedToARC = "Yes";
            await deleteCheckInOutDuplicatesSqlite(db, c);
            await insertCheckInOutSqlite(db, c);
          }
        }
      }),
    );

    // Attachment types / labels
    try {
      if (jobs?.[0]?.job?.attachment_types) {
        await insertCategoryLabelSqlite(db, jobs[0].job.attachment_types);
      }
    } catch (e) {
      console.warn("insertCategoryLabelSqlite error:", e);
    }

    // Normalize local tables to current job set
    await cleanupWorkOrderSqlite(db, jobs);
    await cleanupContactSqlite(db, jobs);
    await cleanupCheckInOutSqlite(db, jobs);
    await cleanupAttachmentSqlite(db, jobs);
    await cleanupFinalCheckOutSqlite(db, jobs);

    for (const job of jobs) {
      try {
        await insertWorkOrderSqlite(db, job);
      } catch (e) {
        console.error("SQLite insert error:", e);
      }
    }

    // The API doesn't know about locally-completed jobs, so INSERT OR REPLACE
    // above can overwrite workflow_step_label back to "Scheduled". Re-apply
    // "Completed" for any work order that has a final_checkout record.
    try {
      const completedIds = await db.getAllAsync(
        "SELECT DISTINCT job_purchase_order_id FROM final_checkout",
      );
      for (const { job_purchase_order_id } of completedIds) {
        await updateWorkOrderSqlite(
          db,
          "workflow_step_label",
          "Completed",
          "id",
          job_purchase_order_id,
        );
      }
    } catch (e) {
      console.warn("restoreCompletedStatus error:", e);
    }

    const sqliteJobs = await selectWorkOrderSqlite(db, "user_id", user.user_id);
    setJobResult(sqliteJobs);
    incrementSyncVersion();
  };

  /** ATTACHMENTS **/
  const syncPendingAttachments = async (token) => {
    const pending = await selectAttachmentSqlite(
      db,
      "submittedToARC",
      "Pending",
    );
    if (!pending?.length) return;

    await Promise.allSettled(
      pending.map(async (att) => {
        try {
          const res =
            att.type === "Photo"
              ? await postPhotosApi(token, att)
              : await postDocumentsApi(token, att);

          att.submittedToARC = res?.status === 200 ? "Yes" : "Pending";
          await updateAttachmentSqlite(db, att);
        } catch (e) {
          console.warn("Attachment sync failed:", e);
          att.submittedToARC = "Pending";
          await updateAttachmentSqlite(db, att);
        }
      }),
    );
  };

  /** CHECK IN AND OUT **/
  const syncPendingCheckInOut = async (token) => {
    const pending = await selectCheckInOutSqlite(
      db,
      "submittedToARC",
      "Pending",
    );

    if (!pending?.length) return;

    for (const item of pending) {
      try {
        const ok = await postCheckInOutApi(item, token);
        if (ok) {
          await updateCheckInOutSqlite(db, "Yes", item.id);
        } else {
          // Server rejected — stop here. The next sync will retry, and
          // fetchAndStoreJobs will dedup any record the server already accepted.
          console.warn("Check-in/out rejected by server, stopping:", item.id);
          break;
        }
      } catch (err) {
        // Network or parse error — stop and retry on next sync.
        console.warn("Check-in/out network error, stopping:", {
          id: item.id,
          err: String(err),
        });
        break;
      }
      // Give the server time to process each record before posting the next.
      await delay(1000);
    }
  };

  /** FINAL CHECKOUT **/
  const syncPendingFinalCheckouts = async (token) => {
    const pending = await selectFinalCheckOutSqlite(
      db,
      "submittedToARC",
      "Pending",
    );

    if (!pending?.length) return;

    await Promise.allSettled(
      pending.map(async (record) => {
        try {
          const listRes = await postFinalCheckListApi(token, record);
          if (listRes) {
            const checkoutRes = await postFinalCheckoutApi(
              token,
              record.desc_misc_notes,
              record.job_purchase_order_id,
            );
            if (checkoutRes) {
              await updateFinalCheckOutSqlite(
                db,
                "submittedToARC",
                "Yes",
                "job_purchase_order_id",
                record.job_purchase_order_id,
              );
              await updateWorkOrderSqlite(
                db,
                "workflow_step_label",
                "Completed",
                "id",
                record.job_purchase_order_id,
              );
            }
          }
        } catch (err) {
          console.warn(
            `Final checkout failed for job ${record.job_purchase_order_id}`,
            err,
          );
        }
      }),
    );
  };

  /** MAIN SYNC PIPELINE **/
  const fetchAndStoreUserProfile = async (user) => {
    try {
      const profile = await getUserProfileApi(user);
      if (profile) {
        delete profile.id;
        await updateUserSqlite(db, { ...profile, username: user.username });
      }
    } catch (error) {
      console.error("fetchAndStoreUserProfile failed:", error);
    }
  };

  const runSyncTasks = async (user) => {
    const token = user.access_token;
    await syncPendingCheckInOut(token);
    await syncPendingFinalCheckouts(token);
    await syncPendingAttachments(token);
    await delay(2000);
    await Promise.all([
      fetchAndStoreJobs(user),
      fetchAndStoreUserProfile(user),
    ]);
  };

  /** PUBLIC REFRESH HANDLER **/
  const onRefresh = useCallback(async () => {
    if (refreshing || syncLock.isProcessing) return;

    setRefreshing(true);
    syncLock.isProcessing = true;

    try {
      const network = await Network.getNetworkStateAsync();
      if (!network.isConnected || network.isInternetReachable === false) {
        showOnceAlert(
          "noInternet",
          "No internet connection",
          "Please try again when you have internet access.",
        );
        return;
      }

      const user = await getAuthenticatedUser();
      if (!user) return;

      await runSyncTasks(user);

      if (typeof fetchPhotos === "function") await fetchPhotos();
      if (typeof fetchFiles === "function") await fetchFiles();

      if (typeof onSyncSuccess === "function") {
        onSyncSuccess("Sync successful");
      }
    } catch (err) {
      console.error("Manual refresh error:", err);
      Alert.alert(
        "Sync Error",
        "Some data could not be synced. Check logs for details.",
      );
    } finally {
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
      setRefreshing(false);
      syncLock.isProcessing = false;
    }
  }, [refreshing, fetchPhotos, fetchFiles]);

  const manageSession = useCallback(async () => {
    if (syncLock.didInitSession) return;
    syncLock.didInitSession = true;

    try {
      const user = await getAuthenticatedUser({ silent: true });
      if (!user) {
        navigation.navigate("Login");
        return;
      }
      await runSyncTasks(user);

      if (autoNavigateHome) navigation.navigate("Home");
    } catch (error) {
      console.error("Error managing session:", error);
      Alert.alert("An error occurred. Please try again.");
      setJobResult([]);
    }
  }, [autoNavigateHome]);

  useEffect(() => {
    manageSession();
  }, [manageSession]);

  useAppFocusRefresh(onRefresh);

  return { refreshing, onRefresh, scrollViewRef };
}

export default function AppSyncManager({
  children,
  fetchPhotos,
  fetchFiles,
  autoNavigateHome = true,
}) {
  const [bannerVisible, setBannerVisible] = React.useState(false);
  const [bannerText, setBannerText] = React.useState("");

  const showBanner = (text = "Sync successful") => {
    setBannerText(text);
    setBannerVisible(true);
    setTimeout(() => setBannerVisible(false), 3000);
  };

  const { refreshing, onRefresh, scrollViewRef } = useAppSync({
    fetchPhotos,
    fetchFiles,
    autoNavigateHome,
    onSyncSuccess: showBanner,
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
      {bannerVisible && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: "#01ab52",
            zIndex: 9999,
          }}
        >
          <Text
            style={{ color: "white", textAlign: "center", fontWeight: "600" }}
          >
            {bannerText}
          </Text>
        </View>
      )}
      <BannerOnPendingSync />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={StyleSheet.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
