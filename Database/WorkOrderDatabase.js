import axios from "axios";

import { environment } from "../Config";

//---------------API Functions---------------//

export async function getAssignmentsApi(idToken) {
  try {
    const response = await axios.get(environment.apiUrl + "/ASSIGNMENTS.json", {
      params: { auth: idToken },
    });
    const results = response.data;
    if (!results) return [];
    return Object.entries(results)
      .filter(([, job]) => job && job.assignment)
      .map(([key, job]) => ({
        ...job,
        assignment: {
          ...job.assignment,
          id: Number(job.assignment.id ?? key),
          completed: job.assignment.completed ? 1 : 0,
        },
      }));
  } catch (error) {
    console.log("Assignments API call failed:", error);
    return [];
  }
}

export async function patchAssignmentApi(idToken, id, fields) {
  try {
    await axios.patch(
      environment.apiUrl + `/ASSIGNMENTS/${id}/assignment.json`,
      fields,
      { params: { auth: idToken } },
    );
    return true;
  } catch (error) {
    console.log(
      "patchAssignmentApi Error:",
      error.response?.data ?? error.message,
    );
    return false;
  }
}

//---------------SQLITE Functions---------------//

export async function insertWorkOrderSqlite(db, data) {
  try {
    const customer = data.client || {};
    const jobData = data.site || {};
    const workOrder = data.assignment || {};
    delete jobData.attachment_types;
    const { id, ...rest } = jobData;
    const newJobData = { site_id: id, ...rest };

    const newData = { ...customer, ...newJobData, ...workOrder };

    const columns = Object.keys(newData).filter(
      (key) => newData[key] !== undefined && newData[key] !== null,
    );

    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((key) => newData[key]);
    await db.runAsync(
      `INSERT OR REPLACE INTO assignment (${columns.join(", ")}) VALUES (${placeholders})`,
      [...values],
    );
  } catch (error) {
    console.log("Insert/update work order failed:", error);
  }
}

export async function selectWorkOrderSqlite(db, key, value) {
  try {
    return await db.getAllAsync(`SELECT * FROM assignment WHERE ${key} = ?`, [
      value,
    ]);
  } catch (error) {
    console.log("Select work orders failed:", error);
  }
}

export async function updateWorkOrderSqlite(db, key1, value1, key2, value2) {
  try {
    await db.runAsync(
      `UPDATE assignment SET ${key1} = ? WHERE ${key2} = ?`,
      [value1, value2],
    );
  } catch (error) {
    console.log("Update work order failed:", error);
  }
}

export async function cleanupWorkOrderSqlite(db, value) {
  try {
    const workOrderIds = (value ?? []).map((item) => item.assignment.id);

    if (!workOrderIds.length) {
      await db.runAsync("DELETE FROM assignment");
      return;
    }

    const placeholders = workOrderIds.map(() => "?").join(", ");
    await db.runAsync(
      `DELETE FROM assignment WHERE id NOT IN (${placeholders})`,
      workOrderIds,
    );
  } catch (error) {
    console.log("Clean up work orders failed:", error);
  }
}
