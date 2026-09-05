import axios from "axios";
import { getUnixTime } from "date-fns";
import { environment } from "../Config";

//---------------API Functions---------------//

export async function getCheckInOutApi(token, id) {
  try {
    const response = await axios.get(
      environment.apiUrl + `/VISITS/${id}.json`,
      { params: { auth: token } },
    );
    const results = response.data;
    if (!results) return [];
    return Object.values(results).map((visit) => ({
      ...visit,
      id: visit.visit_date,
    }));
  } catch (error) {
    console.log("Get check-in/out API call failed:", error);
    return [];
  }
}

export async function postCheckInOutApi(data, token) {
  try {
    await axios.put(
      environment.apiUrl +
        `/VISITS/${data.assignment_id}/${data.visit_date}.json`,
      {
        comment: data.comment,
        departing: data.departing,
        crew_member_id: data.crew_member_id,
        assignment_id: data.assignment_id,
        visit_date: data.visit_date,
      },
      { params: { auth: token } },
    );
    return true;
  } catch (error) {
    console.log(
      "Post check-in/out API error:",
      error.response?.data?.error || error.message,
    );
    return false;
  }
}

//---------------SQLITE Functions---------------//

export async function insertCheckInOutSqlite(db, data) {
  try {
    if (data.visit_date == null || data.visit_date === "") {
      data = { ...data, visit_date: getUnixTime(new Date()) };
    }

    const columns = Object.keys(data).filter(
      (key) => data[key] !== undefined && data[key] !== null,
    );
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((key) => data[key]);

    await db.runAsync(
      `INSERT OR REPLACE INTO visit (${columns.join(", ")}) VALUES (${placeholders})`,
      values,
    );
  } catch (error) {
    console.log("Insert check-in/out failed:", error);
  }
}

export async function selectCheckInOutSqlite(
  db,
  key,
  value,
  orderBy = "id",
  order = "ASC",
) {
  try {
    return await db.getAllAsync(
      `SELECT * FROM visit WHERE ${key} = ? ORDER BY ${orderBy} ${order}`,
      [value],
    );
  } catch (error) {
    console.log("Select check-in/out failed:", error);
    return [];
  }
}

export async function deleteCheckInOutDuplicatesSqlite(db, serverRecord) {
  if (
    serverRecord.id == null ||
    serverRecord.visit_date == null ||
    serverRecord.assignment_id == null
  ) {
    return;
  }

  try {
    await db.runAsync(
      `DELETE FROM visit
       WHERE assignment_id = ?
         AND visit_date = ?
         AND departing = ?
         AND id != ?`,
      [
        serverRecord.assignment_id,
        serverRecord.visit_date,
        serverRecord.departing,
        serverRecord.id,
      ],
    );
  } catch (error) {
    console.log("Delete duplicate check-in/out failed:", error);
  }
}

export async function updateCheckInOutSqlite(db, value, id) {
  try {
    await db.runAsync("UPDATE visit SET syncStatus = ? WHERE id = ?", [
      value,
      id,
    ]);
  } catch (error) {
    console.log("Update check-in/out failed:", error);
  }
}

export async function cleanupCheckInOutSqlite(db, value) {
  try {
    const workOrderIds = (value ?? []).map((item) => item.assignment.id);

    if (!workOrderIds.length) {
      await db.runAsync("DELETE FROM visit");
      return;
    }

    const placeholders = workOrderIds.map(() => "?").join(", ");
    await db.runAsync(
      `DELETE FROM visit WHERE assignment_id NOT IN (${placeholders})`,
      workOrderIds,
    );
  } catch (error) {
    console.log("Clean up check-in/out failed:", error);
  }
}
