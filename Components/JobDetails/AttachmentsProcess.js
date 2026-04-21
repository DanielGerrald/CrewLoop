import { useCallback, useState } from "react";
import * as Network from "expo-network";

import {
  postDocumentsApi,
  postPhotosApi,
  updateAttachmentSqlite,
} from "../../Database/AttachmentDatabase";
import { showOnceAlert } from "../AlertManager";
import syncLock from "../SyncLock";

export function attachmentsProcess(db, token, attachments, refreshAttachments) {
  const [isProcessing, setIsProcessing] = useState(false);

  const processPendingAttachments = useCallback(async () => {
    const pendingAttachments = attachments.filter(
      (att) => att.submittedToARC === "No" || att.submittedToARC === "Pending",
    );

    if (syncLock.isProcessing || pendingAttachments.length === 0) return;

    syncLock.isProcessing = true;
    setIsProcessing(true);

    try {
      let networkState = await Network.getNetworkStateAsync();
      let hasInternet =
        networkState.isConnected && networkState.isInternetReachable === true;

      if (!hasInternet) {
        await Promise.all(
          pendingAttachments.map(async (att) => {
            if (att.submittedToARC !== "Pending") {
              att.submittedToARC = "Pending";
              await updateAttachmentSqlite(db, att);
            }
          }),
        );

        showOnceAlert(
          "noInternet",
          "No internet connection",
          "Attachments were marked as pending. Please try again when you have internet access.",
        );

        await refreshAttachments();
        return;
      }

      for (const att of pendingAttachments) {
        try {
          att.submittedToARC = "Uploading";
          await updateAttachmentSqlite(db, att);

          networkState = await Network.getNetworkStateAsync();
          hasInternet =
            networkState.isConnected &&
            networkState.isInternetReachable === true;

          if (!hasInternet) {
            att.submittedToARC = "Pending";
            await updateAttachmentSqlite(db, att);
            break;
          }

          const response =
            att.type === "Photo"
              ? await postPhotosApi(token, att)
              : await postDocumentsApi(token, att);

          att.submittedToARC = response?.status === 200 ? "Yes" : "Pending";
          await updateAttachmentSqlite(db, att);
        } catch (error) {
          console.log(`Upload failed for attachment ID ${att.id}:`, error);

          att.submittedToARC = "Pending";
          try {
            await updateAttachmentSqlite(db, att);
          } catch (dbErr) {
            console.log("Failed to revert attachment to Pending:", dbErr);
          }

          networkState = await Network.getNetworkStateAsync();
          hasInternet =
            networkState.isConnected &&
            networkState.isInternetReachable === true;

          if (!hasInternet) {
            showOnceAlert(
              "noInternetDuringUpload",
              "Internet disconnected",
              "Some attachments were uploaded. Others were marked as pending. Try again once you're reconnected.",
            );
            break;
          }
        }
      }

      await refreshAttachments();
    } catch (err) {
      console.log("Error processing attachments:", err);
    } finally {
      syncLock.isProcessing = false;
      setIsProcessing(false);
    }
  }, [attachments, db, refreshAttachments, token]);

  return { processPendingAttachments, isProcessing };
}
