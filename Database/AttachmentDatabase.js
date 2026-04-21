import axios from "axios";

import { environment } from "../Config";

//---------------API Functions---------------//

const instance = axios.create({
  baseURL: environment.apiUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  params: {
    apikey: environment.apikey,
  },
});

const postInstance = axios.create({
  baseURL: environment.apiUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "multipart/form-data",
  },
  params: {
    apikey: environment.apikey,
  },
});

export async function postDocumentsApi(token, document) {
  const formData = new FormData();
  formData.append("documents[]", {
    uri: document.uri,
    name: document.fileName,
    type: document.mimeType,
  });
  formData.append("JobAttachment[type_id]", document.label_id);

  const response = await postInstance.post(
    "/uploadWorkOrderDocument",
    formData,
    {
      headers: {
        TOKEN: token,
      },
      params: {
        id: document.workord_id,
      },
    },
  );

  console.log("Upload successful for document:", document.fileName);
  return response;
}

export async function postPhotosApi(token, photo) {
  const formData = new FormData();
  formData.append("photos[]", {
    uri: photo.uri,
    name: photo.fileName,
    type: photo.mimeType,
  });
  formData.append("JobAttachment[type_id]", photo.label_id);

  const response = await postInstance.post("/uploadWorkOrderPhoto", formData, {
    headers: {
      TOKEN: token,
    },
    params: {
      id: photo.workord_id,
    },
  });

  console.log("Upload successful for photo:", photo.fileName);
  return response;
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
      if (value !== undefined && value !== null) {
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
    const workOrderIds = value.map((item) => item.work_order.id);
    const placeholders = workOrderIds.map(() => "?").join(", ");

    const query = `DELETE FROM attachment WHERE job_purchase_order_id NOT IN (${placeholders})`;

    await db.runAsync(query, workOrderIds);

    console.log("Clean up SQLITE Attachment function ran");
  } catch (error) {
    console.log("Clean up SQLITE Attachment failed:", error);
  }
}
