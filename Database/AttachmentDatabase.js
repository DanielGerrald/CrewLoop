import axios from "axios";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

import { environment } from "../Config";

//---------------API Functions---------------//

// Firebase keys can't contain ".", "#", "$", "/", "[", "]".
const sanitizeKey = (value) => String(value).replace(/[.#$/[\]]/g, "_");

async function putAttachment(token, data) {
  // Photos are captured/picked at full quality (several MB), which after
  // base64 inflation (~33%) can make the write body large enough that
  // Firebase's REST API rejects it with a generic "Invalid data; couldn't
  // parse JSON" error. Downscale + recompress photos before upload — the
  // full-quality original stays on-device untouched, only the remote copy
  // is smaller. Documents (PDFs) can't be resized this way, so they still
  // read their raw bytes.
  let base64;
  if (data.type === "Photo") {
    const resized = await ImageManipulator.manipulateAsync(
      data.uri,
      [{ resize: { width: 1600 } }],
      {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      },
    );
    base64 = resized.base64;
  } else {
    base64 = await FileSystem.readAsStringAsync(data.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  const key = sanitizeKey(data.fileName);

  await axios.put(
    environment.apiUrl + `/ATTACHMENTS/${data.assignment_ref_id}/${key}.json`,
    {
      fileName: data.fileName,
      label: data.label,
      label_id: data.label_id,
      type: data.type,
      assignment_id: data.assignment_id,
      assignment_ref_id: data.assignment_ref_id,
      mimeType: data.mimeType,
      date: data.date,
      base64,
    },
    { params: { auth: token } },
  );

  return { status: 200 };
}

export async function postPhotosApi(token, photo) {
  try {
    const result = await putAttachment(token, photo);
    console.log("Upload successful for photo:", photo.fileName);
    return result;
  } catch (error) {
    console.log(
      "Upload photo error:",
      error.response?.data?.error || error.message,
    );
    return { status: 500 };
  }
}

export async function postDocumentsApi(token, document) {
  try {
    const result = await putAttachment(token, document);
    console.log("Upload successful for document:", document.fileName);
    return result;
  } catch (error) {
    console.log(
      "Upload document error:",
      error.response?.data?.error || error.message,
    );
    return { status: 500 };
  }
}


export async function getAttachmentsApi(token, id) {
  try {
    const response = await axios.get(
      environment.apiUrl + `/ATTACHMENTS/${id}.json`,
      { params: { auth: token } },
    );
    const results = response.data;
    if (!results) return [];

    const attachments = [];
    for (const item of Object.values(results)) {
      if (!item?.fileName || !item?.base64) continue;

      const uri = `${FileSystem.documentDirectory}${sanitizeKey(item.fileName)}`;
      try {
        await FileSystem.writeAsStringAsync(uri, item.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (writeError) {
        console.log("Failed writing attachment to disk:", writeError);
        continue;
      }

      attachments.push({
        fileName: item.fileName,
        label: item.label,
        label_id: item.label_id,
        type: item.type,
        assignment_id: item.assignment_id,
        assignment_ref_id: item.assignment_ref_id,
        mimeType: item.mimeType,
        date: item.date,
        uri,
        syncStatus: "Yes",
      });
    }
    return attachments;
  } catch (error) {
    console.log(
      "Get attachments API error:",
      error.response?.data ?? error.message,
    );
    return [];
  }
}

//---------------SQLITE Functions---------------//

export async function insertAttachmentSqlite(db, data) {
  try {
    if (data.length >= 0) {
      for (const obj of data) {
        const columns = Object.keys(obj).filter(
          (key) => obj[key] !== undefined && obj[key] !== null,
        );
        const placeholders = columns.map(() => "?").join(", ");
        const values = columns.map((key) => obj[key]);

        await db.runAsync(
          `INSERT INTO attachment (${columns.join(", ")})
             VALUES (${placeholders})`,
          [...values],
        );
        console.log("Insert attachment function ran");
      }
    } else {
      const obj = data;

      const columns = Object.keys(obj).filter(
        (key) => obj[key] !== undefined && obj[key] !== null,
      );
      const placeholders = columns.map(() => "?").join(", ");
      const values = columns.map((key) => obj[key]);

      await db.runAsync(
        `INSERT INTO attachment (${columns.join(", ")})
           VALUES (${placeholders})`,
        [...values],
      );
      console.log("Insert attachment function ran");
    }
  } catch (error) {
    console.log("Insert attachment function failed:", error);
  }
}

export async function selectAttachmentSqlite(db, key1, value1, key2, value2) {
  try {
    let query = `SELECT * FROM attachment WHERE ${key1} = ?`;
    const values = [value1];

    // If both key2 and value2 are provided, add them to the query
    if (key2 && value2) {
      query += ` AND ${key2} = ?`;
      values.push(value2);
    }

    const results = await db.getAllAsync(query, values);
    return results;
  } catch (error) {
    console.error("ERROR Select SQLITE attachments failed:", error);
  }
}

export async function updateAttachmentSqlite(db, data) {
  try {
    const fieldsToUpdate = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (key !== "id" && value !== undefined && value !== null) {
        fieldsToUpdate.push(`${key} = ?`);
        values.push(value);
      }
    }
    await db.runAsync(
      `UPDATE attachment
         SET ${fieldsToUpdate.join(", ")}
         WHERE fileName = ?`,
      [...values, data.fileName],
    );
    console.log("Update attachment function ran");
  } catch (error) {
    console.log("Update attachment function failed:", error);
  }
}

export async function deleteAttachmentSqlite(db, id) {
  try {
    await db.runAsync(`DELETE FROM attachment WHERE id = ?`, [id]);
    console.log("Delete attachment function ran");
  } catch (error) {
    console.log("Delete SQLITE attachments failed:", error);
  }
}

export async function cleanupAttachmentSqlite(db, value) {
  try {
    const workOrderIds = value.map((item) => item.assignment.id);
    const placeholders = workOrderIds.map(() => "?").join(", ");

    const query = `DELETE FROM attachment WHERE assignment_id NOT IN (${placeholders})`;

    await db.runAsync(query, workOrderIds);

    console.log("Clean up SQLITE Attachment function ran");
  } catch (error) {
    console.log("Clean up SQLITE Attachment failed:", error);
  }
}
