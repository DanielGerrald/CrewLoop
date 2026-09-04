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
    console.log("Assignments API call:", error);
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

    console.log("Insert / update Work Order function ran");
  } catch (error) {
    console.log("Insert / update Work Order function failed:", error);
  }
}

export async function selectWorkOrderSqlite(db, key, value) {
  try {
    const query = `SELECT * FROM assignment WHERE ${key} = ?`;
    const results = await db.getAllAsync(query, [value]);
    return results;
  } catch (error) {
    console.log("Select SQLITE work orders failed:", error);
  }
}

export async function updateWorkOrderSqlite(db, key1, value1, key2, value2) {
  try {
    await db.runAsync(
      `UPDATE assignment SET (${key1}) = ? WHERE (${key2}) = ?`,
      [value1, value2],
    );
    console.log("Update work order function ran");
  } catch (error) {
    console.log("Update work order function failed:", error);
  }
}

export async function cleanupWorkOrderSqlite(db, value) {
  try {
    const workOrderIds = value.map((item) => item.assignment.id);
    const placeholders = workOrderIds.map(() => "?").join(", ");

    const query = `DELETE FROM assignment WHERE id NOT IN (${placeholders})`;

    await db.runAsync(query, workOrderIds);

    console.log("Clean up SQLITE work orders function ran");
  } catch (error) {
    console.log("Clean up SQLITE work orders failed:", error);
  }
}
