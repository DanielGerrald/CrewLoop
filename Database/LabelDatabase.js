import axios from "axios";
import { environment } from "../Config";

//---------------API Functions---------------//

export async function getLabelsApi(idToken) {
  try {
    const response = await axios.get(
      environment.apiUrl + "/ATTACHMENT_TYPES.json",
      { params: { auth: idToken } },
    );
    return response.data || undefined;
  } catch (error) {
    console.error("getLabelsApi Error:", error.response?.data ?? error.message);
  }
}

async function insertCategoryTypeRows(db, rows) {
  for (const row of rows) {
    const columns = Object.keys(row).filter(
      (key) => row[key] !== undefined && row[key] !== null,
    );
    if (columns.length === 0) continue;

    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((key) => row[key]);

    try {
      await db.runAsync(
        `INSERT OR IGNORE INTO category_type (${columns.join(", ")}) VALUES (${placeholders})`,
        values,
      );
    } catch (error) {
      console.error("Error inserting category type row:", error);
    }
  }
}

function reduceLabelArray(value, labelType) {
  // Firebase RTDB omits empty arrays and returns sparse arrays as objects,
  // so `value` may be undefined or a plain object here.
  const arr = Array.isArray(value) ? value : Object.values(value ?? {});
  return arr.reduce((accumulator, item) => {
    accumulator[item.type_id] = { ...item, type_group: labelType };
    return accumulator;
  }, {});
}

//---------------SQLITE Functions---------------//

export async function insertCategoryLabelSqlite(db, labels) {
  if (!labels) return;

  const documentTypes = reduceLabelArray(labels.document_types, "Document Label");
  const photoTypes = reduceLabelArray(labels.photo_types, "Photo Label");
  const commentTypes = reduceLabelArray(labels.comment_types, "Comment Label");

  const merged = { ...documentTypes, ...photoTypes, ...commentTypes };
  await insertCategoryTypeRows(db, Object.values(merged));
}

export async function selectCategoryLabelSqlite(db, key, value) {
  try {
    return await db.getAllAsync(
      `SELECT * FROM category_type WHERE ${key} = ?`,
      [value],
    );
  } catch (error) {
    console.error("Select category labels failed:", error);
  }
}
