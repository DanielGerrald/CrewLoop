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

export async function getWorkOrderApi(data) {
  try {
    const response = await instance.get("/workOrders", {
      headers: {
        TOKEN: data.access_token,
      },
    });
    return Promise.resolve(response.data.results);
  } catch (error) {
    console.log("WorkOrders API call:", error);
  }
}

export async function getWorkOrderDetailsApi(access_token, id) {
  try {
    const response = await instance.get("/workOrderDetails", {
      headers: {
        TOKEN: access_token,
      },
      params: {
        id: id,
      },
    });
    return Promise.resolve(response.data.results);
  } catch (error) {
    console.log("WorkOrderDetails API call:", error);
  }
}

export async function getCompletedWorkOrderApi(token) {
  try {
    const response = await instance.get("/completedWorkOrders", {
      headers: {
        TOKEN: token,
      },
    });
    return Promise.resolve(response.data.results);
  } catch (error) {
    console.log("ERROR Completed WorkOrder API call:", error);
  }
}

//---------------SQLITE Functions---------------//

export async function insertWorkOrderSqlite(db, data) {
  try {
    const customer = data.customer || {};
    const jobData = data.job || {};
    const workOrder = data.work_order || {};
    delete jobData.attachment_types;
    const { id, ...rest } = jobData;
    const newJobData = { job_id: id, ...rest };

    const newData = { ...customer, ...newJobData, ...workOrder };

    const columns = Object.keys(newData).filter(
      (key) => newData[key] !== undefined && newData[key] !== null,
    );

    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((key) => newData[key]);
    await db.runAsync(
      `INSERT OR REPLACE INTO workorder (${columns.join(", ")}) VALUES (${placeholders})`,
      [...values],
    );

    console.log("Insert / update Work Order function ran");
  } catch (error) {
    console.log("Insert / update Work Order function failed:", error);
  }
}

export async function selectWorkOrderSqlite(db, key, value) {
  try {
    const query = `SELECT * FROM workorder WHERE ${key} = ?`;
    const results = await db.getAllAsync(query, [value]);
    return results;
  } catch (error) {
    console.log("Select SQLITE work orders failed:", error);
  }
}

export async function updateWorkOrderSqlite(db, key1, value1, key2, value2) {
  try {
    await db.runAsync(
      `UPDATE workorder SET (${key1}) = ? WHERE (${key2}) = ?`,
      [value1, value2],
    );
    console.log("Update work order function ran");
  } catch (error) {
    console.log("Update work order function failed:", error);
  }
}

export async function cleanupWorkOrderSqlite(db, value) {
  try {
    const workOrderIds = value.map((item) => item.work_order.id);
    const placeholders = workOrderIds.map(() => "?").join(", ");

    const query = `DELETE FROM workorder WHERE id NOT IN (${placeholders})`;

    await db.runAsync(query, workOrderIds);

    console.log("Clean up SQLITE work orders function ran");
  } catch (error) {
    console.log("Clean up SQLITE work orders failed:", error);
  }
}
